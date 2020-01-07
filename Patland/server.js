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
        world.createPlayer(socket.id, pname, io);
    });

    socket.on('disconnect', function () {
        console.log("dc", socket.id)
        world.disconnectPlayer(socket.id, io);

    });

    socket.on('movement', function (data) {
        world.movePlayer(socket.id, data, io);
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








