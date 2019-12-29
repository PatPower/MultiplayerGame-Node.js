var socket = io();
var currPlayer = {}
var playerList = {}
var bcanvas = document.getElementById('overlay');
var pcanvas = document.getElementById('player');
var otherpcanvas = document.getElementById('otherPlayers');

// Background
bcanvas.width = 840;
bcanvas.height = 600;
var boxSide = 40;
var numRow = Math.floor(bcanvas.width/boxSide);
var numCol = Math.floor(bcanvas.height/boxSide);
var bgcxt = bcanvas.getContext('2d');
for (var i = 0; i < numRow; i++) {
    for (var j = 0; j < numCol; j++) {
        bgcxt.strokeRect(boxSide*i,boxSide*j,boxSide,boxSide);
    }
}

// Current Player
pcanvas.width = 840;
pcanvas.height = 600;
var pcxt = pcanvas.getContext('2d');

// Other Players
otherpcanvas.width = 840;
otherpcanvas.height = 600;
var opcxt = otherpcanvas.getContext('2d');

// When player joins
socket.emit('new player', name);

// Server sends info needed to setup client
// pList is a list of playerObj
// currentPlayer is the currentplayerObj
socket.on('setup', function(pList, currentPlayer) {
    currPlayer = currentPlayer;
    playerList = pList;
    projectSquares(pList);
    projectSquare(currentPlayer);
});

var movement = {
    up: false,
    down: false,
    left: false,
    right: false
}

var canMove = true; var firstKeyHold = true;
document.addEventListener('keydown', function (event) {
    if (event.keyCode == 87) {movement.up = true;} //W 
    if (event.keyCode == 68) {movement.right = true;} //D
    if (event.keyCode == 83) {movement.down = true;} //S
    if (event.keyCode == 65) {movement.left = true;} //A
});

document.addEventListener('keyup', function (event) {
    canMove = true;
    if (event.keyCode == 87) {movement.up = false;} //W 
    if (event.keyCode == 68) {movement.right = false;} //D
    if (event.keyCode == 83) {movement.down = false;} //S
    if (event.keyCode == 65) {movement.left = false;} //A
    timeoutCounter = 0;
    firstKeyHold = true
});

// TimeoutCounter limits how fast the user can move from the client side
// FirstKeyHold makes the first press take a bit longer to move the player to allow easier tap movement 
var timeoutCounter = 0;
setInterval(function(){
    if(timeoutCounter >= 1) {timeoutCounter--; return false;}
    if (movement.up|| movement.right|| movement.down|| movement.left) {
        if (firstKeyHold) {timeoutCounter = 8; firstKeyHold = false} else {timeoutCounter = 3;}
        socket.emit('movement', movement);
    }
},40);

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
        console.log(playerObj.color)
        opcxt.fillRect(boxSide*playerObj.i,boxSide*playerObj.j,boxSide,boxSide);
        opcxt.fillStyle = 'blue';
        opcxt.font = "12px Arial";
        opcxt.fillText(playerObj.name, boxSide*playerObj.i, boxSide*playerObj.j+10);
    } else { // Current players
        pcxt.fillStyle = 'cyan';
        pcxt.fillRect(boxSide*playerObj.i,boxSide*playerObj.j,boxSide,boxSide);
        pcxt.fillStyle = 'blue'
        pcxt.font = "12px Arial";
        pcxt.fillText(playerObj.name, boxSide*playerObj.i, boxSide*playerObj.j+10);
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
            pcxt.clearRect(boxSide*playerObj.i,boxSide*playerObj.j,boxSide,boxSide);
        }
        projectSquare(otherPlayer);
        return;
    }
    // Other players
    if (playerObj.id != currPlayer.id) {
        opcxt.clearRect(boxSide*playerObj.i,boxSide*playerObj.j,boxSide,boxSide);
    } else { // Current players
        pcxt.clearRect(boxSide*playerObj.i,boxSide*playerObj.j,boxSide,boxSide);
    }
}

function findPlayerByCoords(playerObj) {
    for (id in playerList) {
        // Finds the user with the same coords thats not itself
        console.log(playerList[id])
        if (playerList[id].i == playerObj.i && playerList[id].j == playerObj.j && id != playerObj.id && id != currPlayer.id) {
            console.log(playerList[id])
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
});

socket.on('playerProject', function (playerObj) {
    playerList[playerObj.id] = playerObj;
    projectSquare(playerObj);
});

socket.on('playerRemove', function(playerObj) {
    removeProjectedPlayer(playerObj);
    delete playerList[playerObj.id]
    console.log(playerObj)
});

socket.on('message', function(msg) {
    console.log(msg);
});