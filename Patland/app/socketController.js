var io;
var Action = require('./actions.js');
var action;

module.exports = function (socketIo, world) {

    if (!io) {
        action = new Action(world);
        io = socketIo
        // Add the WebSocket handlers
        io.on('connection', function (socket) {

            socket.on('new player', function (pname) {
                world.createPlayer(socket.id, pname, io);
            });

            socket.on('disconnect', function () {
                world.disconnectPlayer(socket.id, io);

            });

            socket.on('movement', function (data) {
                world.movePlayer(socket.id, data, io);
            });


            socket.on('pAction', function (id, actionId, location) {
                action.doAction(socket.id, id, actionId, location);
            });

        });
    }
    return module.exports;
}

module.exports.playerJoin = function (othPlayer, player) {
    if (!io) {
        throw new Error("Error: Can't use print until io is properly initalized");
    }
    io.to(othplayer.id).emit('playerJoin', player);
}

module.exports.playerRemove = function (othPlayer, dcPlayer) {
    if (!io) {
        throw new Error("Error: Can't use print until io is properly initalized");
    }
    io.to(othplayer.id).emit('playerRemove', dcPlayer);
}

module.exports.othPlayerMove = function (othPlayer, oldPlayer, data) {
    if (!io) {
        throw new Error("Error: Can't use print until io is properly initalized");
    }
    io.to(othplayer.id).emit('othPlayerMove', oldPlayer, data);
}

module.exports.moveCurrPlayer = function (player, localPlayerDict2D, localGround2D, localStructure2D) {
    if (!io) {
        throw new Error("Error: Can't use print until io is properly initalized");
    }
    io.to(player.id).emit('moveCurrPlayer', player, localPlayerDict2D, localGround2D, localStructure2D);
}

module.exports.setup = function (currPlayer, localPlayerDict2D, localGround2D, localStructure2D) {
    if (!io) {
        throw new Error("Error: Can't use print until io is properly initalized");
    }
    io.to(currPlayer.id).emit('setup', currPlayer, localPlayerDict2D, localGround2D, localStructure2D);

}
module.exports.message = function (id, msg) {
    if (!io) {
        throw new Error("Error: Can't use print until io is properly initalized");
    }
    io.to(id).emit('message', msg);
}

module.exports.removeStructure = function (player, location) {
    if (!io) {
        throw new Error("Error: Can't use print until io is properly initalized");
    }
    io.to(player.id).emit('removeStructure', location);
}
