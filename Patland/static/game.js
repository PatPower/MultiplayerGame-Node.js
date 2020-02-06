var socket = io();
var currPlayer = {}; // Current Player Object
var playerList = {};
var defaultActions = {};

// Setup the canvases
var bgcxt;
var strcxt;
var pcxt;
var opcxt;
var ovlycxt;

// Send to server that a player joined
socket.emit('new player', name);

/** 
 * Server sends info needed to setup client
 * currentPlayer is the currentplayerObj
 * pList is a dict of playerObj with the id as key
 * ground2D is a 2D array of the local ground map
 * structure2D is a 2D array of the local structure map
 * defaultActions is a dict with all the default actions binded to each structure for the player
 * {structureId: actionId}
*/
socket.on('setup', function (currentPlayer, pList, ground2D, structure2D, defaultActs) {
    currPlayer = currentPlayer;
    playerList = pList;
    defaultActions = defaultActs;
    loadLocationMap(ground2D, structure2D, pList, currPlayer);
    bgcxt = setupBackground(document.getElementById('background'));
    strcxt = setupStructure(document.getElementById('structure'));
    pcxt = setupCurrentPlayer(document.getElementById('player'));
    opcxt = setupOtherPlayers(document.getElementById('otherPlayers'));
    ovlycxt = setupOverlay(document.getElementById('overlay'));
    updateTileMarker(currPlayer);
    projectSquares(pList);
    projectSquare(currentPlayer, {});
    initalizeInvItems();
});

socket.on('moveCurrPlayer', function (player, pList, ground2D, structure2D) {
    currPlayer = player
    playerList = pList;
    loadLocationMap(ground2D, structure2D, pList, currPlayer);
    updateBackgroundCanvas();
    updateStructureCanvas()
    projectSquares(playerList);
    updateTileMarker(currPlayer);
});

socket.on('removeStructure', function (location) {
    removeStructure(location);
    updateStructureCanvas()
});

socket.on('placeStructure', function (location, structObj) {
    placeStructure(location, structObj);
    updateStructureCanvas()
});

socket.on('othPlayerMove', function (othP, movement) {
    if (othP.id == currPlayer.id) {
        console.log("Error: othPlayerMove sent current player")
        return;
    }
    // Other player moves out of view
    if (checkIfNewCoordsOutBounds(othP, movement)) {
        removePlayer(othP);
        return;
    }
    // Other player moves in view
    if (!playerList[othP.id]) {
        addPlayer(getNewCoordsLocation(othP, movement));
        return;
    }
    var relCoords = getRelativeCoords(othP)
    // Removes the old player projection
    removeProjectedPlayer(othP, relCoords)
    // Finds the moving player in the playerList array
    var playerObj = playerList[othP.id];
    // TODO: Check if the moving player is moving out of the bounds (should be an error)
    if (playerObj) {
        var newP = getNewCoordsLocation(othP, movement);
        // Change the i, j values for the player in the playerList array
        playerObj.i = newP.i
        playerObj.j = newP.j
    } else {
        console.log("Error: playerObj not found in playerMove");
        return;
    }
    // Shows the new location of the player
    projectSquare(newP, getNewCoordsLocation(relCoords, movement));
    // Move the player in the locationMap
    movePlayer(othP, movement);
    console.log("othMove") // remove
});

socket.on('playerJoin', function (playerObj) {
    addPlayer(playerObj);
});

socket.on('playerRemove', function (playerObj) {
    removePlayer(playerObj);
});

/**
 * item: the new item
 * pos: the position of the new item (starts at 0)
 * inventoryChanges: [ { item: { id: int, durability: int }, pos: int } , ... ]
 */
socket.on('playerInventoryUpdate', function (inventoryChanges) {
    updateInventory(inventoryChanges);
})

/**
 * item: the new item
 * pos: the position of the new item (starts at 0)
 * inventoryChanges: [ { item: { id: int, durability: int }, pos: int } , ... ]
 */
socket.on('playerInventorySizeUpdate', function (inventorySize, newInventory) {
    updateInvSize(inventorySize);
    currPlayer.inventory = newInventory;
})

// TODO: make a socket that gets responses for invalid movement or actions done

socket.on('message', function (msg) {
    console.log(msg);
});

/**
 * Sends the server a request for an action to be performed
 * @param {*} id id of the structure being interacted with
 * @param {*} actionId a1, a2 or a3 depending if action1, action2 or action3
 * @param {*} location the location of the interacted structure
 */
