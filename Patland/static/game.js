var socket = io();
var currPlayer = {} // Current Player Object
var playerList = {}

// Setup the canvases
var bgcxt;
var pcxt;
var opcxt;
var ovlycxt;

// Send to server that a player joined
socket.emit('new player', name);

// Server sends info needed to setup client
// pList is a dict of playerObj with the id as key
// currentPlayer is the currentplayerObj
socket.on('setup', function (pList, currentPlayer) {
    setupLocationMap([...Array(numRow)].map(e => Array(numCol)),[...Array(numRow)].map(e => Array(numCol)), pList, [...Array(numRow)].map(e => Array(numCol)));
    bgcxt = setupBackground(document.getElementById('background'));
    pcxt = setupCurrentPlayer(document.getElementById('player'));
    opcxt = setupOtherPlayers(document.getElementById('otherPlayers'));
    ovly = setupOverlay(document.getElementById('overlay'));
    currPlayer = currentPlayer;
    playerList = pList;
    projectSquares(pList);
    projectSquare(currentPlayer);
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
    for (var i = 0; i < numRow; i++) {
        for (var j = 0; j < numCol; j++) {
            if (locationMap[i][j].ground.backgroundColor) {
                bgcxt.fillStyle = locationMap[i][j].ground.backgroundColor;
                bgcxt.fillRect(boxSide * i, boxSide * j, boxSide, boxSide);
            }
            bgcxt.strokeRect(boxSide * i, boxSide * j, boxSide, boxSide);
        }
    }
    return bgcxt;
}

function setupOverlay(canvas) {
    canvas.width = cWidth;
    canvas.height = cHeight;
    var bgcxt = canvas.getContext('2d');
    for (var i = 0; i < numRow; i++) {
        for (var j = 0; j < numCol; j++) {
            bgcxt.strokeRect(boxSide * i, boxSide * j, boxSide, boxSide);
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

// Projects all the squares in the squaresObj object
function projectSquares(squaresObj) {
    for (var index in squaresObj) {
        projectSquare(squaresObj[index]);
    }
}

// Projects a square using the i and j in playerObj. Sets the current player as cyan.
function projectSquare(playerObj) {
    // Other players
    if (playerObj.id != currPlayer.id) {
        opcxt.fillStyle = playerObj.color;
        opcxt.fillRect(boxSide * playerObj.i, boxSide * playerObj.j, boxSide, boxSide);
        opcxt.fillStyle = 'blue';
        opcxt.font = "12px Arial";
        opcxt.fillText(playerObj.name, boxSide * playerObj.i, boxSide * playerObj.j + 10);
    } else { // Current players
        pcxt.fillStyle = 'cyan';
        pcxt.fillRect(boxSide * playerObj.i, boxSide * playerObj.j, boxSide, boxSide);
        pcxt.fillStyle = 'blue'
        pcxt.font = "12px Arial";
        pcxt.fillText(playerObj.name, boxSide * playerObj.i, boxSide * playerObj.j + 10);
    }
}
/**
 * 
 * @param {*} playerObj The player being removed from the screen
 */
function removeProjectedPlayer(playerObj) {
    var otherPlayer = findPlayerByCoords(playerObj)
    // If player is found and removed player has not disconnected
    if (otherPlayer && playerList[playerObj.id]) {
        if (playerObj.id == currPlayer.id) {
            pcxt.clearRect(boxSide * playerObj.i, boxSide * playerObj.j, boxSide, boxSide);
        }
        projectSquare(otherPlayer);
        return;
    }
    // Other players
    if (playerObj.id != currPlayer.id) {
        opcxt.clearRect(boxSide * playerObj.i, boxSide * playerObj.j, boxSide, boxSide);
    } else { // Current players
        pcxt.clearRect(boxSide * playerObj.i, boxSide * playerObj.j, boxSide, boxSide);
    }
}

function findPlayerByCoords(playerObj) {
    for (id in playerList) {
        // Finds the user with the same coords thats not itself
        if (playerList[id].i == playerObj.i && playerList[id].j == playerObj.j && id != playerObj.id && id != currPlayer.id) {
            return playerList[id];
        }
    }
}

socket.on('playerMove', function (oldP, newP) {
    removeProjectedPlayer(oldP)
    // Finds the moving player in the playerList array
    var playerObj = playerList[newP.id];
    if (playerObj) {
        // Change the i, j values for the player in the playerList array
        playerObj.i = newP.i
        playerObj.j = newP.j
    } else {
        console.log("Error: playerObj not found in playerMove");
        return;
    }
    // Shows the new location of the player
    projectSquare(newP);
    // Move the player in the locationMap
    movePlayer(oldP, newP);


});

socket.on('playerProject', function (playerObj) {
    playerList[playerObj.id] = playerObj;
    projectSquare(playerObj);
});

socket.on('playerRemove', function (playerObj) {
    removeProjectedPlayer(playerObj);
    delete playerList[playerObj.id]
});

socket.on('message', function (msg) {
    console.log(msg);
});