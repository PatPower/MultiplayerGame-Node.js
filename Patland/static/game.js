var socket = io();
var currPlayer = {}


socket.on('message', function (data) {
    console.log(data);
});

var movement = {
    up: false,
    down: false,
    left: false,
    right: false
}

var canMove = true; var firstKeyHold = true;
var canShift = false;
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

var timeoutCounter = 0;
setInterval(function(){
    if(timeoutCounter >= 1) {timeoutCounter--; return false;}
    if (movement.up|| movement.right|| movement.down|| movement.left) {
        if (firstKeyHold) {timeoutCounter = 8; firstKeyHold = false} else {timeoutCounter = 3;}
        socket.emit('movement', movement);
    }
},40);

socket.emit('new player', pname);

/** 
setInterval(function () {
    socket.emit('movement', movement);
}, 1000 / 60);
*/

var bcanvas = document.getElementById('canvas');
bcanvas.width = 840;
bcanvas.height = 600;
var boxSide = 40;
var numRow = Math.floor(bcanvas.width/boxSide);
var numCol = Math.floor(bcanvas.height/boxSide);
console.log('row: ' + numRow + '\n' + "col: " + numCol)
var bgcxt = bcanvas.getContext('2d');
for (var i = 0; i < numRow; i++) {
    for (var j = 0; j < numCol; j++) {
        bgcxt.strokeRect(boxSide*i,boxSide*j,boxSide,boxSide);
    }
}

var pcanvas = document.getElementById('player');
pcanvas.width = 840;
pcanvas.height = 600;
var pcxt = pcanvas.getContext('2d');

var otherpcanvas = document.getElementById('otherPlayers');
pcanvas.width = 840;
pcanvas.height = 600;
var opcxt = pcanvas.getContext('2d');

// squaresObj[].i
// squaresObj[].j
// squaresObj[].color
function projectSquares(squaresObj) {
    for (var index in squaresObj) {
        projectSquare(squaresObj[index]);
    }
}

// squaresObj[].i
// squaresObj[].j
// squaresObj[].color
function projectSquare(playerObj) {
    if (playerObj.id != currPlayer.id) {
        opcxt.fillStyle = playerObj.color
        opcxt.fillRect(boxSide*playerObj.i,boxSide*playerObj.j,boxSide,boxSide);
        opcxt.fillStyle = 'blue'
        opcxt.font = "12px Arial";
        opcxt.fillText(playerObj.name, boxSide*playerObj.i, boxSide*playerObj.j+10);
    } else {
        pcxt.fillStyle = 'cyan';
        pcxt.fillRect(boxSide*playerObj.i,boxSide*playerObj.j,boxSide,boxSide);
        pcxt.fillStyle = 'blue'
        pcxt.font = "12px Arial";
        pcxt.fillText(playerObj.name, boxSide*playerObj.i, boxSide*playerObj.j+10);
    }
}
/**
 * 
 * @param {*} squareObj The player being removed from the screen
 */
function removeProjectedPlayer(squareObj) {
    pcxt.fillStyle = "white";
    pcxt.fillRect(boxSide*squareObj.i,boxSide*squareObj.j,boxSide,boxSide);
}

socket.on('playerMove', function (oldP, newP) {
    removeProjectedPlayer(oldP)
    projectSquare(newP);
});

socket.on('setup', function(playerList, currentPlayer) {
    currPlayer = currentPlayer;
    projectSquares(playerList);
    projectSquare(currentPlayer);
});

socket.on('playerRemove', function(player) {
    removeProjectedPlayer(player);
    console.log("player removee")
})

