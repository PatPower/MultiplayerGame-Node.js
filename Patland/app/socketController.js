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
                var response = action.doAction(socket.id, id, actionId, location);
                // If a condition is not met
                if (!response.result) {
                    module.exports.message(socket.id, response.msg);
                }
            });
            socket.on('invAction', function (id, actionId, invSlot) {
                var response = action.doInvAction(socket.id, id, actionId, invSlot);
                // If a condition is not met
                if (!response.result) {
                    module.exports.message(socket.id, response.msg);
                }
            });
            socket.on('build', function (itemId, actionId, invSlot, buildLoc) {
                var response = action.build(socket.id, itemId, actionId, invSlot, buildLoc);
                // If a condition is not met
                if (!response.result) {
                    module.exports.message(socket.id, response.msg);
                }
            });
            socket.on('itemSwap', function (pos1, pos2) {
                world.itemSwap(socket.id, pos1, pos2);
            });
        });
    }
    return module.exports;
}

module.exports.playerJoin = function (othPlayer, player) {
    if (!io) {
        throw new Error("Error: Can't use this function until io is properly initalized");
    }
    io.to(othplayer.id).emit('playerJoin', player);
}

module.exports.playerRemove = function (othPlayer, dcPlayerObj) {
    if (!io) {
        throw new Error("Error: Can't use this function until io is properly initalized");
    }
    io.to(othplayer.id).emit('playerRemove', dcPlayerObj);
}

module.exports.othPlayerMove = function (othPlayer, oldPlayer, data) {
    if (!io) {
        throw new Error("Error: Can't use this function until io is properly initalized");
    }
    io.to(othplayer.id).emit('othPlayerMove', oldPlayer, data);
}

module.exports.moveCurrPlayer = function (player, localPlayerDict2D, localGround2D, localStructure2D) {
    if (!io) {
        throw new Error("Error: Can't use this function until io is properly initalized");
    }
    io.to(player.id).emit('moveCurrPlayer', player, localPlayerDict2D, localGround2D, localStructure2D);
}

module.exports.setup = function (currPlayer, localPlayerDict2D, localGround2D, localStructure2D, defaultActions) {
    if (!io) {
        throw new Error("Error: Can't use this function until io is properly initalized");
    }
    io.to(currPlayer.id).emit('setup', currPlayer, localPlayerDict2D, localGround2D, localStructure2D, defaultActions);

}
module.exports.message = function (id, msg) {
    if (!io) {
        throw new Error("Error: Can't use this function until io is properly initalized");
    }
    io.to(id).emit('message', msg);
}

module.exports.removeStructure = function (player, location) {
    if (!io) {
        throw new Error("Error: Can't use this function until io is properly initalized");
    }
    io.to(player.id).emit('removeStructure', location);
}

module.exports.placeStructure = function (player, location, structObj) {
    if (!io) {
        throw new Error("Error: Can't use this function until io is properly initalized");
    }
    io.to(player.id).emit('placeStructure', location, structObj);
}

/**
 * If inventoryChanges is not null then inventorySize and newInventory should be null
 * If inventorySize and newInventory is not null, then inventoryChanges should be null
 */
module.exports.playerInventoryUpdate = function (player, inventoryChanges) {
    if (!io) {
        throw new Error("Error: Can't use this function until io is properly initalized");
    }
    io.to(player.id).emit('playerInventoryUpdate', inventoryChanges);
}

module.exports.playerInventorySizeUpdate = function (player, inventorySize, newInventory) {
    if (!io) {
        throw new Error("Error: Can't use this function until io is properly initalized");
    }
    io.to(player.id).emit('playerInventorySizeUpdate', inventorySize, newInventory);
}