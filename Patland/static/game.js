var socket = io();
var currPlayer = {} // Current Player Object
var playerList = {}

// Setup the canvases
var bgcxt;
var strcxt;
var pcxt;
var opcxt;
var ovlycxt;

// Send to server that a player joined
socket.emit('new player', name);

// Server sends info needed to setup client
// pList is a dict of playerObj with the id as key
// currentPlayer is the currentplayerObj
socket.on('setup', function (pList, currentPlayer, ground2D, structure2D) {
    currPlayer = currentPlayer;
    playerList = pList;
    loadLocationMap(ground2D, structure2D, pList, currPlayer);
    bgcxt = setupBackground(document.getElementById('background'));
    strcxt = setupStructure(document.getElementById('structure'));
    pcxt = setupCurrentPlayer(document.getElementById('player'));
    opcxt = setupOtherPlayers(document.getElementById('otherPlayers'));
    ovlycxt = setupOverlay(document.getElementById('overlay'));

    updateTileMarker(currPlayer);
    projectSquares(pList);
    projectSquare(currentPlayer, {});
});

socket.on('moveCurrPlayer', function (player, pList, ground2D, structure2D) {
    currPlayer.i = player.i;
    currPlayer.j = player.j
    playerList = pList;
    loadLocationMap(ground2D, structure2D, pList, currPlayer);
    updateBackgroundCanvas();
    updateStructureCanvas()
    projectSquares(playerList);
    updateTileMarker(currPlayer);
})

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
    var relCoords = getRelativeCoords(othP, currPlayer)
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
    movePlayer(othP, movement, currPlayer);
    console.log("othMove") // remove
});

socket.on('playerJoin', function (playerObj) {
    addPlayer(playerObj);
});

socket.on('playerRemove', function (playerObj) {
    removePlayer(playerObj);
});

// TODO: make a socket that gets responses for invalid movement or actions done

socket.on('message', function (msg) {
    console.log(msg);
});

// The object being sent to server to move the character
var movement = {
    up: false,
    down: false,
    left: false,
    right: false
}

var firstKeyHold = true;
document.addEventListener('keydown', function (event) {
    if (event.keyCode == 87) { movement.up = true; } //W 
    if (event.keyCode == 68) { movement.right = true; } //D
    if (event.keyCode == 83) { movement.down = true; } //S
    if (event.keyCode == 65) { movement.left = true; } //A
});

document.addEventListener('keyup', function (event) {
    if (event.keyCode == 87) { movement.up = false; } //W 
    if (event.keyCode == 68) { movement.right = false; } //D
    if (event.keyCode == 83) { movement.down = false; } //S
    if (event.keyCode == 65) { movement.left = false; } //A
    timeoutCounter = 0;
    firstKeyHold = true
});

// TimeoutCounter limits how fast the user can move from the client side
// FirstKeyHold makes the first press take a bit longer to move the player to allow easier tap movement 
var timeoutCounter = 0;
setInterval(function () {
    if (timeoutCounter >= 1) { timeoutCounter--; return false; }
    if (movement.up || movement.right || movement.down || movement.left) {
        if (firstKeyHold) { timeoutCounter = 8; firstKeyHold = false } else { timeoutCounter = 3; }
        socket.emit('movement', movement);
    }
}, 40);


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
        projectSquare(squaresObj[index], getRelativeCoords(squaresObj[index], currPlayer));
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
        var relCoords = getRelativeCoords(otherPlayer, currPlayer)
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
        var relCoords = getRelativeCoords(playerObj, currPlayer);
        removePlayerFromMap(playerObj, relCoords);
        removeProjectedPlayer(playerObj, relCoords);
        delete playerList[playerObj.id]
    } else {
        console.log("Error: player not found when player being removed")
    }
}

function addPlayer(playerObj) {
    playerList[playerObj.id] = playerObj;
    var relCoords = getRelativeCoords(playerObj, currPlayer)
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
    var relCoords = getRelativeCoords(getNewCoordsLocation(player, movement), currPlayer);
    if (relCoords.i < 0 || relCoords.i >= NUMCOL) {
        return true;
    }
    if (relCoords.j < 0 || relCoords.j >= NUMROW) {
        return true;
    }
    return false;
}

/**
 * Sends the server a request for an action to be performed
 * @param {*} id id of the structure being interacted with
 * @param {*} actionId 1, 2 or 3 depending if action1, action2 or action3
 */
function sendPlayerAction(id, actionId) {
    socket.emit("pAction", id, actionId);
}