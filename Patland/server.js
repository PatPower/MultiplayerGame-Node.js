var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);

var io = require('socket.io').listen(server);

const port = 3000;

app.set('port', port);

app.set('view engine', 'pug');
app.use('/static', express.static(__dirname + '/static'));// Routing

app.get('/', (req, res) => {
    res.render('index', {name: 'Pat'})
});
app.get('/josh', (req, res) => {
    console.log("Josh")
    res.render('index', {name: 'Josh'})
});

server.listen(3000, function(){
    console.log('listening on *:3000');
});

var players = {}

// Add the WebSocket handlers
io.on('connection', function(socket) {
    socket.on('new player', function() {
        players[socket.id] = {
            x: 300,
            y: 300
        }
    });
    socket.on('movement', function(data) {
        var player = players[socket.id] || {};
        if (data.left) {
            player.x -= 5;
        }
        if (data.right) {
            player.x += 5;
        }
        if (data.up) {
            player.y -= 5;
        }
        if (data.down) {
            player.y += 5;
        }
    });
});

setInterval(function() {
    io.sockets.emit('state', players);
}, 1000/60);

setInterval(function() {
    io.sockets.emit('message', 'hi!');
}, 1000);