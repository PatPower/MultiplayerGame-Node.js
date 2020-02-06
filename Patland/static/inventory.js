
var invElement = document.getElementById("inv");
var itemArea = document.getElementById("itemArea");
var invCxt = setupInventory(invElement);
var itemJson = [];
var currentSelectedSlot = -1;

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
    console.log(inventoryChanges)

    for (invChange of inventoryChanges) {
        var i = invChange.pos + 1;
        var img = itemArea.childNodes[i];
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
            if (currentSelectedSlot == pos1) {
                selectInvItem(pos2);
            } else if (currentSelectedSlot == pos2) {
                selectInvItem(pos1);
            }

            emitItemSwap(pos1, pos2);
            //console.log(currPlayer.inventory)
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
    var rect = itemArea.getBoundingClientRect();
    var invX = slot % 4;
    var invY = Math.floor(slot/4);
    console.log("A", rect.x + invX*INVBOXSIDE, rect.y + invY*INVBOXSIDE)
    $("#select").css({
        visibility: "visible", 
        top: rect.y + invY*INVBOXSIDE, 
        left: rect.x + invX*INVBOXSIDE,
    });
    currentSelectedSlot = slot;
}

function deselectInvItem() {
    currentSelectedSlot = -1;
    $("#select").css({
        visibility: "hidden" 
    });
}

function getSelectedItemId() {
    currPlayer.inven
}