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
socket.on('setup', function (pList, currentPlayer) {
    currPlayer = currentPlayer;
    playerList = pList;
    loadLocationMap([...Array(numCol)].map(e => Array(numRow)), [...Array(numCol)].map(e => Array(numRow)), pList, [...Array(numCol)].map(e => Array(numRow)), currPlayer);
    bgcxt = setupBackground(document.getElementById('background'));
    strcxt = setupStructure(document.getElementById('structure'));
    pcxt = setupCurrentPlayer(document.getElementById('player'));
    opcxt = setupOtherPlayers(document.getElementById('otherPlayers'));
    ovlycxt = setupOverlay(document.getElementById('overlay'));


    projectSquares(pList);
    projectSquare(currentPlayer, {});
});

socket.on('moveCurrPlayer', function (player, pList) {
    currPlayer.i = player.i;
    currPlayer.j = player.j
    playerList = pList;
    loadLocationMap([...Array(numCol)].map(e => Array(numRow)), [...Array(numCol)].map(e => Array(numRow)), pList, [...Array(numCol)].map(e => Array(numRow)), currPlayer);

    projectSquares(playerList);
    // TODO update background and structures
})

//TODO: Change to unit based movement
// Turn (oldP, newP) to (othP, movement)
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

socket.on('playerProject', function (playerObj) {
    console.log("player Join", playerObj, currPlayer) //remove
    addPlayer(playerObj);
});

socket.on('playerRemove', function (playerObj) {
    removePlayer(playerObj);
});

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
    canvas.width = cWidth;
    canvas.height = cHeight;
    var bgcxt = canvas.getContext('2d');
    for (var i = 0; i < numCol; i++) {
        for (var j = 0; j < numRow; j++) {
            if (locationMap[i][j].ground.backgroundColor) {
                bgcxt.fillStyle = locationMap[i][j].ground.backgroundColor;
                bgcxt.fillRect(boxSide * i, boxSide * j, boxSide, boxSide);
            }
        }
    }
    return bgcxt;
}

function setupStructure(canvas) {
    canvas.width = cWidth;
    canvas.height = cHeight
    var strcxt = canvas.getContext('2d');
    loadImages(function (imgList) {
        for (var i = 0; i < numCol; i++) {
            for (var j = 0; j < numRow; j++) {
                if (locationMap[i][j].structure.sprite) {
                    strcxt.drawImage(imgList[locationMap[i][j].structure.id], boxSide * i, boxSide * j)
                }
            }
        }
    });
    return strcxt;
}

function setupOverlay(canvas) {
    canvas.width = cWidth;
    canvas.height = cHeight;
    var ovlycxt = canvas.getContext('2d');
    for (var i = 0; i < numCol; i++) {
        for (var j = 0; j < numRow; j++) {
            ovlycxt.strokeRect(boxSide * i, boxSide * j, boxSide, boxSide);
        }
    }
    return bgcxt;
}

function setupCurrentPlayer(canvas) {
    // Current Player
    canvas.width = cWidth;
    canvas.height = cHeight;
    return canvas.getContext('2d');
}

function setupOtherPlayers(canvas) {
    // Other Players
    canvas.width = cWidth;
    canvas.height = cHeight;
    return canvas.getContext('2d');
}

function updateBackgroundCanvas() {
    // Background
    //bgcxt.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < numCol; i++) {
        for (var j = 0; j < numRow; j++) {
            if (locationMap[i][j].ground.backgroundColor) {
                bgcxt.fillStyle = locationMap[i][j].ground.backgroundColor;
                bgcxt.fillRect(boxSide * i, boxSide * j, boxSide, boxSide);
            }
        }
    }
}

function updateStructureCanvas() {
    //strcxt.clearRect(0, 0, canvas.width, canvas.height);
    loadImages(function (imgList) {
        for (var i = 0; i < numCol; i++) {
            for (var j = 0; j < numRow; j++) {
                if (locationMap[i][j].structure.sprite) {
                    strcxt.drawImage(imgList[locationMap[i][j].structure.id], boxSide * i, boxSide * j)
                }
            }
        }
    });
}

// Projects all the squares in the squaresObj object
function projectSquares(squaresObj) {
    opcxt.clearRect(0, 0, cWidth, cHeight);
    for (var index in squaresObj) {
        projectSquare(squaresObj[index], getRelativeCoords(squaresObj[index], currPlayer));
    }
}

// Projects a square using the i and j in playerObj. Sets the current player as cyan.
function projectSquare(playerObj, relCoords) {
    // Other players
    if (playerObj.id != currPlayer.id) {
        opcxt.fillStyle = playerObj.color;
        opcxt.fillRect(boxSide * relCoords.i, boxSide * relCoords.j, boxSide, boxSide);
        opcxt.fillStyle = 'blue';
        opcxt.font = "12px Arial";
        opcxt.fillText(playerObj.name, boxSide * relCoords.i, boxSide * relCoords.j + 10);
    } else { // Current players
        pcxt.fillStyle = 'cyan';
        pcxt.fillRect(boxSide * 10, boxSide * 7, boxSide, boxSide);
        pcxt.fillStyle = 'blue'
        pcxt.font = "12px Arial";
        pcxt.fillText(playerObj.name, boxSide * 10, boxSide * 7 + 10);
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
            pcxt.clearRect(boxSide * relCoords.i, boxSide * relCoords.j, boxSide, boxSide);
        }
        opcxt.clearRect(boxSide * relCoords.i, boxSide * relCoords.j, boxSide, boxSide);
        var relCoords = getRelativeCoords(otherPlayer, currPlayer)
        projectSquare(otherPlayer, relCoords);
        return;
    } else {
        // Other players
        if (playerObj.id != currPlayer.id) {
            opcxt.clearRect(boxSide * relCoords.i, boxSide * relCoords.j, boxSide, boxSide);
        } else { // Current players
            pcxt.clearRect(boxSide * relCoords.i, boxSide * relCoords.j, boxSide, boxSide);
        }
    }
}

function removePlayer(playerObj) {
    var relCoords = getRelativeCoords(playerObj, currPlayer);
    removePlayerFromMap(playerObj, relCoords);
    removeProjectedPlayer(playerObj, relCoords);
    delete playerList[playerObj.id]
}

function addPlayer(playerObj) {
    playerList[playerObj.id] = playerObj;
    var relCoords = getRelativeCoords(playerObj, currPlayer)
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
    console.log(relCoords.i, relCoords.j)
    if (relCoords.i < 0 || relCoords.i >= numCol) {
        return true;
    }
    if (relCoords.j < 0 || relCoords.j >= numRow) {
        return true;
    }
    return false;
}
