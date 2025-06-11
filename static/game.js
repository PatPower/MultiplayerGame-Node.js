// Get Cloudflare Access JWT token from current session
function getCloudflareToken() {
    // Since we're already authenticated and on the page, we need to extract
    // the JWT token that Cloudflare sent with the original request
    // We'll make a simple request and capture the token from the page context
    return fetch('/api/user', {
        method: 'GET',
        credentials: 'include'
    }).then(response => {
        if (response.ok) {
            // The token verification passed, so we know we have a valid session
            // For Socket.IO, we need to get the actual JWT token
            // Since we can't directly access request headers from client-side,
            // we'll use a workaround by making the server provide the token
            return response.json().then(userData => {
                // Return a special token that indicates authenticated session
                return 'cf-access-authenticated';
            });
        }
        throw new Error('Not authenticated');
    }).catch(error => {
        console.error('Authentication check failed:', error);
        return null;
    });
}

// Initialize socket with authentication
async function initializeSocket() {
    try {
        const token = await getCloudflareToken();
        if (!token) {
            throw new Error('No authentication token available');
        }

        console.log('🔌 Initializing Socket.IO connection...');
        console.log('  Using token:', token);

        // Create socket connection with authentication
        const socket = io({
            auth: {
                token: token,
                authenticated: true
            },
            // Force socket.io to include credentials/cookies
            withCredentials: true,
            // Add extra headers if needed
            extraHeaders: {
                'X-Authenticated': 'true'
            }
        });

        socket.on('connect', function() {
            console.log('✅ Connected to server with authentication');
            console.log('🔍 Checking window.authenticatedUser:', window.authenticatedUser);
            
            // Check if user needs to choose a username
            checkUserNameSetup(socket);
        });

        socket.on('auth_error', function(error) {
            console.error('❌ Authentication error:', error);
            alert('Authentication failed. Please refresh the page and try again.');
        });

        socket.on('error', function(error) {
            console.error('❌ Game error:', error);
            alert('Game error: ' + error);
        });

        return socket;
    } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
        alert('Failed to connect. Please ensure you are properly authenticated.');
        return null;
    }
}

// Check if user needs to set up their username
async function checkUserNameSetup(socket) {
    try {
        // Check if user already has a saved username
        const response = await fetch('/api/user/profile', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const userData = await response.json();
            if (userData.hasUsername) {
                // User already has a username, proceed with game
                console.log('👤 User already has username:', userData.username);
                socket.emit('new player', userData.username);
            } else {
                // User needs to choose a username
                console.log('👤 User needs to choose username');
                showUsernameModal(socket);
            }
        } else {
            // Fallback - show username modal
            showUsernameModal(socket);
        }
    } catch (error) {
        console.error('Error checking username:', error);
        // Fallback - show username modal
        showUsernameModal(socket);
    }
}

// Show the username selection modal
function showUsernameModal(socket) {
    const modal = document.getElementById('username-modal');
    const input = document.getElementById('username-input');
    const submitBtn = document.getElementById('username-submit');
    const randomBtn = document.getElementById('username-random');
    const errorDiv = document.getElementById('username-error');
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Focus on input
    setTimeout(() => input.focus(), 100);
    
    // Generate random username function
    function generateRandomUsername() {
        const adjectives = ['Swift', 'Brave', 'Wise', 'Bold', 'Clever', 'Strong', 'Quick', 'Sharp', 'Bright', 'Noble'];
        const nouns = ['Explorer', 'Builder', 'Miner', 'Crafter', 'Hunter', 'Warrior', 'Trader', 'Pioneer', 'Adventurer', 'Hero'];
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const number = Math.floor(Math.random() * 1000);
        return `${adjective}${noun}${number}`;
    }
    
    // Handle random name button
    randomBtn.addEventListener('click', function() {
        input.value = generateRandomUsername();
        input.focus();
    });
    
    // Handle form submission
    function submitUsername() {
        const username = input.value.trim();
        
        // Validate username
        if (!username) {
            showError('Please enter a username');
            return;
        }
        
        if (username.length < 3) {
            showError('Username must be at least 3 characters long');
            return;
        }
        
        if (username.length > 10) {
            showError('Username must be 10 characters or less');
            return;
        }
        
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            showError('Username can only contain letters, numbers, underscores, and hyphens');
            return;
        }
        
        // Disable form while submitting
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
        input.disabled = true;
        randomBtn.disabled = true;
        
        // Save username and start game
        saveUsernameAndStart(socket, username);
    }
    
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        input.focus();
    }
    
    // Handle submit button click
    submitBtn.addEventListener('click', submitUsername);
    
    // Handle Enter key press
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitUsername();
        }
    });
}

