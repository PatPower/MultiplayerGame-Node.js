var Settings = require('./settings.js');
var JsonController = require('./jsonController.js')();
var socketController = require('./socketController.js');
var worldStructureMap = [];
var worldGroundMap = [];
var worldPlayerMap = [];

function World(database) {
    this.database = database;
    var data = getDataFromDB();
    worldStructureMap = data.worldStructureMap;
    worldGroundMap = data.worldGroundMap;
    worldPlayerMap = data.worldPlayerMap;
    this.pFlags = data.pFlags;
    this.players = {};
    this.moveLog = {};
    initializeTestMap();
}

World.prototype.getStructureMap = function () {
    return worldStructureMap;
}

World.prototype.getGroundMap = function () {
    return worldGroundMap;
}

World.prototype.getPlayerMap = function () {
    return worldPlayerMap;
}

/**
* Gets a 2D list of players in viewing distance of the given player and returns a dict of players
* @param {*} player 
*/
World.prototype.getLocal2DPlayerDict = function (player) {
    var localPlayerDict = {};
    var range = getIJRange(player.i, player.j);
    for (var i = range.lefti; i <= range.righti; i++) {
        for (var j = range.topj; j <= range.bottomj; j++) {
            if (worldPlayerMap[i][j].length > 0) {
                for (othplayer of worldPlayerMap[i][j]) {
                    localPlayerDict[othplayer.id] = othplayer;
                }
            }
        }
    }
    return localPlayerDict;
}

/**
 * Returns a 2D list of ground ids near the player.
 * If player is near the border, the id of the ground outside border will be null
 * @param {} player 
 */
World.prototype.getLocal2DGround = function (player) {
    var ground2D = [...Array(Settings.NUMCOL)].map(e => Array(Settings.NUMROW));
    var range = getIJRange(player.i, player.j);
    for (var j = range.truetopj; j <= range.truebottomj; j++) {
        for (var i = range.truelefti; i <= range.truerighti; i++) {
            if (i >= 0 && i <= Settings.WORLDLIMIT - 1 && j >= 0 && j <= Settings.WORLDLIMIT - 1) {
                ground2D[i - range.truelefti][j - range.truetopj] = worldGroundMap[i][j];
            }
        }
    }
    return ground2D;
}

/**
 * Returns a 2D list of structureInfo objects near the player.
 * @param {} player 
 */
World.prototype.getLocal2DStructure = function (player) {
    var structure2D = [...Array(Settings.NUMCOL)].map(e => Array(Settings.NUMROW));
    var range = getIJRange(player.i, player.j);
    for (var j = range.truetopj; j <= range.truebottomj; j++) {
        for (var i = range.truelefti; i <= range.truerighti; i++) {
            if (i >= 0 && i <= Settings.WORLDLIMIT - 1 && j >= 0 && j <= Settings.WORLDLIMIT - 1) {
                structure2D[i - range.truelefti][j - range.truetopj] = worldStructureMap[i][j];
            }
        }
    }
    return structure2D;
}

World.prototype.removePlayerLocation = function (player) {
    // Remove the old player location
    var pIndex = worldPlayerMap[player.i][player.j].findIndex(o => o.id == player.id);
    if (pIndex >= 0) {
        worldPlayerMap[player.i][player.j].splice(pIndex, 1);
    } else {
        console.log("ERROR: player not found when removing location");
    }
}

// TODO: Save this into a database/file later
World.prototype.addPlayerLocation = function (player) {
    worldPlayerMap[player.i][player.j].push(player);
}

/**
* Checks if the location is in a 3x3 vicinity of the player
* @param {*} player an object with an i and j
* @param {*} location another object with an i and j
*/
World.prototype.checkIfInteractible = function (player, location) {
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            if (player.i + i == location.i && player.j + j == location.j) {
                return true;
            }
        }
    }
    return false;
}

