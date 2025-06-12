var io;
var Action = require('./actions.js');
var action;

// Track connected users to prevent duplicates
var connectedUsers = new Map(); // Map of userId -> socketId

module.exports = function (socketIo, world, auth, database) {
    if (!io) {
        action = new Action(world);
        io = socketIo

        const DEV_MODE = process.env.DEV_MODE === 'true' || process.env.NODE_ENV === 'development';

        // Add the WebSocket handlers with authentication
        io.on('connection', async function (socket) {
            try {
                let user;

                if (DEV_MODE) {
                    // In dev mode, generate a random user for each socket connection
                    const adjectives = ['Swift', 'Brave', 'Wise', 'Bold', 'Clever', 'Strong', 'Quick', 'Sharp', 'Bright', 'Noble', 'Wild', 'Free', 'Cool', 'Fast', 'Smart'];
                    const nouns = ['Explorer', 'Builder', 'Miner', 'Crafter', 'Hunter', 'Warrior', 'Trader', 'Pioneer', 'Adventurer', 'Hero', 'Coder', 'Gamer', 'Player', 'Ninja', 'Wizard'];
                    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
                    const noun = nouns[Math.floor(Math.random() * nouns.length)];
                    const number = Math.floor(Math.random() * 1000);
                    const username = `${adjective}${noun}${number}`;

                    user = {
                        id: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        email: `${username.toLowerCase()}@dev.local`,
                        name: username,
                        username: username,
                        isDev: true
                    };
                    console.log('🔧 Dev mode socket: Generated user', user.username);
                } else {
                    // Authenticate the socket connection normally
                    user = await auth.authenticateSocket(socket);
                    console.log('✅ Authenticated user connected:', user.email);
                }

                // Check if user is already connected
                if (connectedUsers.has(user.id)) {
                    const existingSocketId = connectedUsers.get(user.id);
                    console.log(`🚫 User ${user.email} is already connected with socket ${existingSocketId}`);
                    console.log(`   Rejecting new connection attempt from socket ${socket.id}`);

                    // Send error message to the new connection
                    socket.emit('connection_rejected', {
                        reason: 'duplicate_connection',
                        message: 'You are already connected to the game in another tab or window. Please close other connections and try again.'
                    });

                    // Disconnect the new socket
                    socket.disconnect(true);
                    return;
                }

                // Add user to connected users map
                connectedUsers.set(user.id, socket.id);
                console.log(`✅ User ${user.email} connected with socket ${socket.id}`);
                console.log(`📊 Total connected users: ${connectedUsers.size}`);

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

                    // Remove user from connected users map
                    if (connectedUsers.get(user.id) === socket.id) {
                        connectedUsers.delete(user.id);
                        console.log(`🗑️ Removed ${user.email} from connected users`);
                        console.log(`📊 Total connected users: ${connectedUsers.size}`);
                    }

                    try {
                        await world.disconnectPlayer(socket.id);
                    } catch (error) {
                        console.error('Error disconnecting player:', error);
                    }
                });

                socket.on('movement', function (data) {
                    world.movePlayer(socket.id, data);
                });

                socket.on('pAction', async function (id, actionId, location) {
                    try {
                        var response = await action.doAction(socket.id, id, actionId, location);
                        // If a condition is not met
                        if (!response.result) {
                            module.exports.message(socket.id, response.msg);
                            // Check if inventory was full and send notification
                            if (response.inventoryFull) {
                                module.exports.inventoryFull({ id: socket.id });
                            }
                        }
                    } catch (error) {
                        console.error('Error in pAction:', error);
                        module.exports.message(socket.id, 'Action failed');
                    }
                });

                socket.on('invAction', async function (id, actionId, invSlot) {
                    try {
                        var response = await action.doInvAction(socket.id, id, actionId, invSlot);
                        // If a condition is not met
                        if (!response.result) {
                            module.exports.message(socket.id, response.msg);
                            // Check if inventory was full and send notification
                            if (response.inventoryFull) {
                                module.exports.inventoryFull({ id: socket.id });
                            }
                        }
                    } catch (error) {
                        console.error('Error in invAction:', error);
                        module.exports.message(socket.id, 'Action failed');
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

                socket.on('itemSelection', function (selectedSlot, itemId) {
                    try {
                        world.updatePlayerSelection(socket.id, selectedSlot, itemId);
                    } catch (error) {
                        console.error('Error updating player selection:', error);
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
    io.to(othPlayer.id).emit('playerJoin', player);

    // Also send the current selection state of the joining player to others in range
    if (player.selectedItemId !== null && player.selectedItemId !== undefined) {
        io.to(othPlayer.id).emit('playerSelectionUpdate', player.id, player.selectedItemId);
    }
}

module.exports.playerRemove = function (othPlayer, dcPlayerObj) {
    if (!io) {
        throw new Error("Error: Can't use this function until io is properly initalized");
    }
    io.to(othPlayer.id).emit('playerRemove', dcPlayerObj);
}

module.exports.othPlayerMove = function (othPlayer, oldPlayer, data) {
    if (!io) {
        throw new Error("Error: Can't use this function until io is properly initalized");
    }
    io.to(othPlayer.id).emit('othPlayerMove', oldPlayer, data);
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

module.exports.playerSelectionUpdate = function (othPlayer, playerId, selectedItemId) {
    if (!io) {
        throw new Error("Error: Can't use this function until io is properly initalized");
    }
    console.log('📡 DEBUG: socketController.playerSelectionUpdate called');
    console.log('  Target player:', othPlayer.name, '(ID:', othPlayer.id, ')');
    console.log('  Source player ID:', playerId);
    console.log('  Selected item ID:', selectedItemId);

    io.to(othPlayer.id).emit('playerSelectionUpdate', playerId, selectedItemId);
    console.log('✅ DEBUG: playerSelectionUpdate event emitted to socket:', othPlayer.id);
}

module.exports.inventoryFull = function (player) {
    if (!io) {
        throw new Error("Error: Can't use this function until io is properly initalized");
    }
    io.to(player.id).emit('inventoryFull');
}