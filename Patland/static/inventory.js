
var invElement = document.getElementById("inv");
var itemArea = document.getElementById("itemArea");
var invCxt = setupInventory(invElement);
var itemJson = [];
var currentSelectedSlot = -1;
var buildAnimationId = -1;

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
    for (var i = 0; i < INVNUMCOL; i++) {
        for (var j = 0; j < INVNUMROW; j++) {
            invcxt.fillStyle = "rgb(208, 146, 15)";
            invcxt.fillRect(INVBOXSIDE * i, INVBOXSIDE * j + 20, INVBOXSIDE, INVBOXSIDE);
            invcxt.fillStyle = "black";
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
    for (invChange of inventoryChanges) {
        var i = invChange.pos + 1;
        var img = itemArea.childNodes[i];
        var oldItemObj = currPlayer.inventory[invChange.pos];
        currPlayer.inventory[invChange.pos] = invChange.item;
        if (invChange.item) {
            img.src = getItemIcon(invChange.item.id);
            makeDraggable(i);
            enableDragging(i);
        } else {
            img.src = getItemIcon(-1);

            preventDragging(i);
        }
        makeDroppable(i);
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
    var oldInvSize = currPlayer.inventorySize;
    var difference = newInventorySize - oldInvSize;
    if (difference == 0) {
        return;
    } else if (difference > 0) {
        // Unlock inv spots
        for (var i = oldInvSize + 1; i < newInventorySize + 1; i++) {

            var img = itemArea.childNodes[i];
            img.setAttribute("class", "item");
            img.setAttribute("id", "item" + i);
            img.src = getItemIcon(-1);
            preventDragging(i);
            makeDroppable(i);
        }
    } else {
        // Lock inv spots
        for (var i = oldInvSize; i > newInventorySize; i--) {
            var img = itemArea.childNodes[i];
            img.setAttribute("class", "lockeditemslot");
            img.setAttribute("id", "item" + i);
            img.src = getItemIcon(-2);
            preventDragging(i);
            $('#item' + i).droppable('disable');
        }
    }
    currPlayer.inventorySize = newInventorySize;
    updateInvLockIcon()
}

function initalizeInvItems() {
    invLockIcon();
    for (var i = 1; i <= currPlayer.inventorySize; i++) {
        var item = currPlayer.inventory[i - 1];
        var img = document.createElement('img');
        img.setAttribute("class", "item");
        img.setAttribute("id", "item" + i);
        if (item) {
            img.src = getItemIcon(item.id);
            itemArea.append(img);
            makeDraggable(i);
        } else {
            img.src = getItemIcon(-1);
            itemArea.append(img);
            preventDragging(i);
        }
        makeDroppable(i);
    }
    for (i = currPlayer.inventorySize + 1; i <= 60; i++) {
        var img = document.createElement('img');
        img.setAttribute("class", "lockeditemslot");
        img.setAttribute("id", "item" + i);
        img.src = getItemIcon(-2);
        itemArea.append(img);
        preventDragging(i);
    }
}

function invLockIcon() {
    var img = document.createElement('img');
    img.setAttribute("id", "lockimg");
    img.src = getItemIcon(-3);
    var invSpaceLeft = MAXINVSPACE - currPlayer.inventorySize
    var rowsLeft = Math.floor(invSpaceLeft / 4)
    if (invSpaceLeft >= 4) {
        var x = (4 * INVBOXSIDE) / 2 - INVBOXSIDE / 2
    } else {
        var x = INVWIDTH / 2 + (INVWIDTH - invSpaceLeft * INVBOXSIDE) / 2 - INVBOXSIDE / 2
    }
    if (rowsLeft >= 1) {
        var y = 600 / 2 + (600 - (INVBOXSIDE * rowsLeft)) / 2 - INVBOXSIDE / 2
    } else {
        var y = 600 - BOXSIDE
    }
    img.style.marginLeft = x + 'px';
    img.style.marginTop = y + 'px';
    itemArea.append(img);
    $("lockimg").on('dragstart', function (event) {
        event.preventDefault();
    });
    if (currPlayer.inventorySize >= 60) {
        img.style.visibility = 'hidden';
    }
}

function updateInvLockIcon() {
    var img = document.getElementById("lockimg");
    if (currPlayer.inventorySize >= 60) {
        img.style.visibility = 'hidden';
        return
    } else {
        img.style.visibility = 'visible';
    }
    var invSpaceLeft = MAXINVSPACE - currPlayer.inventorySize
    var rowsLeft = Math.floor(invSpaceLeft / 4)
    if (invSpaceLeft >= 4) {
        var x = (4 * INVBOXSIDE) / 2 - INVBOXSIDE / 2
    } else {
        var x = INVWIDTH / 2 + (INVWIDTH - invSpaceLeft * INVBOXSIDE) / 2 - INVBOXSIDE / 2
    }
    if (rowsLeft >= 1) {
        var y = 600 / 2 + (600 - (INVBOXSIDE * rowsLeft)) / 2 - INVBOXSIDE / 2
    } else {
        var y = 600 - BOXSIDE
    }
    img.style.marginLeft = x + 'px';
    img.style.marginTop = y + 'px';
}


function getItemIcon(id) {
    var item = itemJson.find(o => o.id == id);
    if (item) {
        return item.icon;
    } else {
        return null;
    }
}

function makeDraggable(i) {
    $("#item" + i).draggable({
        opacity: 0.8,
        revert: true,
        revertDuration: 0,
    });
}

function makeDroppable(i) {
    $("#item" + i).droppable({
        disabled: false,
        drop: function (event, ui) {
            console.log(currPlayer.inventory)

            //Make item temp invisible
            var draggedItemId = ui.draggable.attr('id');
            document.getElementById(draggedItemId).src = getItemIcon(-1);
            var pos1 = parseInt(draggedItemId.slice(4)) - 1
            var pos2 = parseInt($(this).attr('id').slice(4)) - 1
            emitItemSwap(pos1, pos2);
            if (currentSelectedSlot == pos1) {
                selectInvItem(pos2);
            } else if (currentSelectedSlot == pos2) {
                selectInvItem(pos1);
            }

        }
    });
}

function preventDragging(i) {
    $("#item" + i).on('dragstart', function (event) {
        event.preventDefault();
    });
}
function enableDragging(i) {
    $("#item" + i).off('dragstart');
}

function getItemObj(id) {
    var item = itemJson.find(o => o.id == id);
    return item;
}

function selectInvItem(slot) {
    console.log("ION")

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
    animateBuildingArea();
    currentSelectedSlot = slot;
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

        // Restore the effected overlay canvas
        ovlycxt.clearRect(BOXSIDE * (HORIZONTALRADIUS - 1), BOXSIDE * (VERTICALRADIUS - 1), BOXSIDE * 3, BOXSIDE * 3);
        for (var i = HORIZONTALRADIUS - 1; i <= HORIZONTALRADIUS + 1; i++) {
            for (var j = VERTICALRADIUS - 1; j <= VERTICALRADIUS + 1; j++) {
                ovlycxt.strokeRect(BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
            }
        }
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

function animateBuildingArea() {
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

        ovlycxt.globalAlpha = alpha;
        ovlycxt.fillStyle = "red";
        ovlycxt.clearRect(BOXSIDE * (HORIZONTALRADIUS - 1), BOXSIDE * (VERTICALRADIUS - 1), BOXSIDE * 3, BOXSIDE * 3);
        ovlycxt.fillRect(BOXSIDE * (HORIZONTALRADIUS - 1), BOXSIDE * (VERTICALRADIUS - 1), BOXSIDE * 3, BOXSIDE * 3);
        ovlycxt.globalAlpha = 1;
        ovlycxt.clearRect(BOXSIDE * (HORIZONTALRADIUS), BOXSIDE * (VERTICALRADIUS), BOXSIDE, BOXSIDE);
        for (var i = HORIZONTALRADIUS - 1; i <= HORIZONTALRADIUS + 1; i++) {
            for (var j = VERTICALRADIUS - 1; j <= VERTICALRADIUS + 1; j++) {
                ovlycxt.strokeRect(BOXSIDE * i, BOXSIDE * j, BOXSIDE, BOXSIDE);
            }
        }

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