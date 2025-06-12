var invElement = document.getElementById("inv");
var itemArea = document.getElementById("itemArea");
var invCxt = setupInventory(invElement);
var currentSelectedSlot = -1;
var buildAnimationId = -1;
var itemJson = [];
var inventoryInitialized = false;
var pendingInventoryUpdates = [];

invTitle(invCxt)

function invTitle(invcxt) {
    invcxt.fillStyle = "rgb(208, 146, 15)";
    invcxt.fillRect(0, 0, INVWIDTH, 20);
    invcxt.fillStyle = "black";
    invcxt.strokeRect(0, 0, INVWIDTH, 20);
    invcxt.fillStyle = 'black';
    invcxt.font = "bold 16px Almendra SC";
    invcxt.fillText("Inventory", INVWIDTH / 2 - 30, 14);
}

function setupInventory(canvas) {
    // Background
    canvas.width = INVWIDTH;
    canvas.height = INVHEIGHT;
    var invcxt = canvas.getContext('2d');
    invcxt.fillStyle = "rgb(208, 146, 15)";
    invcxt.fillRect(0, 20, INVWIDTH, INVHEIGHT);
    for (var i = 0; i < INVNUMCOL; i++) {
        for (var j = 0; j < INVNUMROW; j++) {
            invcxt.strokeRect(INVBOXSIDE * i, INVBOXSIDE * j + 20, INVBOXSIDE, INVBOXSIDE);
        }
    }
    return invcxt;
}

/**
 * item: the new item
 * pos: the position of the new item (starts at 0)
 * inventoryChanges: [ { item: { id: int, durability: int }, pos: int } , ... ]
 */
function updateInventory(inventoryChanges) {
    // If inventory isn't initialized yet, queue the updates
    if (!inventoryInitialized) {
        console.log('📦 Inventory not initialized yet, queueing update:', inventoryChanges);
        pendingInventoryUpdates.push(inventoryChanges);
        return;
    }

    // Check if inventory is initialized first
    if (!itemArea || !currPlayer || !currPlayer.inventory) {
        console.warn('Inventory not initialized yet, skipping update');
        return;
    }

    console.log('📦 Processing inventory update:', inventoryChanges);

    for (invChange of inventoryChanges) {
        console.log('🔍 Processing change:', invChange);
        var i = invChange.pos + 1;
        var targetElementId = 'item' + i;
        console.log('🎯 Updating DOM element:', targetElementId, 'for inventory position:', invChange.pos);

        // Use getElementById instead of childNodes to avoid indexing issues
        var img = document.getElementById(targetElementId);
        console.log('🔗 DOM element before update:', img);

        // Check if the DOM element exists
        if (!img) {
            console.warn(`Inventory slot ${targetElementId} DOM element not found, skipping update for position ${invChange.pos}`);
            continue;
        }

        var oldItemObj = currPlayer.inventory[invChange.pos];
        console.log('🔄 Updating inventory array: position', invChange.pos, 'from', oldItemObj, 'to', invChange.item);
        currPlayer.inventory[invChange.pos] = invChange.item;

        if (invChange.item) {
            console.log('🆕 Setting new item icon:', getItemIcon(invChange.item.id));
            img.src = getItemIcon(invChange.item.id);
            makeDraggable("#" + targetElementId);
            enableDragging("#" + targetElementId);
        } else {
            console.log('🗑️ Setting empty icon');
            img.src = getItemIcon(-1);
            preventDragging("#" + targetElementId);
        }
        makeDroppable("#" + targetElementId);

        console.log('✅ DOM element after update:', img);

        // If item is being removed from inv and is currently selected, select the same item in inv or deselect
        if (invChange.pos == currentSelectedSlot) {
            if (invChange.item == null) {
                var nextItemSlot = currPlayer.inventory.findIndex(o => o && o.id == oldItemObj.id);
                if (nextItemSlot >= 0) {
                    console.log(nextItemSlot)
                    selectInvItem(nextItemSlot);
                } else {
                    deselectInvItem();
                }
            } else {
                deselectInvItem();
            }
        }
    }
}

