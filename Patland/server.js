var express = require('express');
var app = express();
var http = require('http');

var server = http.createServer(app);
var io = require('socket.io').listen(server);

var World = require('./app/world.js')

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

let world = new World();

// Add the WebSocket handlers
io.on('connection', function (socket) {

    socket.on('new player', function (pname) {
        world.createPlayer(socket.id, pname);
    });

    socket.on('disconnect', function () {
        console.log("dc", socket.id)
        world.disconnectPlayer(socket.id);

    });

    socket.on('movement', function (data) {
        world.movePlayer(socket.id, data);
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
 * Gets a 2D list of players in viewing distance of the given player and returns a dict of players
 * @param {*} player 
 
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
}*/

/**
 * Returns a 2D list of ground ids near the player.
 * If player is near the border, the id of the ground outside border will be null
 * @param {} player 
 
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
}*/

/**
 * Returns a 2D list of structureInfo objects near the player.
 * @param {} player 
 
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
}*/









