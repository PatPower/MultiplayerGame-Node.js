var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var World = require('./app/world.js');

const port = process.env.PORT || 80;

app.set('port', port);
app.set('view engine', 'pug');
app.use('/static', express.static(__dirname + '/static'));// Routing

app.get('/', (req, res) => {
    res.render('index');
});

server.listen(port, function () {
    console.log('listening on ' + port);
});

// Initalizes the world
var world = new World();
// Handles sockets
var SocketController = require('./app/socketController.js')(io, world);