function updateInvSize(newInventorySize) {
    // Check if inventory is initialized first
    if (!itemArea || !currPlayer) {
        console.warn('Inventory not initialized yet, skipping size update');
        return;
    }

    var oldInvSize = currPlayer.inventorySize;
    var difference = newInventorySize - oldInvSize;
    if (difference == 0) {
        return;
    } else if (difference > 0) {
        // Unlock inv spots
        for (var i = oldInvSize + 1; i <= newInventorySize; i++) {
            var img = document.getElementById('item' + i);

            // Check if the DOM element exists
            if (!img) {
                console.warn(`Inventory slot item${i} DOM element not found for size update`);
                continue;
            }

            img.setAttribute("class", "item");
            img.setAttribute("id", "item" + i);
            img.src = getItemIcon(-1);
            preventDragging("#item" + i);
            makeDroppable("#item" + i);
        }
    } else {
        // Lock inv spots
        for (var i = oldInvSize; i > newInventorySize; i--) {
            var img = document.getElementById('item' + i);

            // Check if the DOM element exists
            if (!img) {
                console.warn(`Inventory slot item${i} DOM element not found for size update`);
                continue;
            }

            img.setAttribute("class", "lockeditemslot");
            img.setAttribute("id", "item" + i);
            img.src = getItemIcon(-2);
            preventDragging("#item" + i);
            $('#item' + i).droppable('disable');
        }
    }
    currPlayer.inventorySize = newInventorySize;
    updateInvLockIcon()
}

function initalizeInvItems() {
    console.log('🏗️ Initializing inventory items...');
    console.log('📋 Player inventory contents:');
    for (let i = 0; i < currPlayer.inventory.length; i++) {
        const item = currPlayer.inventory[i];
        if (item) {
            console.log(`  Slot ${i}: ${getItemObj(item.id)?.name || 'Unknown'} (ID: ${item.id})`);
        } else {
            console.log(`  Slot ${i}: Empty`);
        }
    }
    console.log('📋 DOM elements being created:');

    invLockIcon();
    for (var i = 1; i <= currPlayer.inventorySize; i++) {
        var item = currPlayer.inventory[i - 1];
        var img = document.createElement('img');
        img.setAttribute("class", "item");
        img.setAttribute("id", "item" + i);
        if (item) {
            const itemName = getItemObj(item.id)?.name || 'Unknown';
            console.log(`  DOM item${i} → Slot ${i - 1}: ${itemName} (ID: ${item.id})`);
            img.src = getItemIcon(item.id);
            itemArea.append(img);
            makeDraggable("#item" + i);
        } else {
            console.log(`  DOM item${i} → Slot ${i - 1}: Empty`);
            img.src = getItemIcon(-1);
            itemArea.append(img);
            preventDragging("#item" + i);
        }
        makeDroppable("#item" + i);
    }
    for (i = currPlayer.inventorySize + 1; i <= 60; i++) {
        var img = document.createElement('img');
        img.setAttribute("class", "lockeditemslot");
        img.setAttribute("id", "item" + i);
        img.src = getItemIcon(-2);
        itemArea.append(img);
        preventDragging("#item" + i);
    }

    // Mark inventory as initialized
    inventoryInitialized = true;
    console.log('✅ Inventory initialization complete!');

    // Process any queued updates
    if (pendingInventoryUpdates.length > 0) {
        console.log('📦 Processing', pendingInventoryUpdates.length, 'queued inventory updates');
        for (var update of pendingInventoryUpdates) {
            updateInventory(update);
        }
        pendingInventoryUpdates = []; // Clear the queue
    }
}

function invLockIcon() {
    // Temporarily disable lock icon creation to debug positioning issue
    console.log('🔒 Lock icon creation disabled for debugging');

    // Clean up any existing lock icons
    var existingLockIcon = document.getElementById("lockimg");
    if (existingLockIcon) {
        existingLockIcon.remove();
        console.log('🗑️ Removed existing lock icon');
    }

    // Also check for any lockimg elements that might be floating around
    var lockimgs = document.querySelectorAll('.lockimg');
    lockimgs.forEach(function (img) {
        img.remove();
        console.log('🗑️ Removed floating lock icon');
    });

    // Don't create any new lock icons for now
    return;
}

function updateInvLockIcon() {
    var img = document.getElementById("lockimg");

    // Check if the lock icon element exists
    if (!img) {
        console.warn('Lock icon element not found, skipping update');
        return;
    }

    if (currPlayer.inventorySize >= 60) {
        img.style.visibility = 'hidden';
        return;
    } else {
        img.style.visibility = 'visible';
    }

    // Calculate position relative to the inventory area
    var nextSlot = currPlayer.inventorySize; // 0-based index of next slot to unlock
    var invX = nextSlot % 4; // Column (0-3)
    var invY = Math.floor(nextSlot / 4); // Row

    // Position the lock icon over the next slot to be unlocked
    var x = invX * INVBOXSIDE + INVBOXSIDE / 2 - 11; // Center horizontally (22px width / 2 = 11)
    var y = invY * INVBOXSIDE + INVBOXSIDE / 2 - 11; // Center vertically (22px height / 2 = 11)

    // Use left/top instead of marginLeft/marginTop for absolute positioning
    img.style.left = x + 'px';
    img.style.top = y + 'px';
}


