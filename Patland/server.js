var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

//For testing
var worldStructureMap = [];
var wordGroundMap = [];
var worldPlayerMap = [];

const port = 8080;

app.set('port', port);

app.set('view engine', 'pug');
app.use('/static', express.static(__dirname + '/static'));// Routing

app.get('/', (req, res) => {
    res.render('index')
});

server.listen(port, function () {
    console.log('listening on ' + port);
});

var players = {};
var moveLog = {};

// TODO: calculate and move these variables to a different file
const MAXSPEED = 30;
const WORLDLIMIT = 100;
const HORIZONTALRADIUS = 10;
const VERTICALRADIUS = 7;
const MILLISECONDMAX = 2000;

const cWidth = 840;
const cHeight = 600;
const boxSide = 40;

const NUMROW = Math.floor(cWidth / boxSide);
const NUMCOL = Math.floor(cHeight / boxSide);

// Add the WebSocket handlers
io.on('connection', function (socket) {
    socket.on('new player', function (pname) {
        var player;
        // TODO: make a system to save a player and load it
        // If player exists load it
        if (false) {

        } else {
            // else create new player
            player = {
                id: socket.id,
                i: 10,
                j: 7,
                name: pname,
                color: 'red'
            }
            players[socket.id] = player;
            addPlayerLocation(player);
        }
        console.log(players) // remove later
        // TODO: Send the player a 2D list of players around them
        // TODO: ALSO SEND THE BACKGROUND AND STRUCTURES
        io.to(socket.id).emit('setup', players, players[socket.id]);
        // TODO: Remove player from other screens if exit their view
        var range = getIJRange(player.i, player.j);
        console.log(range);
        console.log(players);
        for (var i = range.lefti; i <= range.righti; i++) {
            for (var j = range.topj; j <= range.bottomj; j++) {
                if (worldPlayerMap[i][j].length > 0) {
                    for (othplayer of worldPlayerMap[i][j]) {
                        if (othplayer.id != player.id) {
                            console.log(player.id)
                            console.log("in", othplayer)
                            io.sockets.emit('playerProject', players[socket.id]);
                        }
                    }
                }
            }
        }

        moveLog[socket.id] = [];
        moveLog[socket.id].push((new Date).getTime());
    });

    socket.on('disconnect', function () {
        console.log("dc", socket.id)
        // Check if player exists
        if (players[socket.id]) {
            removePlayerLocation(players[socket.id]);
            io.sockets.emit('playerRemove', players[socket.id]);
            delete players[socket.id];
        }
        console.log(players)
    });

    socket.on('movement', function (data) {
        // Checks if user exists
        if (!moveLog[socket.id]) {
            io.to(socket.id).emit('message', "Not connected");
            return
        }
        var currMoveLog = moveLog[socket.id];

        // Checks if the user has moved more than MAXSPEED tiles in 2 seconds
        if (currMoveLog[moveLog[socket.id].length - 1] - currMoveLog[0] <= MILLISECONDMAX && currMoveLog.length >= MAXSPEED) { console.log("TOO FAST!"); return; }

        var player = players[socket.id] || {};
        var oldPlayer = JSON.parse(JSON.stringify(player)); // For the client to remove old player tile

        // This part will be dangerous if unexpected power off
        // Remove the old player location
        removePlayerLocation(player);
        // TODO: check for impassible structures/ out of bounds
        if (data.left) { player.i--; }
        if (data.right) { player.i++; }
        if (data.up) { player.j--; }
        if (data.down) { player.j++; }
        addPlayerLocation(player);

        if (moveLog[socket.id].length >= MAXSPEED) {
            moveLog[socket.id].shift();
            moveLog[socket.id].push((new Date).getTime())
        } else {
            moveLog[socket.id].push((new Date).getTime())
        }

        io.to(socket.id).emit('message', `x: ${player.i}   y: ${player.j}`); //remove

        // TODO: Only emit to players in the viewable radius of other players
        // TODO: Remove player from other screens if exit their view
        var range = getIJRange(player.i, player.j);
        if (data.left) {
            if (range.righti < WORLDLIMIT - 1) {
                range.righti++;
            }
        }
        if (data.right) {
            if (range.lefti > 0) {
                range.lefti--;
            }
        }
        if (data.up) {
            if (range.bottomj < WORLDLIMIT - 1) {
                range.bottomj++;
            }
        }
        if (data.down) {
            if (range.topj > 0) {
                range.topj--;
            }
        }
        console.log(range);
        for (var i = range.lefti; i <= range.righti; i++) {
            for (var j = range.topj; j <= range.bottomj; j++) {
                if (worldPlayerMap[i][j].length > 0) {
                    for (othplayer of worldPlayerMap[i][j]) {
                        if (othplayer.id != player.id) {
                            io.to(othplayer.id).emit('othPlayerMove', oldPlayer, data);
                        }
                    }
                }
            }
        }

        // TODO: Send moving player new map info
        io.to(socket.id).emit('moveCurrPlayer', player, getLocal2DPlayerList(player));


    });
});

