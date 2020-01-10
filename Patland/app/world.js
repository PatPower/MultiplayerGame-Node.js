var Settings = require('./settings.js');
var JsonController = require('./jsonController.js')();
var socketController = require('./socketController.js');

function World() {
    var data = getDataFromDB();
    this.worldStructureMap = data.worldStructureMap;
    this.worldGroundMap = data.worldGroundMap;
    this.worldPlayerMap = data.worldPlayerMap;
    this.pFlags = data.pFlags;
    this.players = {};
    this.moveLog = {};
    this.initializeTestMap();
}

World.prototype.getStructureMap = function () {
    return this.worldStructureMap;
}

World.prototype.getGroundMap = function () {
    return this.worldGroundMap;
}

World.prototype.getPlayerMap = function () {
    return this.worldPlayerMap;
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
            if (this.worldPlayerMap[i][j].length > 0) {
                for (othplayer of this.worldPlayerMap[i][j]) {
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
                ground2D[i - range.truelefti][j - range.truetopj] = this.worldGroundMap[i][j];
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
                structure2D[i - range.truelefti][j - range.truetopj] = this.worldStructureMap[i][j];
            }
        }
    }
    return structure2D;
}

World.prototype.removePlayerLocation = function (player) {
    // Remove the old player location
    var pIndex = this.worldPlayerMap[player.i][player.j].findIndex(o => o.id == player.id);
    if (pIndex >= 0) {
        this.worldPlayerMap[player.i][player.j].splice(pIndex, 1);
    } else {
        console.log("ERROR: player not found when removing location");
    }
}

// TODO: Save this into a database/file later
World.prototype.addPlayerLocation = function (player) {
    this.worldPlayerMap[player.i][player.j].push(player);
}

/**
* Checks if the structure is in a 3x3 vicinity of the player
* @param {*} player an object with an i and j
* @param {*} structure another object with an i and j
*/
World.prototype.checkIfInteractible = function (player, structure) {
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            if (player.i + i == structure.i && player.j + j == structure.j) {
                return true;
            }
        }
    }
    return false;
}

World.prototype.createPlayer = function (id, pname) {
    var player;
    // TODO: make a system to save a player and load it
    // If player exists load it
    if (false) {

    } else {
        // else create new player
        player = {
            id: id,
            i: 10,
            j: 7,
            name: pname,
            inventory: [{ id: 0, durability: 50 }, null, { id: 1, durability: 50 }, null],
            inventorySize: 5,
            skills: {
                "mining": { level: 1, experience: 0 },
                "woodcutting": { level: 1, experience: 0 }
            },
            color: 'red'
        }
        this.setPlayer(id, player);
        this.addPlayerLocation(player);
        this.createPFlag(id);
    }
    socketController.setup(this.getPlayer(id), this.getLocal2DPlayerDict(id), this.getLocal2DGround(player), this.getLocal2DStructure(player));
    var range = getIJRange(player.i, player.j);
    for (var i = range.lefti; i <= range.righti; i++) {
        for (var j = range.topj; j <= range.bottomj; j++) {
            if (this.worldPlayerMap[i][j].length > 0) {
                for (othplayer of this.worldPlayerMap[i][j]) {
                    if (othplayer.id != player.id) {
                        socketController.playerJoin(othplayer, this.getPlayer(id));
                    }
                }
            }
        }
    }
    this.moveLog[id] = [];
    this.moveLog[id].push((new Date).getTime());
}

World.prototype.disconnectPlayer = function (id) {
    var dcPlayer = this.getPlayer(id);
    if (dcPlayer) {
        console.log("dc", id)
        var range = getIJRange(dcPlayer.i, dcPlayer.j);
        this.removePlayerLocation(dcPlayer);
        for (var i = range.lefti; i <= range.righti; i++) {
            for (var j = range.topj; j <= range.bottomj; j++) {
                if (this.worldPlayerMap[i][j].length > 0) {
                    for (othplayer of this.worldPlayerMap[i][j]) {
                        socketController.playerRemove(othplayer, id);
                        this.deletePlayer(id);
                    }
                }
            }
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
        if (player.i - 1 >= 0 && this.structurePassable(this.worldStructureMap[player.i - 1][player.j])) {
            player.i--;
        } else {
            data.left = false;
            // Show user that movement is blocked
        }
    }
    if (data.right) {
        if (player.i + 1 < Settings.WORLDLIMIT && this.structurePassable(this.worldStructureMap[player.i + 1][player.j])) {
            player.i++;
        } else {
            data.right = false;
            // Show user that movement is blocked
        }
    }
    if (data.up) {
        if (player.j - 1 >= 0 && this.structurePassable(this.worldStructureMap[player.i][player.j - 1])) {
            player.j--;
        } else {
            data.up = false;
            // Show user that movement is blocked
        }
    }
    if (data.down) {
        if (player.j + 1 < Settings.WORLDLIMIT && this.structurePassable(this.worldStructureMap[player.i][player.j + 1])) {
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
            if (this.worldPlayerMap[i][j].length > 0) {
                for (othplayer of this.worldPlayerMap[i][j]) {
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
    this.worldStructureMap[location.i][location.j] = null;
    var range = getIJRange(location.i, location.j);
    for (var i = range.lefti; i <= range.righti; i++) {
        for (var j = range.topj; j <= range.bottomj; j++) {
            if (this.worldPlayerMap[i][j].length > 0) {
                for (othPlayer of this.worldPlayerMap[i][j]) {
                    socketController.removeStructure(othPlayer, location);
                }
            }
        }
    }
}

World.prototype.initializeTestMap = function () {
    this.worldStructureMap = [...Array(Settings.WORLDLIMIT)].map(e => Array(Settings.WORLDLIMIT));
    this.worldStructureMap[2][2] = { id: 1, health: 10, owner: "game" };
    this.worldGroundMap = [...Array(Settings.WORLDLIMIT)].map(e => Array(Settings.WORLDLIMIT));
    this.worldPlayerMap = [...Array(Settings.WORLDLIMIT)].map(e => Array(Settings.WORLDLIMIT));
    for (i = 0; i < Settings.WORLDLIMIT; i++) {
        for (j = 0; j < Settings.WORLDLIMIT; j++) {
            this.worldPlayerMap[i][j] = []
            this.worldGroundMap[i][j] = 0;
        }
    }
    console.log("TestMap Initalized!")

}

/**
 * Used to verify if the location contains the structure
 */
World.prototype.verifyStructureLocation = function (location, id) {
    if (this.worldStructureMap[location.i][location.j]) {
        return (this.worldStructureMap[location.i][location.j].id == id);
    }
    return false;
};

World.prototype.itemSwap = function (id, pos1, pos2) {
    var player = this.getPlayer(id);
    var oldItem = player.inventory[pos2];
    player.inventory[pos2] = player.inventory[pos1];
    player.inventory[pos1] = oldItem;
    var inventoryChanges = [{ item: oldItem, pos: pos1 }, { item: player.inventory[pos2], pos: pos2 }]
    socketController.playerInventoryUpdate(player, player.inventorySize, inventoryChanges)
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