World.prototype.createPlayer = async function (id, user) {
    var player;
    
    try {
        console.log('🌍 World.createPlayer called:');
        console.log('  Socket ID:', id);
        console.log('  User:', user);
        
        // Try to load existing player data from database
        console.log('📂 Checking for existing player data...');
        var savedPlayer = await this.database.getPlayer(user.id);
        
        if (savedPlayer) {
            console.log('✅ Found existing player data');
            // Load existing player
            player = {
                id: id,
                userId: user.id,
                i: savedPlayer.position.i,
                j: savedPlayer.position.j,
                name: savedPlayer.name,
                email: savedPlayer.email,
                inventory: savedPlayer.inventory,
                inventorySize: savedPlayer.inventorySize,
                skills: savedPlayer.skills,
                color: savedPlayer.color
            };
            
            // Update last login
            savedPlayer.lastLogin = new Date().toISOString();
            await this.database.savePlayer(user.id, savedPlayer);
        } else {
            console.log('🆕 Creating new player data');
            // Create new player in database
            var newPlayerData = await this.database.createPlayer(user.id, user.email, user.name);
            
            player = {
                id: id,
                userId: user.id,
                i: newPlayerData.position.i,
                j: newPlayerData.position.j,
                name: newPlayerData.name,
                email: newPlayerData.email,
                inventory: newPlayerData.inventory,
                inventorySize: newPlayerData.inventorySize,
                skills: newPlayerData.skills,
                color: newPlayerData.color
            };
        }
        
        console.log('📍 Player object created:', {
            id: player.id,
            position: { i: player.i, j: player.j },
            inventorySize: player.inventorySize,
            name: player.name
        });
        
        console.log('🏗️ Setting up player in world...');
        this.setPlayer(id, player);
        this.addPlayerLocation(player);
        this.createPFlag(id);
        
        console.log('📡 Emitting setup event...');
        socketController.setup(this.getPlayer(id), this.getLocal2DPlayerDict(player), this.getLocal2DGround(player), this.getLocal2DStructure(player), {});
        
        console.log('👥 Notifying other players...');
        var range = getIJRange(player.i, player.j);
        for (var i = range.lefti; i <= range.righti; i++) {
            for (var j = range.topj; j <= range.bottomj; j++) {
                if (worldPlayerMap[i][j].length > 0) {
                    for (othplayer of worldPlayerMap[i][j]) {
                        if (othplayer.id != player.id) {
                            socketController.playerJoin(othplayer, this.getPlayer(id));
                        }
                    }
                }
            }
        }
        
        console.log('⏰ Initializing movement log...');
        this.moveLog[id] = [];
        this.moveLog[id].push((new Date).getTime());
        
        console.log('✅ Player creation and setup complete!');
        
    } catch (error) {
        console.error('❌ Error in createPlayer:', error);
        console.error('Stack trace:', error.stack);
        throw error;
    }
}

World.prototype.disconnectPlayer = async function (id) {
    var dcPlayerObj = this.getPlayer(id);
    if (dcPlayerObj) {
        // Save player data to database before disconnecting
        try {
            await this.savePlayerToDatabase(dcPlayerObj);
        } catch (error) {
            console.error('Error saving player data on disconnect:', error);
        }
        
        var range = getIJRange(dcPlayerObj.i, dcPlayerObj.j);
        this.removePlayerLocation(dcPlayerObj);
        for (var i = range.lefti; i <= range.righti; i++) {
            for (var j = range.topj; j <= range.bottomj; j++) {
                if (worldPlayerMap[i][j].length > 0) {
                    for (othplayer of worldPlayerMap[i][j]) {
                        socketController.playerRemove(othplayer, dcPlayerObj);
                    }
                }
            }
        }
        this.deletePlayer(id);
    }
}

World.prototype.savePlayerToDatabase = async function (player) {
    if (player.userId && this.database) {
        try {
            await this.database.updatePlayerInventory(player.userId, player.inventory, player.inventorySize);
            await this.database.updatePlayerPosition(player.userId, { i: player.i, j: player.j });
            await this.database.updatePlayerSkills(player.userId, player.skills);
        } catch (error) {
            console.error('Error saving player to database:', error);
            throw error;
        }
    }
}