// Save username and start the game
async function saveUsernameAndStart(socket, username) {
    try {
        const response = await fetch('/api/user/username', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username: username })
        });
        
        if (response.ok) {
            // Hide modal
            document.getElementById('username-modal').style.display = 'none';
            
            // Start the game
            console.log('👤 Username saved, starting game with:', username);
            socket.emit('new player', username);
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save username');
        }
    } catch (error) {
        console.error('Error saving username:', error);
        
        // Re-enable form
        const submitBtn = document.getElementById('username-submit');
        const input = document.getElementById('username-input');
        const randomBtn = document.getElementById('username-random');
        const errorDiv = document.getElementById('username-error');
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Start Playing';
        input.disabled = false;
        randomBtn.disabled = false;
        
        errorDiv.textContent = error.message || 'Failed to save username. Please try again.';
        errorDiv.style.display = 'block';
    }
}

// Initialize the game
initializeSocket().then(socket => {
    if (!socket) return;

    // Replace the global socket variable
    window.socket = socket;

    // Make these variables globally accessible
    window.currPlayer = {}; // Current Player Object
    window.playerList = {};
    window.defaultActions = {};

    // Setup the canvases
    var bgcxt;
    var strcxt;
    var pcxt;
    var opcxt;
    var ovlycxt;

    /** 
     * Server sends info needed to setup client
     * currentPlayer is the currentplayerObj
     * pList is a dict of playerObj with the id as key
     * ground2D is a 2D array of the local ground map
     * structure2D is a 2D array of the local structure map
     * defaultActions is a dict with all the default actions binded to each structure for the player
     * {structureId: actionId}
    */
    socket.on('setup', function (currentPlayer, pList, ground2D, structure2D, defaultActs) {
        console.log('🎮 Setup event received!');
        console.log('  Current Player:', currentPlayer);
        console.log('  Player List:', pList);
        console.log('  Ground2D size:', ground2D ? ground2D.length : 'null');
        console.log('  Structure2D size:', structure2D ? structure2D.length : 'null');
        console.log('  Default Actions:', defaultActs);
        
        // IMPORTANT: Set global variables FIRST before calling any functions that depend on them
        window.currPlayer = currentPlayer;
        window.playerList = pList;
        window.defaultActions = defaultActs;
        
        // Also set local variables for backward compatibility
        var currPlayer = currentPlayer;
        var playerList = pList;
        var defaultActions = defaultActs;
        
        console.log('✅ Set currPlayer globally:', window.currPlayer);
        
        console.log('🗺️ Loading location map...');
        loadLocationMap(ground2D, structure2D, pList, currPlayer);
        
        console.log('🎨 Setting up canvases...');
        bgcxt = setupBackground(document.getElementById('background'));
        strcxt = setupStructure(document.getElementById('structure'));
        opcxt = setupOtherPlayers(document.getElementById('otherPlayers'));
        ovlycxt = setupOverlay(document.getElementById('overlay'));
        pcxt = setupCurrentPlayer(document.getElementById('player'));
        
        // Make canvas contexts globally accessible
        window.bgcxt = bgcxt;
        window.strcxt = strcxt;
        window.opcxt = opcxt;
        window.ovlycxt = ovlycxt;
        window.pcxt = pcxt;
        
        console.log('🎯 Setting up game elements...');
        updateTileMarker(currPlayer);
        projectSquares(pList);  // Now currPlayer is defined globally
        projectSquare(currentPlayer, {});
        
        // Draw player names on top of grid lines
        drawPlayerNames();
        
        console.log('🎒 Initializing inventory...');
        initalizeInvItems();
        
        console.log('🔨 Setting up crafting area...');
        setupCraftingArea();
        
        console.log('✅ Game setup complete!');
    });

    socket.on('moveCurrPlayer', function (player, pList, ground2D, structure2D) {
        window.currPlayer = player;
        window.playerList = pList;
        
        // Also set local variables for backward compatibility
        var currPlayer = player;
        var playerList = pList;
        
        loadLocationMap(ground2D, structure2D, pList, currPlayer);
        updateBackgroundCanvas();
        refreshStructureCanvas()
        projectSquares(playerList);
        updateTileMarker(currPlayer);
        updateCursorType(mousePos);
        $(document).mousemove();
        
        // Redraw player names on top of grid lines
        drawPlayerNames();
    });

    /**
     * location: global coordinates
     */
    socket.on('removeStructure', function (location) {
        removeStructure(location);
        removeProjectedStructure(location);
        updateCursorType(mousePos);
    });

    /**
     * location: global coordinates
     * structObj: structure object 
     */
    socket.on('placeStructure', function (location, structObj) {
        placeStructure(location, structObj);
        projectStructure(location, structObj);
        updateCursorType(mousePos);
    });

    socket.on('othPlayerMove', function (othP, movement) {
        if (othP.id == currPlayer.id) {
            console.log("Error: othPlayerMove sent current player")
            return;
        }
        // Other player moves out of view
        if (checkIfNewCoordsOutBounds(othP, movement)) {
            removePlayer(othP);
            // Redraw player names after removing player
            drawPlayerNames();
            return;
        }
        // Other player moves in view
        if (!playerList[othP.id]) {
            addPlayer(getNewCoordsLocation(othP, movement));
            // Redraw player names after adding player
            drawPlayerNames();
            return;
        }
        var relCoords = getRelativeCoords(othP)
        // Removes the old player projection
        removeProjectedPlayer(othP, relCoords)
        // Finds the moving player in the playerList array
        var playerObj = playerList[othP.id];
        // TODO: Check if the moving player is moving out of the bounds (should be an error)
        if (playerObj) {
            var newP = getNewCoordsLocation(othP, movement);
            // Change the i, j values for the player in the playerList array
            playerObj.i = newP.i
            playerObj.j = newP.j
        } else {
            console.log("Error: playerObj not found in playerMove");
            return;
        }
        // Shows the new location of the player
        projectSquare(newP, getNewCoordsLocation(relCoords, movement));
        // Move the player in the locationMap
        movePlayer(othP, movement);
        
        // Redraw player names on top of grid lines
        drawPlayerNames();
    });

    socket.on('playerJoin', function (playerObj) {
        addPlayer(playerObj);
        // Redraw player names on top of grid lines
        drawPlayerNames();
    });

    socket.on('playerRemove', function (playerObj) {
        removePlayer(playerObj);
        // Redraw player names on top of grid lines
        drawPlayerNames();
    });

    /**
     * item: the new item
     * pos: the position of the new item (starts at 0)
     * inventoryChanges: [ { item: { id: int, durability: int }, pos: int } , ... ]
     */
    socket.on('playerInventoryUpdate', function (inventoryChanges) {
        updateInventory(inventoryChanges);
    })

    /**
     * item: the new item
     * pos: the position of the new item (starts at 0)
     * inventoryChanges: [ { item: { id: int, durability: int }, pos: int } , ... ]
     */
    socket.on('playerInventorySizeUpdate', function (inventorySize, newInventory) {
        updateInvSize(inventorySize);
        currPlayer.inventory = newInventory;
    })

    // TODO: make a socket that gets responses for invalid movement or actions done

    socket.on('message', function (msg) {
        console.log(msg);
    });

    /**
     * Sends the server a request for an action to be performed
     * @param {*} id id of the structure being interacted with
     * @param {*} actionId a1, a2 or a3 depending if action1, action2 or action3
     * @param {*} location the location of the interacted structure
     */
    function sendPlayerAction(id, actionId, location) {
        socket.emit("pAction", id, actionId, location);
    }

    /**
     * Sends the server a request for an action to be performed
     * @param {*} id id of the item being interacted with
     * @param {*} actionId a1, a2 or a3 depending if action1, action2 or action3
     * @param {*} invSlot the slot of the item being used
     */
    function sendPlayerInvAction(id, actionId, invSlot) {
        socket.emit("invAction", id, actionId, invSlot);
    }

    function emitMovement(movement) {
        socket.emit('movement', movement);
    }

    /**
     * Sends the server two positions of items being swapped (starting from 0)
     * @param {*} pos1 
     * @param {*} pos2 
     */
    function emitItemSwap(pos1, pos2) {
        socket.emit('itemSwap', pos1, pos2);
    }

    /**
     * Sends the server of a request to build a structure at the given location
     * @param {*} itemId 
     * @param {*} actionId 
     * @param {*} invSlot 
     * @param {*} buildLoc 
     */
    function emitBuild(itemId, actionId, invSlot, buildLoc) {
        socket.emit('build', itemId, actionId, invSlot, buildLoc);
    }

    function setupBackground(canvas) {
        // Background
        canvas.width = CWIDTH;
        canvas.height = CHEIGHT;
        var bgcxt = canvas.getContext('2d');
        for (var i = 0; i < NUMCOL; i++) {
            for (var j = 0; j < NUMROW; j++) {
                if (locationMap[i][j].ground.backgroundColor) {
                    bgcxt.fillStyle = locationMap[i][j].ground.backgroundColor;
                    bgcxt.fillRect(BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
                } else {
                    bgcxt.clearRect(BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
                }
            }
        }
        return bgcxt;
    }

    function setupStructure(canvas) {
        canvas.width = CWIDTH;
        canvas.height = CHEIGHT
        var strcxt = canvas.getContext('2d');
        // Waits for the list of struct images to finish loading
        loadImages(function (imgList) {
            for (var i = 0; i < NUMCOL; i++) {
                for (var j = 0; j < NUMROW; j++) {
                    if (locationMap[i][j].structure.sprite) {
                        strcxt.drawImage(imgList[locationMap[i][j].structure.id], BOXSIDE * i, BOXSIDE * j)
                    }
                }
            }
        });
        return strcxt;
    }

    function setupOverlay(canvas) {
        canvas.width = CWIDTH;
        canvas.height = CHEIGHT;
        var ovlycxt = canvas.getContext('2d');
        for (var i = 0; i < NUMCOL; i++) {
            for (var j = 0; j < NUMROW; j++) {
                ovlycxt.strokeRect(BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
            }
        }
        return ovlycxt;
    }

    function setupCurrentPlayer(canvas) {
        // Current Player
        canvas.width = CWIDTH;
        canvas.height = CHEIGHT;
        return canvas.getContext('2d');
    }

    function setupOtherPlayers(canvas) {
        // Other Players
        canvas.width = CWIDTH;
        canvas.height = CHEIGHT;
        return canvas.getContext('2d');
    }

    function updateBackgroundCanvas() {
        // Background
        // Fill entire canvas with blue first
        bgcxt.fillStyle = "blue";
        bgcxt.fillRect(0, 0, CWIDTH, CHEIGHT);
        
        for (var i = 0; i < NUMCOL; i++) {
            for (var j = 0; j < NUMROW; j++) {
                if (locationMap[i][j].ground.backgroundColor) {
                    bgcxt.fillStyle = locationMap[i][j].ground.backgroundColor;
                    bgcxt.fillRect(BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
                } else {
                    // Fill void areas with blue instead of clearing
                    bgcxt.fillStyle = "blue";
                    bgcxt.fillRect(BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
                }
            }
        }
    }

    /**
     * Refresh the whole screen to update structures
     */
    function refreshStructureCanvas() {
        strcxt.clearRect(0, 0, CWIDTH, CHEIGHT);
        loadImages(function (imgList) {
            for (var i = 0; i < NUMCOL; i++) {
                for (var j = 0; j < NUMROW; j++) {
                    if (locationMap[i][j].structure.sprite) {
                        strcxt.drawImage(imgList[locationMap[i][j].structure.id], BOXSIDE * i, BOXSIDE * j)
                    }
                }
            }
        });
    }

    // Projects all the squares in the squaresObj object
    function projectSquares(squaresObj) {
        opcxt.clearRect(0, 0, CWIDTH, CHEIGHT);
        for (var index in squaresObj) {
            projectSquare(squaresObj[index], getRelativeCoords(squaresObj[index]));
        }
    }

    // Projects a square using the i and j in playerObj. Sets the current player as cyan.
    function projectSquare(playerObj, relCoords) {
        // Other players
        if (playerObj.id != currPlayer.id) {
            opcxt.fillStyle = playerObj.color;
            opcxt.fillRect(BOXSIDE * relCoords.i, BOXSIDE * relCoords.j, BOXSIDE, BOXSIDE);
        } else { // Current player
            pcxt.fillStyle = 'cyan';
            pcxt.fillRect(BOXSIDE * 10, BOXSIDE * 7, BOXSIDE, BOXSIDE);
        }
    }
    
    // New function to draw all player names on the overlay canvas (above grid lines)
    function drawPlayerNames() {
        // Clear the entire overlay canvas first
        ovlycxt.clearRect(0, 0, CWIDTH, CHEIGHT);
        
        // Redraw the grid lines
        ovlycxt.strokeStyle = 'black';
        ovlycxt.lineWidth = 1;
        for (var i = 0; i < NUMCOL; i++) {
            for (var j = 0; j < NUMROW; j++) {
                ovlycxt.strokeRect(BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
            }
        }
        
        // Debug: Log current player positions
        console.log('Drawing names for players:');
        console.log('Current player:', window.currPlayer?.name, 'at', window.currPlayer?.i, window.currPlayer?.j);
        
        // Draw names for other players
        for (var playerId in window.playerList) {
            var playerObj = window.playerList[playerId];
            if (playerObj.id != window.currPlayer.id) {
                var relCoords = getRelativeCoords(playerObj);
                console.log('Other player:', playerObj.name, 'global pos:', playerObj.i, playerObj.j, 'relative pos:', relCoords.i, relCoords.j);
                drawPlayerName(ovlycxt, playerObj.name, relCoords.i, relCoords.j);
            }
        }
        
        // Draw name for current player
        if (window.currPlayer && window.currPlayer.name) {
            drawPlayerName(ovlycxt, window.currPlayer.name, 10, 7);
        }
    }
    
    // Helper function to draw a single player name
    function drawPlayerName(context, name, gridI, gridJ) {
        context.fillStyle = 'white';
        context.strokeStyle = 'black';
        context.lineWidth = 2;
        context.font = "bold 12px Arial";
        context.textAlign = 'center';
        
        var nameX = BOXSIDE * gridI + BOXSIDE / 2; // Center horizontally
        var nameY = BOXSIDE * gridJ - 5; // Position above the player
        
        // Draw text outline for better visibility
        context.strokeText(name, nameX, nameY);
        context.fillText(name, nameX, nameY);
        
        // Reset text alignment
        context.textAlign = 'start';
    }
    /**
     * 
     * @param {*} playerObj The player being removed from the screen
     */
    function removeProjectedPlayer(playerObj, relCoords) {
        var otherPlayer = findPlayerByCoords(playerObj)
        // If there is a player on top of the moving player
        if (otherPlayer && playerList[playerObj.id]) {
            // If current player being removed
            if (playerObj.id == currPlayer.id) {
                pcxt.clearRect(BOXSIDE * relCoords.i, BOXSIDE * relCoords.j, BOXSIDE, BOXSIDE);
            }
            opcxt.clearRect(BOXSIDE * relCoords.i, BOXSIDE * relCoords.j, BOXSIDE, BOXSIDE);
            var relCoords = getRelativeCoords(otherPlayer)
            projectSquare(otherPlayer, relCoords);
            return;
        } else {
            // Other players
            if (playerObj.id != currPlayer.id) {
                opcxt.clearRect(BOXSIDE * relCoords.i, BOXSIDE * relCoords.j, BOXSIDE, BOXSIDE);
            } else { // Current players
                pcxt.clearRect(BOXSIDE * relCoords.i, BOXSIDE * relCoords.j, BOXSIDE, BOXSIDE);
            }
        }
    }

    /**
     * Shows a structure at the given location
     * @param {*} structLocation global coords
     * @param {*} structObj 
     */
    function projectStructure(structLocation, structObj) {
        var relCoords = getRelativeCoords(structLocation);
        loadImages(function (imgList) {
            strcxt.drawImage(imgList[structObj.id], BOXSIDE * relCoords.i, BOXSIDE * relCoords.j)
        });
    }

    /**
     * Removes a structure at the given location
     * @param {*} structLocation global coords
     */
    function removeProjectedStructure(structLocation) {
        var relCoords = getRelativeCoords(structLocation);
        strcxt.clearRect(BOXSIDE * relCoords.i, BOXSIDE * relCoords.j, BOXSIDE, BOXSIDE);
    }

    /**
     * Removes player from the local player's game
     * @param {*} playerObj 
     */
    function removePlayer(playerObj) {
        if (playerList[playerObj.id]) {
            var relCoords = getRelativeCoords(playerObj);
            removePlayerFromMap(playerObj, relCoords);
            removeProjectedPlayer(playerObj, relCoords);
            delete playerList[playerObj.id]
        } else {
            console.log("Error: player not found when player being removed")
        }
    }

    function addPlayer(playerObj) {
        playerList[playerObj.id] = playerObj;
        var relCoords = getRelativeCoords(playerObj)
        addOtherPlayerToLocationMap(getTrueRange(currPlayer), playerObj)
        projectSquare(playerObj, relCoords);
    }

    function findPlayerByCoords(playerObj) {
        for (id in playerList) {
            // Finds the user with the same coords thats not itself
            if (playerList[id].i == playerObj.i && playerList[id].j == playerObj.j && id != playerObj.id) {
                return playerList[id];
            }
        }
    }

    /**
     * 
     * @param {*} newObj an object with elements i and j (works with playerObjects)
     * @param {*} movement movement object
     */
    function getNewCoordsLocation(oldObj, movement) {
        var newObj = JSON.parse(JSON.stringify(oldObj))
        if (movement.left) { newObj.i -= 1; }
        if (movement.right) { newObj.i += 1; }
        if (movement.up) { newObj.j -= 1; }
        if (movement.down) { newObj.j += 1; }
        return newObj;
    }

    function checkIfNewCoordsOutBounds(player, movement) {
        var relCoords = getRelativeCoords(getNewCoordsLocation(player, movement));
        if (relCoords.i < 0 || relCoords.i >= NUMCOL) {
            return true;
        }
        if (relCoords.j < 0 || relCoords.j >= NUMROW) {
            return true;
        }
        return false;
    }

    function defaultAction(structId, location) {
        var defAction = getDefaultAction(structId);
        if (defAction) {
            sendPlayerAction(structId, defAction, location);
        }
    }

    function getDefaultAction(structId) {
        var structObj = getStructureObj({ id: structId, health: 0, owner: "game" });
        if (structObj) {
            if (structId in window.defaultActions) {
                var defAction = "a" + window.defaultActions[structId];
                if (structObj.actions[defAction]) {
                    return defAction
                }
            }
            if (structObj.actions["a1"]) {
                return "a1"
            }
        }
        return null
    }

    // Make functions globally accessible for other scripts
    window.sendPlayerAction = sendPlayerAction;
    window.sendPlayerInvAction = sendPlayerInvAction;
    window.emitMovement = emitMovement;
    window.emitItemSwap = emitItemSwap;
    window.emitBuild = emitBuild;
    window.defaultAction = defaultAction;
    window.getDefaultAction = getDefaultAction;
    
    // Additional functions that other scripts may need
    window.addPlayer = addPlayer;
    window.removePlayer = removePlayer;
    window.projectSquare = projectSquare;
    window.removeProjectedPlayer = removeProjectedPlayer;
    window.projectStructure = projectStructure;
    window.removeProjectedStructure = removeProjectedStructure;
    window.updateBackgroundCanvas = updateBackgroundCanvas;
    window.refreshStructureCanvas = refreshStructureCanvas;
    window.projectSquares = projectSquares;
    window.setupBackground = setupBackground;
    window.setupStructure = setupStructure;
    window.setupOverlay = setupOverlay;
    window.setupCurrentPlayer = setupCurrentPlayer;
    window.setupOtherPlayers = setupOtherPlayers;
    window.drawPlayerNames = drawPlayerNames;
});

// Add logout functionality
$(document).ready(function() {
    $('#logout-btn').click(function() {
        if (confirm('Are you sure you want to logout?')) {
            // Disconnect from the game socket
            if (window.socket) {
                window.socket.disconnect();
            }
            
            // Clear Cloudflare Access session by redirecting to logout URL
            window.location.href = '/cdn-cgi/access/logout';
        }
    });
});