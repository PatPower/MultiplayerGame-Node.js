var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);

var io = require('socket.io').listen(server);

const port = 80;

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

server.listen(port, function(){
    console.log('listening on ' + port);
});

var players = {};
var moveLog = {};
var MAXSPEED = 30;
// Add the WebSocket handlers
io.on('connection', function(socket) {
    socket.on('new player', function(pname) {
        players[socket.id] = {
            id: socket.id,
            i: 10,
            j: 7,
            name: pname,
            color: 'red'
        }
        io.to(socket.id).emit('setup', players, players[socket.id]);
        io.sockets.emit('playerMove', {}, players[socket.id]);
        moveLog[socket.id] = [(new Date).getTime()];
        console.log(pname);
    });

    socket.on('disconnect', function() {
        io.sockets.emit('playerRemove', players[socket.id]);
        delete players[socket.id];
    });

    socket.on('movement', function(data) {
        var currMoveLog = moveLog[socket.id];
        console.log((currMoveLog[moveLog[socket.id].length-1] - currMoveLog[0]) + '\n' +currMoveLog.length)
        if (currMoveLog[moveLog[socket.id].length-1] - currMoveLog[0] <= 2000 && currMoveLog.length >= MAXSPEED) {console.log("TOO FAST!"); return;}
        var player = players[socket.id] || {};
        var oldPlayer = JSON.parse(JSON.stringify(player));
        if (data.left) {
            player.i -= 1;
        }
        if (data.right) {
            player.i += 1;
        }
        if (data.up) {
            player.j -= 1;
        }
        if (data.down) {
            player.j += 1;
        }
        if (moveLog[socket.id].length >= MAXSPEED) {
            moveLog[socket.id].shift();
            moveLog[socket.id].push((new Date).getTime())
        } else {
            moveLog[socket.id].push((new Date).getTime())
        }
        io.sockets.emit('playerMove', oldPlayer, player);
        console.log("move")
    });
});

