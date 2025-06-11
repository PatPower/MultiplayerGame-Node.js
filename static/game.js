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
            return response.json().then(userData => {
                // Check if we're in dev mode
                if (userData.devMode) {
                    console.log('🔧 Dev mode detected, bypassing authentication');
                    return 'dev-mode-token';
                }
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
                if (userData.devMode) {
                    console.log('🔧 Dev mode: Starting game immediately');
                }
                socket.emit('new player', userData.username);
            } else {
                // User needs to choose a username (shouldn't happen in dev mode)
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
    
    socket.on('playerSelectionUpdate', function (playerId, selectedItemId) {
        console.log('📥 DEBUG: Client received playerSelectionUpdate');
        console.log('  Player ID:', playerId);
        console.log('  Selected item ID:', selectedItemId);
        console.log('  Current playerList:', Object.keys(window.playerList));
        console.log('  Player exists in list:', !!window.playerList[playerId]);
        
        // Update the player's selection data in our local playerList
        if (window.playerList[playerId]) {
            console.log('✅ DEBUG: Found player in list, updating selection');
            console.log('  Player name:', window.playerList[playerId].name);
            console.log('  Old selectedItemId:', window.playerList[playerId].selectedItemId);
            
            window.playerList[playerId].selectedItemId = selectedItemId;
            
            console.log('  New selectedItemId:', window.playerList[playerId].selectedItemId);
            console.log('🎨 DEBUG: Calling projectSquares to redraw players');
            
            // Redraw all players to show the updated selection
            projectSquares(window.playerList);
            drawPlayerNames();
            
            console.log('✅ DEBUG: Player selection update complete');
        } else {
            console.log('❌ DEBUG: Player not found in playerList');
            console.log('  Available players:', Object.keys(window.playerList));
        }
    });

    // Handle mining actions from other players
    socket.on('playerActionBroadcast', function (data) {
        console.log('🔨 Received playerActionBroadcast:', data);
        console.log('🎯 Current playerList:', window.playerList);
        console.log('🎯 Looking for player ID:', data.playerId);
        console.log('🎯 Player exists in list:', !!window.playerList[data.playerId]);
        
        // Only handle mining actions for now
        if (data.actionType === "mining" && data.structId === 1) {
            console.log('✅ Mining action detected, calling showOtherPlayerMiningIcon');
            // Show mining icon for the other player
            showOtherPlayerMiningIcon(data.playerId);
        } else {
            console.log('❌ Not a mining action or wrong struct ID');
        }
    });

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
                    // Fill void areas with black and add stars
                    drawVoidWithStars(bgcxt, BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
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
        // Fill entire canvas with black first for void areas
        bgcxt.fillStyle = "black";
        bgcxt.fillRect(0, 0, CWIDTH, CHEIGHT);
        
        for (var i = 0; i < NUMCOL; i++) {
            for (var j = 0; j < NUMROW; j++) {
                if (locationMap[i][j].ground.backgroundColor) {
                    bgcxt.fillStyle = locationMap[i][j].ground.backgroundColor;
                    bgcxt.fillRect(BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
                } else {
                    // Fill void areas with black and add stars
                    drawVoidWithStars(bgcxt, BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
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
            
            // Draw selected item icon if player has something selected
            if (playerObj.selectedItemId !== null) {
                drawSelectedItemOnPlayer(opcxt, playerObj.selectedItemId, relCoords.i, relCoords.j);
            }
        } else { // Current player
            redrawCurrentPlayer();
        }
    }
    
    // Helper function to draw selected item icon on a player
    function drawSelectedItemOnPlayer(context, itemId, gridI, gridJ) {
        // Get the item icon
        var itemIcon = getItemIcon(itemId);
        if (!itemIcon) return;
        
        // Create an image element and draw it
        var img = new Image();
        img.onload = function() {
            // Draw the item icon in the center of the player square with doubled size
            var iconSize = BOXSIDE * 0.8; // 80% of box size (doubled from 40%)
            var iconX = BOXSIDE * gridI + BOXSIDE / 2 - iconSize / 2; // Center horizontally
            var iconY = BOXSIDE * gridJ + BOXSIDE / 2 - iconSize / 2; // Center vertically
            
            // Draw a semi-transparent background
            context.fillStyle = 'rgba(255, 255, 255, 0.8)';
            context.fillRect(iconX - 2, iconY - 2, iconSize + 4, iconSize + 4);
            
            // Draw the item icon
            context.drawImage(img, iconX, iconY, iconSize, iconSize);
        };
        img.src = itemIcon;
        console.log('🖼️ Drawing item icon for ID:', itemId, 'at grid position:', gridI, gridJ);
    }
    
    // Helper function to show pickaxe icon during mining
    function showMiningPickaxe() {
        showingMiningIcon = true;
        
        // Clear any existing timeout
        if (miningActionTimeout) {
            clearTimeout(miningActionTimeout);
        }
        
        // Redraw the current player with mining icon
        redrawCurrentPlayer();
        
        // Set timeout to hide the icon after 500ms
        miningActionTimeout = setTimeout(function() {
            showingMiningIcon = false;
            redrawCurrentPlayer();
            miningActionTimeout = null;
        }, 500);
    }
    
    // Helper function to show mining icon for other players
    function showOtherPlayerMiningIcon(playerId) {
        console.log('🔨 showOtherPlayerMiningIcon called for player:', playerId);
        
        if (!window.playerList[playerId]) {
            console.log('❌ Player not found in playerList:', playerId);
            return;
        }
        
        var playerObj = window.playerList[playerId];
        console.log('👤 Player object found:', playerObj);
        
        var relCoords = getRelativeCoords(playerObj);
        console.log('📍 Relative coordinates:', relCoords);
        
        // Check if player is within visible bounds
        if (relCoords.i < 0 || relCoords.i >= NUMCOL || relCoords.j < 0 || relCoords.j >= NUMROW) {
            console.log('🚫 Player is outside visible bounds, skipping mining icon');
            return;
        }
        
        // Store the original item the player was showing (could be undefined/null)
        var originalItemId = playerObj.selectedItemId;
        console.log('🎒 Original item ID:', originalItemId);
        
        // Create a temporary mining state for this player
        if (!window.playerMiningStates) {
            window.playerMiningStates = {};
        }
        
        // Store the original state and set mining flag
        window.playerMiningStates[playerId] = {
            originalItemId: originalItemId,
            isMining: true
        };
        
        // Temporarily set mining icon (pickaxe)
        playerObj.selectedItemId = 0; // Item ID 0 is the pickaxe
        console.log('⛏️ Set player item to pickaxe (ID: 0)');
        
        // Redraw the player with mining icon
        console.log('🎨 Redrawing player with mining icon');
        projectSquare(playerObj, relCoords);
        
        // Set timeout to restore original item after 500ms
        setTimeout(function() {
            console.log('⏰ Timeout triggered, restoring original item for player:', playerId);
            
            if (window.playerList[playerId] && window.playerMiningStates[playerId]) {
                var miningState = window.playerMiningStates[playerId];
                playerObj.selectedItemId = miningState.originalItemId;
                console.log('🔄 Restored original item ID:', miningState.originalItemId);
                
                // Clean up mining state
                delete window.playerMiningStates[playerId];
                
                // Redraw the player
                projectSquare(playerObj, relCoords);
                console.log('✅ Player redrawn with original item');
            } else {
                console.log('❌ Player no longer exists when trying to restore item, cleaning up mining state');
                if (window.playerMiningStates[playerId]) {
                    delete window.playerMiningStates[playerId];
                }
            }
        }, 500);
    }
    
    // Helper function to redraw current player
    function redrawCurrentPlayer() {
        // Clear the current player area
        pcxt.clearRect(BOXSIDE * 10, BOXSIDE * 7, BOXSIDE, BOXSIDE);
        
        // Draw the player square
        pcxt.fillStyle = 'cyan';
        pcxt.fillRect(BOXSIDE * 10, BOXSIDE * 7, BOXSIDE, BOXSIDE);
        
        // Show mining pickaxe icon if currently mining
        if (showingMiningIcon) {
            drawSelectedItemOnPlayer(pcxt, 0, 10, 7); // Item ID 0 is the pickaxe
        }
        // Otherwise show selected item icon if current player has something selected
        else if (currentSelectedSlot !== -1 && currPlayer.inventory[currentSelectedSlot]) {
            drawSelectedItemOnPlayer(pcxt, currPlayer.inventory[currentSelectedSlot].id, 10, 7);
        }
    }
    
    // New function to draw all player names on the overlay canvas (above grid lines)
    function drawPlayerNames() {
        // Clear the entire overlay canvas first
        ovlycxt.clearRect(0, 0, CWIDTH, CHEIGHT);
        
        // Redraw the grid lines only on non-void areas
        ovlycxt.strokeStyle = 'black';
        ovlycxt.lineWidth = 1;
        for (var i = 0; i < NUMCOL; i++) {
            for (var j = 0; j < NUMROW; j++) {
                // Only draw grid lines where there's ground (not void)
                if (locationMap[i][j].ground.backgroundColor) {
                    ovlycxt.strokeRect(BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
                }
            }
        }
        
        // Draw names for other players
        for (var playerId in window.playerList) {
            var playerObj = window.playerList[playerId];
            if (playerObj.id != window.currPlayer.id) {
                var relCoords = getRelativeCoords(playerObj);
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
        // Save the current context state
        context.save();
        
        // Set up text properties
        context.font = "bold 12px Arial";
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        var nameX = BOXSIDE * gridI + BOXSIDE / 2; // Center horizontally
        var nameY = BOXSIDE * gridJ - 10; // Position above the player
        
        // Draw a semi-transparent background rectangle for better readability
        var textWidth = context.measureText(name).width;
        var padding = 2;
        var textHeight = 12; // Font size
        
        // Calculate background rectangle position
        var bgX = nameX - textWidth/2 - padding;
        var bgY = nameY - textHeight/2 - padding;
        var bgWidth = textWidth + padding * 2;
        var bgHeight = textHeight + padding * 2;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(bgX, bgY, bgWidth, bgHeight);
        
        // Draw the text in white
        context.fillStyle = 'white';
        context.fillText(name, nameX, nameY);
        
        // Restore the context state
        context.restore();
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
    window.getNewCoordsLocation = getNewCoordsLocation;
    window.checkIfNewCoordsOutBounds = checkIfNewCoordsOutBounds;
    
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
    
    // Mining action tracking
    var miningActionTimeout = null;
    var showingMiningIcon = false;
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

// Helper function to draw void areas with black background and stars
function drawVoidWithStars(context, x, y, width, height) {
    // Fill with black background
    context.fillStyle = "black";
    context.fillRect(x, y, width, height);
    
    // Generate a deterministic pattern of stars based on position
    // This ensures stars stay in the same place when redrawing
    var gridI = Math.floor(x / BOXSIDE);
    var gridJ = Math.floor(y / BOXSIDE);
    var seed = gridI * 31 + gridJ * 17; // Simple hash for deterministic randomness
    
    // Generate different types of stars
    var totalStars = 4 + (seed % 4); // 4-7 stars per tile
    
    for (var i = 0; i < totalStars; i++) {
        // Use the seed to generate consistent star positions
        var starSeed = seed + i * 47;
        var starX = x + ((starSeed * 13) % width);
        var starY = y + ((starSeed * 23) % height);
        
        // Determine star type based on seed
        var starType = (starSeed * 3) % 100;
        
        if (starType < 70) {
            // Distant small white stars (70% chance)
            context.fillStyle = "rgba(255, 255, 255, 0.6)";
            var starSize = 0.5 + ((starSeed * 7) % 1);
            context.beginPath();
            context.arc(starX, starY, starSize, 0, 2 * Math.PI);
            context.fill();
            
        } else if (starType < 90) {
            // Medium bright white stars (20% chance)
            context.fillStyle = "rgba(255, 255, 255, 0.9)";
            var starSize = 0.8 + ((starSeed * 5) % 1);
            context.beginPath();
            context.arc(starX, starY, starSize, 0, 2 * Math.PI);
            context.fill();
            
        } else {
            // Bright white stars with glow (10% chance)
            var starSize = 1 + ((starSeed * 11) % 0.8);
            
            // Draw outer glow
            context.fillStyle = "rgba(255, 255, 255, 0.3)";
            context.beginPath();
            context.arc(starX, starY, starSize + 0.5, 0, 2 * Math.PI);
            context.fill();
            
            // Draw bright center
            context.fillStyle = "rgba(255, 255, 255, 1)";
            context.beginPath();
            context.arc(starX, starY, starSize, 0, 2 * Math.PI);
            context.fill();
        }
    }
    
    // Add some very faint distant stars for extra depth
    var microStars = 2 + (seed % 3); // 2-4 micro stars
    context.fillStyle = "rgba(255, 255, 255, 0.2)";
    
    for (var j = 0; j < microStars; j++) {
        var microSeed = seed + j * 83 + 1000;
        var microX = x + ((microSeed * 19) % width);
        var microY = y + ((microSeed * 29) % height);
        
        context.beginPath();
        context.arc(microX, microY, 0.3, 0, 2 * Math.PI);
        context.fill();
    }
}