var express = require('express');
var app = express();
var http = require('http');
var fs = require('fs');
var server = http.createServer(app);
var io = require('socket.io').listen(server);



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
            setPlayer(socket.id, player);
            addPlayerLocation(player);
        }
        io.to(socket.id).emit('setup', players, getPlayer(socket.id), getLocal2DGround(player), getLocal2DStructure(player));
        var range = getIJRange(player.i, player.j);
        for (var i = range.lefti; i <= range.righti; i++) {
            for (var j = range.topj; j <= range.bottomj; j++) {
                if (worldPlayerMap[i][j].length > 0) {
                    for (othplayer of worldPlayerMap[i][j]) {
                        if (othplayer.id != player.id) {
                            io.to(othplayer.id).emit('playerJoin', getPlayer(socket.id));
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
        //TODO: make local
        // Check if player exists
        if (getPlayer(socket.id)) {
            removePlayerLocation(getPlayer(socket.id));
            io.sockets.emit('playerRemove', getPlayer(socket.id));
            deletePlayer(socket.id);
        }
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

        var player = getPlayer(socket.id) || {};
        var oldPlayer = JSON.parse(JSON.stringify(player)); // For the client to remove old player tile

        // This part will be dangerous if unexpected power off
        // Remove the old player location
        removePlayerLocation(player);
        // TODO: check for impassible structures/ out of bounds
        if (data.left) {
            if (player.i - 1 >= 0 && structurePassable(worldStructureMap[player.i - 1][player.j])) {
                player.i--;
            } else {
                data.left = false;
                // Show user that movement is blocked
            }
        }
        if (data.right) {
            if (player.i + 1 < WORLDLIMIT && structurePassable(worldStructureMap[player.i + 1][player.j])) {
                player.i++;
            } else {
                data.right = false;
                // Show user that movement is blocked
            }
        }
        if (data.up) {
            if (player.j - 1 >= 0 && structurePassable(worldStructureMap[player.i][player.j - 1])) {
                player.j--;
            } else {
                data.up = false;
                // Show user that movement is blocked
            }
        }
        if (data.down) {
            if (player.j + 1 < WORLDLIMIT && structurePassable(worldStructureMap[player.i][player.j + 1])) {
                player.j++;
            } else {
                data.down = false;
                // Show user that movement is blocked
            }
        }
        addPlayerLocation(player);

        if (moveLog[socket.id].length >= MAXSPEED) {
            moveLog[socket.id].shift();
            moveLog[socket.id].push((new Date).getTime())
        } else {
            moveLog[socket.id].push((new Date).getTime())
        }

        // If player did not move then do stop here
        if (!data.up && !data.right && !data.down && !data.left) {
            return;

        }
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
        io.to(socket.id).emit('moveCurrPlayer', player, getLocal2DPlayerDict(player), getLocal2DGround(player), getLocal2DStructure(player));
    });

    /**
     * id: id of structure
     * actionId: 1, 2 or 3 depending if action 1, action 2 or action 3
     * location: {i: int, j: int}
     */
    socket.on('pAction', function (id, actionId, location) {
        if (worldStructureMap[location.i][location.j].id == id) {
            var player = getPlayer(id);
            if (checkIfInteractible(player, location)) {

            }
        }
    });

});

/**
 * Returns an object with the left/right bound and top/bottom bound of i and j respectively
 * If the player is near the border, the i's and j's will be either 0 or the WORLDLIMIT - 1
 * However the true i and j's will ignore the constraints above and can give < 0 or > WORLDLIMIT - 1
 * @param {*} i player's world i coordinate
 * @param {*} j player's world j coordinate
 */
function getIJRange(i, j) {
    var leftI = 0;
    var rightI = WORLDLIMIT - HORIZONTALRADIUS;
    var topJ = 0;
    var bottomJ = WORLDLIMIT - VERTICALRADIUS;
    // Used to get how close user is to the border
    var trueLeftI; var trueTopJ; var trueRightI; var trueBottomJ;
    trueLeftI = i - HORIZONTALRADIUS
    trueRightI = i + HORIZONTALRADIUS
    trueTopJ = j - VERTICALRADIUS
    trueBottomJ = j + VERTICALRADIUS
    if (i >= HORIZONTALRADIUS) { leftI = i - HORIZONTALRADIUS }
    if (i < WORLDLIMIT - HORIZONTALRADIUS) { rightI = i + HORIZONTALRADIUS };
    if (j >= VERTICALRADIUS) { topJ = j - VERTICALRADIUS }
    if (j < WORLDLIMIT - VERTICALRADIUS) { bottomJ = j + VERTICALRADIUS };
    return { lefti: leftI, righti: rightI, topj: topJ, bottomj: bottomJ, truelefti: trueLeftI, truetopj: trueTopJ, truerighti: trueRightI, truebottomj: trueBottomJ };
}

/**
 * Gets a 2D list of players in viewing distance of the given player and returns a dict of players
 * @param {*} player 
 */
function getLocal2DPlayerDict(player) {
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
function getLocal2DGround(player) {
    var ground2D = [...Array(NUMCOL)].map(e => Array(NUMROW));
    var range = getIJRange(player.i, player.j);
    for (var j = range.truetopj; j <= range.truebottomj; j++) {
        for (var i = range.truelefti; i <= range.truerighti; i++) {
            if (i >= 0 && i <= WORLDLIMIT - 1 && j >= 0 && j <= WORLDLIMIT - 1) {
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
function getLocal2DStructure(player) {
    var structure2D = [...Array(NUMCOL)].map(e => Array(NUMROW));
    var range = getIJRange(player.i, player.j);
    for (var j = range.truetopj; j <= range.truebottomj; j++) {
        for (var i = range.truelefti; i <= range.truerighti; i++) {
            if (i >= 0 && i <= WORLDLIMIT - 1 && j >= 0 && j <= WORLDLIMIT - 1) {
                structure2D[i - range.truelefti][j - range.truetopj] = worldStructureMap[i][j];
            }
        }
    }
    return structure2D;
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
    worldStructureMap[2][2] = { id: 1, health: 10, owner: "game" };
    worldGroundMap = [...Array(WORLDLIMIT)].map(e => Array(WORLDLIMIT));
    worldPlayerMap = [...Array(WORLDLIMIT)].map(e => Array(WORLDLIMIT));
    for (i = 0; i < WORLDLIMIT; i++) {
        for (j = 0; j < WORLDLIMIT; j++) {
            worldPlayerMap[i][j] = []
            worldGroundMap[i][j] = 0;
        }
    }
}

function structurePassable(structureInfo) {
    var passable = true;
    if (structureInfo) {
        passable = structureJson.find(o => o.id == structureInfo.id).passable;
    }
    return passable;
}

function getStructureJson() {
    let structureJson = JSON.parse(fs.readFileSync('./structureServer.json'))
    return structureJson;
}

function getPlayer(id) {
    return players[id];
}

function setPlayer(id, player) {
    players[id] = player;
}

function deletePlayer(id) {
    delete players[id];
}

/**
 * Checks if the structure is in a 3x3 vicinity of the player
 * @param {*} player an object with an i and j
 * @param {*} structure another object with an i and j
 */
function checkIfInteractible(player, structure) {
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            if (player.i + i == structure.i && player.j + j == structure.j) {
                return true;
            }
        }
    }
    return false;
}

initializeTestMap()