function getItemIcon(id) {
    var item = itemJson.find(o => o.id == id);
    if (item) {
        return item.icon;
    } else {
        return null;
    }
}

function makeDraggable(id) {
    $(id).draggable({
        opacity: 0.8,
        revert: true,
        revertDuration: 0,
    });
}

function makeDroppable(id) {
    $(id).droppable({
        disabled: false,
        drop: function (event, ui) {
            //Make item temp invisible
            var draggedItemId = ui.draggable.attr('id');
            document.getElementById(draggedItemId).src = getItemIcon(-1);
            // Origin
            var pos1 = parseInt(draggedItemId.slice(4)) - 1
            // Destination
            var pos2 = parseInt($(this).attr('id').slice(4)) - 1
            emitItemSwap(pos1, pos2);
            if (currentSelectedSlot == pos1) {
                selectInvItem(pos2);
            } else if (currentSelectedSlot == pos2) {
                selectInvItem(pos1);
            }
            console.log(pos1, pos2)
        }
    });
}

function preventDragging(id) {
    $(id).on('dragstart', function (event) {
        event.preventDefault();
    });
}
function enableDragging(id) {
    $(id).off('dragstart');
}

function getItemObj(id) {
    var item = itemJson.find(o => o.id == id);
    return item;
}

function selectInvItem(slot) {
    console.log("📦 DEBUG: selectInvItem called with slot:", slot);

    var rect = $(itemArea).offset();
    var invX = slot % 4;
    var invY = Math.floor(slot / 4);
    console.log("SELECT INV ITEM RECT", rect)
    console.log("A", rect.left + invX * INVBOXSIDE, rect.top + invY * INVBOXSIDE)
    $("#select").css({
        visibility: "visible",
        top: rect.top + invY * INVBOXSIDE,
        left: rect.left + invX * INVBOXSIDE,
    });
    animateReach();
    currentSelectedSlot = slot;

    // Get the selected item ID
    var selectedItemId = null;
    if (currPlayer.inventory[slot]) {
        selectedItemId = currPlayer.inventory[slot].id;
    }

    console.log("🎯 DEBUG: Item selection details:");
    console.log("  Slot:", slot);
    console.log("  Item ID:", selectedItemId);
    console.log("  Current player inventory:", currPlayer.inventory);

    // Redraw current player immediately to show the selected item icon
    if (window.projectSquare && window.currPlayer) {
        window.projectSquare(window.currPlayer, {});
    }

    // Notify server about selection
    if (window.socket) {
        console.log("📡 DEBUG: Sending itemSelection to server");
        console.log("  Socket exists:", !!window.socket);
        console.log("  Sending slot:", slot);
        console.log("  Sending itemId:", selectedItemId);
        window.socket.emit('itemSelection', slot, selectedItemId);
        console.log("✅ DEBUG: itemSelection event emitted");
    } else {
        console.log("❌ DEBUG: No socket available to send selection");
    }
}

function deselectInvItem() {
    currentSelectedSlot = -1;
    $("#select").css({
        visibility: "hidden"
    });
    var selectedBuild = $("#selectedBuild");
    selectedBuild.attr("src", null);
    selectedBuild.css({
        visibility: "hidden"
    });
    if (buildAnimationId != -1) {
        clearInterval(buildAnimationId);
        buildAnimationId = -1;

        // Clear the build animation canvas instead of overlay
        window.buildAnimcxt.clearRect(BOXSIDE * (HORIZONTALRADIUS - 1), BOXSIDE * (VERTICALRADIUS - 1), BOXSIDE * 3, BOXSIDE * 3);
    }

    // Redraw current player immediately to remove the selected item icon
    if (window.projectSquare && window.currPlayer) {
        window.projectSquare(window.currPlayer, {});
    }

    // Notify server about deselection
    if (window.socket) {
        window.socket.emit('itemSelection', -1, null);
    }
}

function getSelectedItemId() {
    if (currentSelectedSlot == -1) {
        console.log("Error: No item selected!")
        return;
    }
    return currPlayer.inventory[currentSelectedSlot].id
}

function isSlotPlaceable(slot) {
    // Checks if the id of the placeable struct is null
    if (getItemObj(currPlayer.inventory[slot].id).placeableStructId || getItemObj(currPlayer.inventory[slot].id).placeableStructId == 0) {
        return true;
    }
    return false;
}