World.prototype.movePlayer = function (id, data) {
    // Checks if user exists
    if (!this.moveLog[id]) {
        socketController.message(id, "You are not connected to the server.")
        return
    }
    var currMoveLog = this.moveLog[id];

    // Checks if the user has moved more than MAXSPEED tiles in 2 seconds
    if (currMoveLog[this.moveLog[id].length - 1] - currMoveLog[0] <= this.MILLISECONDMAX && currMoveLog.length >= this.MAXSPEED) { console.log("TOO FAST!"); return; }

    var player = this.getPlayer(id);
    var oldPlayer = JSON.parse(JSON.stringify(player)); // For the client to remove old player tile

    // This part will be dangerous if unexpected power off
    // Remove the old player location
    this.removePlayerLocation(player);
    if (data.left) {
        if (player.i - 1 >= 0 && this.structurePassable(worldStructureMap[player.i - 1][player.j])) {
            player.i--;
        } else {
            data.left = false;
            // Show user that movement is blocked
        }
    }
    if (data.right) {
        if (player.i + 1 < Settings.WORLDLIMIT && this.structurePassable(worldStructureMap[player.i + 1][player.j])) {
            player.i++;
        } else {
            data.right = false;
            // Show user that movement is blocked
        }
    }
    if (data.up) {
        if (player.j - 1 >= 0 && this.structurePassable(worldStructureMap[player.i][player.j - 1])) {
            player.j--;
        } else {
            data.up = false;
            // Show user that movement is blocked
        }
    }
    if (data.down) {
        if (player.j + 1 < Settings.WORLDLIMIT && this.structurePassable(worldStructureMap[player.i][player.j + 1])) {
            player.j++;
        } else {
            data.down = false;
            // Show user that movement is blocked
        }
    }

    this.addPlayerLocation(player);

    if (this.moveLog[id].length >= this.MAXSPEED) {
        this.moveLog[id].shift();
        this.moveLog[id].push((new Date).getTime())
    } else {
        this.moveLog[id].push((new Date).getTime())
    }

    // If player did not move then do stop here
    if (!data.up && !data.right && !data.down && !data.left) {
        return;
    }

    var range = getIJRange(player.i, player.j);
    if (data.left) {
        if (range.righti < Settings.WORLDLIMIT - 1) {
            range.righti++;
        }
    }
    if (data.right) {
        if (range.lefti > 0) {
            range.lefti--;
        }
    }
    if (data.up) {
        if (range.bottomj < Settings.WORLDLIMIT - 1) {
            range.bottomj++;
        }
    }
    if (data.down) {
        if (range.topj > 0) {
            range.topj--;
        }
    }
    for (var i = range.lefti; i <= range.righti; i++) {
        for (var j = range.topj; j <= range.bottomj; j++) {
            if (worldPlayerMap[i][j].length > 0) {
                for (othplayer of worldPlayerMap[i][j]) {
                    if (othplayer.id != player.id) {
                        socketController.othPlayerMove(othplayer, oldPlayer, data);
                    }
                }
            }
        }
    }
    socketController.moveCurrPlayer(player, this.getLocal2DPlayerDict(player), this.getLocal2DGround(player), this.getLocal2DStructure(player));
}

World.prototype.structurePassable = function (structureInfo) {
    var passable = true;
    if (structureInfo) {
        passable = JsonController.isStructurePassable(structureInfo.id);
    }
    return passable;
}

World.prototype.getPlayer = function (id) {
    return this.players[id];
}

World.prototype.setPlayer = function (id, player) {
    this.players[id] = player;
}

World.prototype.deletePlayer = function (id) {
    delete this.players[id];
}

World.prototype.createPFlag = function (id) {
    this.pFlags[id] = [];
}

World.prototype.removeStructure = function (location) {
    worldStructureMap[location.i][location.j] = null;
    var range = getIJRange(location.i, location.j);
    for (var i = range.lefti; i <= range.righti; i++) {
        for (var j = range.topj; j <= range.bottomj; j++) {
            if (worldPlayerMap[i][j].length > 0) {
                for (othPlayer of worldPlayerMap[i][j]) {
                    socketController.removeStructure(othPlayer, location);
                }
            }
        }
    }
}

/**
 * location: location of the placed structure
 * structId: id of the structure
 * health: starting health of the structure
 * playerId of the user that placed the structure
 */
World.prototype.placeStructure = function (location, structId, health, playerId) {
    // TODO: do some checks
    var structObj = { id: structId, health: health, owner: playerId };
    worldStructureMap[location.i][location.j] = structObj;
    var range = getIJRange(location.i, location.j);
    for (var i = range.lefti; i <= range.righti; i++) {
        for (var j = range.topj; j <= range.bottomj; j++) {
            if (worldPlayerMap[i][j].length > 0) {
                for (othPlayer of worldPlayerMap[i][j]) {
                    socketController.placeStructure(othPlayer, location, structObj);
                }
            }
        }
    }
};


/**
 * Used to verify if the location contains the structure
 */
World.prototype.verifyStructureLocation = function (location, id) {
    if (worldStructureMap[location.i][location.j]) {
        return (this.getStructureAtLocation(location) == id);
    }
    return false;
};

World.prototype.getStructureAtLocation = function (location) {
    var structId;
    if (worldStructureMap[location.i][location.j]) {
        structId = worldStructureMap[location.i][location.j].id;
    }
    return structId;
}