function sendPlayerAction(id, actionId, location) {
    socket.emit("pAction", id, actionId, location);
}

/**
 * Sends the server a request for an action to be performed
 * @param {*} id id of the item being interacted with
 * @param {*} actionId a1, a2 or a3 depending if action1, action2 or action3
 * @param {*} invSlot the slot of the item being used
 */
function sendPlayerInvAction(id, actionId, invSlot) {
    socket.emit("invAction", id, actionId, invSlot);
}

function emitMovement(movement) {
    socket.emit('movement', movement);
}

/**
 * Sends the server two positions of items being swapped (starting from 0)
 * @param {*} pos1 
 * @param {*} pos2 
 */
function emitItemSwap(pos1, pos2) {
    socket.emit('itemSwap', pos1, pos2);
}

/**
 * Sends the server of a request to build a structure at the given location
 * @param {*} itemId 
 * @param {*} actionId 
 * @param {*} invSlot 
 * @param {*} buildLoc 
 */
function emitBuild(itemId, actionId, invSlot, buildLoc) {
    socket.emit('build', itemId, actionId, invSlot, buildLoc);
}

function setupBackground(canvas) {
    // Background
    canvas.width = CWIDTH;
    canvas.height = CHEIGHT;
    var bgcxt = canvas.getContext('2d');
    for (var i = 0; i < NUMCOL; i++) {
        for (var j = 0; j < NUMROW; j++) {
            if (locationMap[i][j].ground.backgroundColor) {
                bgcxt.fillStyle = locationMap[i][j].ground.backgroundColor;
                bgcxt.fillRect(BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
            } else {
                bgcxt.clearRect(BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
            }
        }
    }
    return bgcxt;
}

function setupStructure(canvas) {
    canvas.width = CWIDTH;
    canvas.height = CHEIGHT
    var strcxt = canvas.getContext('2d');
    loadImages(function (imgList) {
        for (var i = 0; i < NUMCOL; i++) {
            for (var j = 0; j < NUMROW; j++) {
                if (locationMap[i][j].structure.sprite) {
                    strcxt.drawImage(imgList[locationMap[i][j].structure.id], BOXSIDE * i, BOXSIDE * j)
                }
            }
        }
    });
    return strcxt;
}

function setupOverlay(canvas) {
    canvas.width = CWIDTH;
    canvas.height = CHEIGHT;
    var ovlycxt = canvas.getContext('2d');
    for (var i = 0; i < NUMCOL; i++) {
        for (var j = 0; j < NUMROW; j++) {
            ovlycxt.strokeRect(BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
        }
    }
    return bgcxt;
}

function setupCurrentPlayer(canvas) {
    // Current Player
    canvas.width = CWIDTH;
    canvas.height = CHEIGHT;
    return canvas.getContext('2d');
}

function setupOtherPlayers(canvas) {
    // Other Players
    canvas.width = CWIDTH;
    canvas.height = CHEIGHT;
    return canvas.getContext('2d');
}

function updateBackgroundCanvas() {
    // Background
    //bgcxt.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < NUMCOL; i++) {
        for (var j = 0; j < NUMROW; j++) {
            if (locationMap[i][j].ground.backgroundColor) {
                bgcxt.fillStyle = locationMap[i][j].ground.backgroundColor;
                bgcxt.fillRect(BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
            } else {
                bgcxt.clearRect(BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
            }
        }
    }
}

function updateStructureCanvas() {
    strcxt.clearRect(0, 0, CWIDTH, CHEIGHT);
    loadImages(function (imgList) {
        for (var i = 0; i < NUMCOL; i++) {
            for (var j = 0; j < NUMROW; j++) {
                if (locationMap[i][j].structure.sprite) {
                    strcxt.drawImage(imgList[locationMap[i][j].structure.id], BOXSIDE * i, BOXSIDE * j)
                }
            }
        }
    });
}

// Projects all the squares in the squaresObj object
function projectSquares(squaresObj) {
    opcxt.clearRect(0, 0, CWIDTH, CHEIGHT);
    for (var index in squaresObj) {
        projectSquare(squaresObj[index], getRelativeCoords(squaresObj[index]));
    }
}

// Projects a square using the i and j in playerObj. Sets the current player as cyan.
function projectSquare(playerObj, relCoords) {
    // Other players
    if (playerObj.id != currPlayer.id) {
        opcxt.fillStyle = playerObj.color;
        opcxt.fillRect(BOXSIDE * relCoords.i, BOXSIDE * relCoords.j, BOXSIDE, BOXSIDE);
        opcxt.fillStyle = 'blue';
        opcxt.font = "12px Arial";
        opcxt.fillText(playerObj.name, BOXSIDE * relCoords.i, BOXSIDE * relCoords.j + 10);
    } else { // Current players
        pcxt.fillStyle = 'cyan';
        pcxt.fillRect(BOXSIDE * 10, BOXSIDE * 7, BOXSIDE, BOXSIDE);
        pcxt.fillStyle = 'blue'
        pcxt.font = "12px Arial";
        pcxt.fillText(playerObj.name, BOXSIDE * 10, BOXSIDE * 7 + 10);
    }
}
/**
 * 
 * @param {*} playerObj The player being removed from the screen
 */
function removeProjectedPlayer(playerObj, relCoords) {
    var otherPlayer = findPlayerByCoords(playerObj)
    // If there is a player on top of the moving player
    if (otherPlayer && playerList[playerObj.id]) {
        // If current player being removed
        if (playerObj.id == currPlayer.id) {
            pcxt.clearRect(BOXSIDE * relCoords.i, BOXSIDE * relCoords.j, BOXSIDE, BOXSIDE);
        }
        opcxt.clearRect(BOXSIDE * relCoords.i, BOXSIDE * relCoords.j, BOXSIDE, BOXSIDE);
        var relCoords = getRelativeCoords(otherPlayer)
        projectSquare(otherPlayer, relCoords);
        return;
    } else {
        // Other players
        if (playerObj.id != currPlayer.id) {
            opcxt.clearRect(BOXSIDE * relCoords.i, BOXSIDE * relCoords.j, BOXSIDE, BOXSIDE);
        } else { // Current players
            pcxt.clearRect(BOXSIDE * relCoords.i, BOXSIDE * relCoords.j, BOXSIDE, BOXSIDE);
        }
    }
}

function removePlayer(playerObj) {
    if (playerList[playerObj.id]) {
        var relCoords = getRelativeCoords(playerObj);
        removePlayerFromMap(playerObj, relCoords);
        removeProjectedPlayer(playerObj, relCoords);
        delete playerList[playerObj.id]
    } else {
        console.log("Error: player not found when player being removed")
    }
}

function addPlayer(playerObj) {
    playerList[playerObj.id] = playerObj;
    var relCoords = getRelativeCoords(playerObj)
    addOtherPlayerToLocationMap(getTrueRange(currPlayer), playerObj)
    projectSquare(playerObj, relCoords);
}

function findPlayerByCoords(playerObj) {
    for (id in playerList) {
        // Finds the user with the same coords thats not itself
        if (playerList[id].i == playerObj.i && playerList[id].j == playerObj.j && id != playerObj.id) {
            return playerList[id];
        }
    }
}

/**
 * 
 * @param {*} newObj an object with elements i and j (works with playerObjects)
 * @param {*} movement movement object
 */
function getNewCoordsLocation(oldObj, movement) {
    var newObj = JSON.parse(JSON.stringify(oldObj))
    if (movement.left) { newObj.i -= 1; }
    if (movement.right) { newObj.i += 1; }
    if (movement.up) { newObj.j -= 1; }
    if (movement.down) { newObj.j += 1; }
    return newObj;
}

function checkIfNewCoordsOutBounds(player, movement) {
    var relCoords = getRelativeCoords(getNewCoordsLocation(player, movement));
    if (relCoords.i < 0 || relCoords.i >= NUMCOL) {
        return true;
    }
    if (relCoords.j < 0 || relCoords.j >= NUMROW) {
        return true;
    }
    return false;
}

function defaultAction(structId, location) {
    var structObj = getStructureObj({ id: structId, health: 0, owner: "game" });
    if (structObj) {
        if (structId in defaultActions) {
            var defaultAction = "a" + defaultAction[structId];
            if (structObj.action[defaultAction]) {
                sendPlayerAction(structId, defaultAction[structId], location);
            }
        }
        console.log(structObj)
        if (structObj.actions["a1"]) {
            sendPlayerAction(structId, "a1", location);
        }
    }
}
