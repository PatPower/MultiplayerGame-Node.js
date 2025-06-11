var io;
var Action = require('./actions.js');
var action;

module.exports = function (socketIo, world, auth, database) {
    if (!io) {
        action = new Action(world);
        io = socketIo
        // Add the WebSocket handlers with authentication
        io.on('connection', async function (socket) {
            try {
                // Authenticate the socket connection
                const user = await auth.authenticateSocket(socket);
                console.log('✅ Authenticated user connected:', user.email);
                
                socket.user = user;
                
                socket.on('new player', async function (pname) {
                    console.log('🎮 "new player" event received for:', user.email);
                    console.log('  Player name:', pname);
                    console.log('  Socket ID:', socket.id);
                    
                    try {
                        // Use authenticated user data instead of just the provided name
                        console.log('🏗️ Creating player...');
                        await world.createPlayer(socket.id, user);
                        console.log('✅ Player creation completed successfully');
                    } catch (error) {
                        console.error('❌ Error creating player:', error);
                        socket.emit('error', 'Failed to create player');
                    }
                });
                
                socket.on('disconnect', async function () {
                    console.log('👋 Player disconnecting:', user.email);
                    try {
                        await world.disconnectPlayer(socket.id);
                    } catch (error) {
                        console.error('Error disconnecting player:', error);
                    }
                });
                
                socket.on('movement', function (data) {
                    world.movePlayer(socket.id, data);
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
                
                socket.on('itemSwap', async function (pos1, pos2) {
                    try {
                        await world.itemSwap(socket.id, pos1, pos2);
                    } catch (error) {
                        console.error('Error swapping items:', error);
                        socket.emit('error', 'Failed to swap items');
                    }
                });
                
            } catch (error) {
                console.error('Authentication failed:', error);
                socket.emit('auth_error', 'Authentication failed');
                socket.disconnect();
            }
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
    
    console.log('📡 socketController.setup called:');
    console.log('  Player ID:', currPlayer.id);
    console.log('  Player position:', { i: currPlayer.i, j: currPlayer.j });
    console.log('  Player inventory size:', currPlayer.inventorySize);
    console.log('  Local players count:', Object.keys(localPlayerDict2D).length);
    console.log('  Emitting setup event to socket:', currPlayer.id);
    
    io.to(currPlayer.id).emit('setup', currPlayer, localPlayerDict2D, localGround2D, localStructure2D, defaultActions);
    
    console.log('✅ Setup event emitted successfully');
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