/**
 * Returns an object with the left/right bound and top/bottom bound of i and j respectively
 * @param {*} i player's world i coordinate
 * @param {*} j player's world j coordinate
 */
function getIJRange(i, j) {
    var leftI = 0;
    var rightI = WORLDLIMIT - HORIZONTALRADIUS;
    var topJ = 0;
    var bottomJ = WORLDLIMIT - VERTICALRADIUS;
    // Used to get how close user is to the border
    var trueLeftI; var trueTopJ;
    if (i >= HORIZONTALRADIUS) { leftI = i - HORIZONTALRADIUS }
    else { trueLeftI = i - HORIZONTALRADIUS }
    if (i < WORLDLIMIT - HORIZONTALRADIUS) { rightI = i + HORIZONTALRADIUS };
    if (j >= VERTICALRADIUS) { topJ = j - VERTICALRADIUS }
    else { trueTopJ = j - VERTICALRADIUS }
    if (j < WORLDLIMIT - VERTICALRADIUS) { bottomJ = j + VERTICALRADIUS };
    return { lefti: leftI, righti: rightI, topj: topJ, bottomj: bottomJ, truelefti: trueLeftI, truetopj: trueTopJ };
}

/**
 * Gets a 2D list of players in viewing distance of the given player
 * @param {*} player 
 */
function getLocal2DPlayerList(player) {
    var localPlayerList = [];
    var range = getIJRange(player.i, player.j);
    for (var i = range.lefti; i <= range.righti; i++) {
        for (var j = range.topj; j <= range.bottomj; j++) {
            if (worldPlayerMap[i][j].length > 0) {
                for (othplayer of worldPlayerMap[i][j]) {
                    localPlayerList.push(othplayer);
                }
            }
        }
    }
    return localPlayerList;
}

// TODO: Save this into a database/file later
function addPlayerLocation(player) {
    worldPlayerMap[player.i][player.j].push(player);
}

function removePlayerLocation(player) {
    // Remove the old player location
    var pIndex = worldPlayerMap[player.i][player.j].findIndex(o => o.id == player.id);
    if (pIndex >= 0) {
        worldPlayerMap[player.i][player.j].splice(pIndex, 1);
    } else {
        console.log("ERROR: player not found when removing location");
    }
}

function initializeTestMap() {
    worldStructureMap = [...Array(WORLDLIMIT)].map(e => Array(WORLDLIMIT));
    worldGroundMap = [...Array(WORLDLIMIT)].map(e => Array(WORLDLIMIT));
    worldPlayerMap = [...Array(WORLDLIMIT)].map(e => Array(WORLDLIMIT));
    for (i = 0; i < WORLDLIMIT; i++) {
        for (j = 0; j < WORLDLIMIT; j++) {
            worldPlayerMap[i][j] = []
        }
    }
}

initializeTestMap()