function animateReach() {
    // Stop building animation if one is one already
    if (buildAnimationId != -1) {
        clearInterval(buildAnimationId);
        buildAnimationId = -1;
    }

    buildAnimationId = setInterval(frame, 20);
    var alpha = 0.1;
    var alphaChange = 0.002;

    function frame() {
        if (alpha <= 0.12) {
            alphaChange = 0.0025;
        } else if (alpha >= 0.21) {
            alphaChange = -alphaChange;
        }

        // Use the build animation canvas instead of overlay
        window.buildAnimcxt.globalAlpha = alpha;
        window.buildAnimcxt.fillStyle = "red";
        window.buildAnimcxt.clearRect(BOXSIDE * (HORIZONTALRADIUS - 1), BOXSIDE * (VERTICALRADIUS - 1), BOXSIDE * 3, BOXSIDE * 3);
        window.buildAnimcxt.fillRect(BOXSIDE * (HORIZONTALRADIUS - 1), BOXSIDE * (VERTICALRADIUS - 1), BOXSIDE * 3, BOXSIDE * 3);
        window.buildAnimcxt.globalAlpha = 1;
        window.buildAnimcxt.clearRect(BOXSIDE * (HORIZONTALRADIUS), BOXSIDE * (VERTICALRADIUS), BOXSIDE, BOXSIDE);

        // Redraw player names on overlay (this will also redraw the grid)
        drawPlayerNames();

        alpha += alphaChange;
    }
}

/**
 * Checks if the slot has an item that can be selected
 * @param {*} slot inv slot starting at 0
 */
function getActionId(slot) {
    var itemId = currPlayer.inventory[slot]
    if (itemId) {
        var itemObj = getItemObj(itemId.id);
        for (actionId in itemObj.actions) {
            if (itemObj.actions[actionId] == "Select") {
                return actionId;
            }
        }
    }
    return;
}

/**
 * Shows a message when inventory is full and fades it away after 2 seconds
 */
function showInventoryFullMessage() {
    console.log("🚨 showInventoryFullMessage() called!");
    var messageElement = $("#inventoryFullMessage");
    console.log("📦 Message element found:", messageElement.length > 0);
    console.log("📦 Message element:", messageElement);

    // Calculate player position on screen
    // Player is always at grid position (HORIZONTALRADIUS, VERTICALRADIUS) = (10, 7)
    // Overlay canvas has margins: 30px left, 20px top
    var playerScreenX = 30 + (HORIZONTALRADIUS * BOXSIDE) + (BOXSIDE / 2); // Center of player square horizontally
    var playerScreenY = 20 + (VERTICALRADIUS * BOXSIDE); // Top of player square

    // Position message above the player
    messageElement.css({
        position: 'absolute',
        left: playerScreenX + 15, // 20px to the right of player
        top: playerScreenY - 60, // 60px above player
        transform: 'translateX(-50%)', // Center horizontally on player
        zIndex: 10000
    });

    // Show the message with a fade-in effect
    messageElement.stop(true, true).fadeIn(300);
    console.log("✅ Message should now be visible above player");

    // Hide the message after 2 seconds with a fade-out effect
    setTimeout(function () {
        console.log("⏰ Hiding message after timeout");
        messageElement.fadeOut(500);
    }, 2000);
}

/**
 * Test function to manually trigger the inventory full message
 */
function testInventoryFullMessage() {
    console.log("🧪 Testing inventory full message...");
    showInventoryFullMessage();
}

// Make test function globally accessible
window.testInventoryFullMessage = testInventoryFullMessage;

/**
 * Shows a highlight over the first axe found in the inventory
 */
function highlightAxe() {
    // Find the first axe (item id 6) in the inventory
    var axeSlot = -1;
    for (var i = 0; i < currPlayer.inventory.length; i++) {
        if (currPlayer.inventory[i] && currPlayer.inventory[i].id === 6) {
            axeSlot = i;
            break;
        }
    }

    if (axeSlot !== -1) {
        // Calculate position relative to the inventory area
        var rect = $(itemArea).offset();
        var invX = axeSlot % 4;
        var invY = Math.floor(axeSlot / 4);

        $("#axeHighlight").css({
            visibility: "visible",
            top: rect.top + invY * INVBOXSIDE,
            left: rect.left + invX * INVBOXSIDE,
        });
    }
}

/**
 * Hides the axe highlight
 */
function hideAxeHighlight() {
    $("#axeHighlight").css({
        visibility: "hidden"
    });
}