World.prototype.getPlayersAtLocation = function (location) {
    return worldPlayerMap[location.i][location.j];
}

function initializeTestMap() {
    worldStructureMap = [...Array(Settings.WORLDLIMIT)].map(e => Array(Settings.WORLDLIMIT));
    worldStructureMap[2][2] = { id: 1, health: 10, owner: "game" };
    worldStructureMap[7][7] = { id: 2, health: 10, owner: "game" };
    worldStructureMap[10][6] = { id: 3, health: 10, owner: "game" };
    worldGroundMap = [...Array(Settings.WORLDLIMIT)].map(e => Array(Settings.WORLDLIMIT));
    worldPlayerMap = [...Array(Settings.WORLDLIMIT)].map(e => Array(Settings.WORLDLIMIT));
    for (var i = 0; i < Settings.WORLDLIMIT; i++) {
        for (var j = 0; j < Settings.WORLDLIMIT; j++) {
            worldPlayerMap[i][j] = []
            worldGroundMap[i][j] = 0;
        }
    }
    console.log("TestMap Initalized!")
}

/**
 * Swaps the positions of two items in the player's inventory
 */
World.prototype.itemSwap = async function (id, pos1, pos2) {
    // TODO: check for invalid positions
    var player = this.getPlayer(id);
    if (!player) {
        return;
    }
    console.log(player.inventory)

    var oldItem = player.inventory[pos2];
    player.inventory[pos2] = player.inventory[pos1];
    player.inventory[pos1] = oldItem;

    var inventoryChanges = [{ item: oldItem, pos: pos1 }, { item: player.inventory[pos2], pos: pos2 }]

    socketController.playerInventoryUpdate(player, inventoryChanges);
    
    // Save to database
    try {
        await this.savePlayerToDatabase(player);
    } catch (error) {
        console.error('Error saving inventory swap:', error);
    }
}

World.prototype.changeInvSize = async function (player, invAddAmount) {
    var newInvSize = player.inventorySize + invAddAmount;
    // Removes the inventory slots on the player object
    if (invAddAmount < 0) {
        for (var i = player.inventorySize - 1; i > newInvSize - 1; i--) {
            player.inventory.pop(i);
        }
    } else {
        // Adds null objects in the player object
        for (var i = player.inventorySize; i < newInvSize; i++) {
            player.inventory.push(null);
        }
    }
    if (newInvSize > 60) {
        socketController.playerInventorySizeUpdate(player, Settings.MAXINVSIZE, player.inventory);
        player.inventorySize = Settings.MAXINVSIZE;
    } else if (newInvSize < 0) {
        socketController.playerInventorySizeUpdate(player, 0, player.inventory);
        player.inventorySize = 0;
    } else if (invAddAmount != 0) {
        socketController.playerInventorySizeUpdate(player, newInvSize, player.inventory);
        player.inventorySize = newInvSize;
    }
    
    // Save to database
    try {
        await this.savePlayerToDatabase(player);
    } catch (error) {
        console.error('Error saving inventory size change:', error);
    }
}

/**
 * Removes items at the positions specified
 * @param {*} player player obj
 * @param {*} slot a list of inv pos (starting at 0)
 * @param {*} updateInv true to update player inv after removing
 */
World.prototype.removePlayerItem = async function (player, slot, updateInv) {
    console.log(slot, player.inventorySize)
    if (0 <= slot && slot < player.inventorySize) {
        player.inventory[slot] = null;
    } else {
        console.log("Error: removePlayerItem inv list out of range")
    }
    if (updateInv) {
        this.playerInventoryUpdate(player, [{ item: null, pos: slot }]);
    }
    
    // Save to database
    try {
        await this.savePlayerToDatabase(player);
    } catch (error) {
        console.error('Error saving item removal:', error);
    }
}

/**
 * Removes items at the positions specified
 * @param {*} player 
 * @param {*} itemObj itemObj
 */
World.prototype.addPlayerItem = async function (player, itemObj) {
    for (index in player.inventory) {
        if (!player.inventory[index]) {
            player.inventory[index] = itemObj;
            
            // Save to database
            try {
                await this.savePlayerToDatabase(player);
            } catch (error) {
                console.error('Error saving item addition:', error);
            }
            
            return parseInt(index);
        }
    }
    return -1;
}

/**
 * Verifies if a player has a specific item at a given slot or anywhere in inventory
 * @param {*} player The player object
 * @param {*} itemId The ID of the item to verify
 * @param {*} invSlot Optional - specific slot to check (0-based index)
 * @returns {Object|boolean} Returns item info object {slot, durability} if found, false if not found
 */
World.prototype.verifyPlayerItem = function (player, itemId, invSlot) {
    if (!player || !player.inventory) {
        return false;
    }
    
    // If specific slot is provided, check only that slot
    if (typeof invSlot !== 'undefined' && invSlot !== null) {
        if (invSlot >= 0 && invSlot < player.inventory.length) {
            var item = player.inventory[invSlot];
            if (item && item.id === itemId) {
                return {
                    slot: invSlot,
                    durability: item.durability || 0,
                    item: item
                };
            }
        }
        return false;
    }
    
    // Otherwise, search entire inventory for the item
    for (var i = 0; i < player.inventory.length; i++) {
        var item = player.inventory[i];
        if (item && item.id === itemId) {
            return {
                slot: i,
                durability: item.durability || 0,
                item: item
            };
        }
    }
    
    return false;
}

/**
 * Updates the player's inventory on the client side
 * @param {*} player 
 * @param {*} inventoryChanges 
 */
World.prototype.playerInventoryUpdate = function (player, inventoryChanges) {
    if (inventoryChanges && inventoryChanges.length > 0) {
        socketController.playerInventoryUpdate(player, inventoryChanges);
    }
}

/**
 * Updates a player's selected item and broadcasts to other players
 * @param {*} playerId The socket ID of the player
 * @param {*} selectedSlot The inventory slot selected (-1 for none)
 * @param {*} itemId The ID of the selected item (null if deselecting)
 */
World.prototype.updatePlayerSelection = function (playerId, selectedSlot, itemId) {
    var player = this.getPlayer(playerId);
    if (!player) {
        return;
    }
    
    // Update player's selection data
    player.selectedSlot = selectedSlot;
    player.selectedItemId = itemId;
    
    // Broadcast to other players in range
    var range = getIJRange(player.i, player.j);
    for (var i = range.lefti; i <= range.righti; i++) {
        for (var j = range.topj; j <= range.bottomj; j++) {
            if (worldPlayerMap[i][j].length > 0) {
                for (othPlayer of worldPlayerMap[i][j]) {
                    if (othPlayer.id != player.id) {
                        socketController.playerSelectionUpdate(othPlayer, {
                            id: player.id,
                            selectedSlot: selectedSlot,
                            selectedItemId: itemId
                        });
                    }
                }
            }
        }
    }
}
/**
 * Returns an object with the left/right bound and top/bottom bound of i and j respectively
 * If the player is near the border, the i's and j's will be either 0 or the Settings.WORLDLIMIT - 1
 * However the true i and j's will ignore the constraints above and can give < 0 or > Settings.WORLDLIMIT - 1
 * @param {*} i player's world i coordinate
 * @param {*} j player's world j coordinate
 */
function getIJRange(i, j) {
    var leftI = 0;
    var rightI = Settings.WORLDLIMIT - Settings.HORIZONTALRADIUS;
    var topJ = 0;
    var bottomJ = Settings.WORLDLIMIT - Settings.VERTICALRADIUS;
    // Used to get how close user is to the border
    var trueLeftI; var trueTopJ; var trueRightI; var trueBottomJ;
    trueLeftI = i - Settings.HORIZONTALRADIUS
    trueRightI = i + Settings.HORIZONTALRADIUS
    trueTopJ = j - Settings.VERTICALRADIUS
    trueBottomJ = j + Settings.VERTICALRADIUS
    if (i >= Settings.HORIZONTALRADIUS) { leftI = i - Settings.HORIZONTALRADIUS }
    if (i < Settings.WORLDLIMIT - Settings.HORIZONTALRADIUS) { rightI = i + Settings.HORIZONTALRADIUS };
    if (j >= Settings.VERTICALRADIUS) { topJ = j - Settings.VERTICALRADIUS }
    if (j < Settings.WORLDLIMIT - Settings.VERTICALRADIUS) { bottomJ = j + Settings.VERTICALRADIUS };
    return { lefti: leftI, righti: rightI, topj: topJ, bottomj: bottomJ, truelefti: trueLeftI, truetopj: trueTopJ, truerighti: trueRightI, truebottomj: trueBottomJ };
}

function getDataFromDB() {
    // TODO: actually get it from a DB
    return { worldStructureMap: [], worldGroundMap: [], worldPlayerMap: [], pFlags: {} }
}



module.exports = World;