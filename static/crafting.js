craftcanvas = document.getElementById("crafting");
craftingArea = document.getElementById("craftingArea");
var craftingItemIdList = [-1, -1, -1, -1];
var craftingItemPosList = [-1, -1, -1, -1];

function setupCraftingArea() {
    craftcanvas.width = CRAFTINGWIDTH;
    craftcanvas.height = CRAFTINGHEIGHT;
    var cxt = craftcanvas.getContext("2d");
    cxt.fillStyle = "rgb(208, 146, 15)";
    cxt.fillRect(0, 0, CRAFTINGWIDTH, CRAFTINGHEIGHT);

    // Tool Box
    cxt.strokeRect(CRAFTINGWIDTH / 2 - 20.5, 50, INVBOXSIDE, INVBOXSIDE);
    cxt.fillStyle = "black";
    cxt.font = "bold 16px Almendra SC";
    cxt.fillText("Tool", CRAFTINGWIDTH / 2 - 15.5, 45);

    var img = document.createElement("img");
    img.setAttribute("class", "craftitem");
    img.setAttribute("id", "craftItem0");
    img.src = getItemIcon(-1);
    craftingArea.append(img);
    $("#craftItem0").css({
        top: 51,
        left: CRAFTINGWIDTH / 2 - 20.5,
    });
    preventDragging("#craftItem");
    makeCraftItemDroppable("#craftItem0", 0);

    // Crafting boxes
    for (i = 1; i <= 3; i++) {
        cxt.strokeRect(
            10 + (i - 1) * (INVBOXSIDE + 10),
            115,
            INVBOXSIDE,
            INVBOXSIDE
        );
        cxt.fillStyle = "black";
        cxt.font = "bold 16px Almendra SC";
        cxt.fillText("Item " + `${i}`, 10 + (i - 1) * (INVBOXSIDE + 10), 108);
        var img = document.createElement("img");
        img.setAttribute("class", "craftitem");
        img.setAttribute("id", "craftItem" + i);
        img.src = getItemIcon(-1);
        craftingArea.append(img);
        $("#craftItem" + i).css({
            top: 116,
            left: 10 + (i - 1) * (INVBOXSIDE + 10),
        });
        preventDragging("#craftItem" + i);
        makeCraftItemDroppable("#craftItem" + i, i);
    }
    craftTitle(cxt);
    return cxt;
}

function craftTitle(cxt) {
    cxt.fillStyle = "rgb(208, 146, 15)";
    cxt.fillRect(0, 0, INVWIDTH, 20);
    cxt.fillStyle = "black";
    cxt.strokeRect(0, 0, INVWIDTH, 20);
    cxt.fillStyle = "black";
    cxt.font = "bold 16px Almendra SC";
    cxt.fillText("Crafting", INVWIDTH / 2 - 30, 14);
}

/**
 *
 * @param {*} id
 * @param {*} craftItemPos  0: tool , 1: item 1, 2: item 2, 3: item 3
 */
function makeCraftItemDroppable(id, craftItemPos) {
    $(id).droppable({
        disabled: false,
        drop: function (event, ui) {
            // The item being used
            var draggedItemId = ui.draggable.attr("id");

            // Show the item is being used for crafting

            // Gets the position of the inv item being used
            var itemPos = parseInt(draggedItemId.slice(4));
            console.log(itemPos);

            var invX = (itemPos - 1) % 4;
            var invY = Math.floor((itemPos - 1) / 4);

            // Adds black tint over item being used
            var img = document.createElement("img");
            img.setAttribute("class", "itemOverlay");
            img.setAttribute("id", "itemOverlay" + craftItemPos);
            img.src = getItemIcon(-2);
            itemArea.append(img);

            $("#itemOverlay" + craftItemPos).css({
                top: invY * INVBOXSIDE,
                left: invX * INVBOXSIDE,
            });

            // Disable dragging/dropping for the used item
            preventDragging("#item" + draggedItemId.slice(4));
            $("#item" + draggedItemId.slice(4)).droppable("disable");

            // Disable dragging/dropping for overlay
            preventDragging("#itemOverlay" + craftItemPos);

            // Set the src to of the crafting box to the dragged from item
            $(this).attr("src", ui.draggable.attr("src"));

            craftingItemIdList[craftItemPos] =
                currPlayer.inventory[itemPos - 1].id;
            craftingItemPosList[craftItemPos] = itemPos;
        },
    });
}

// Removes item from crafting area and puts it back in the inventory
function RemoveCraftingItem(itemPos) {
    $("#itemOverlay" + itemPos).remove();
    $("#craftItem" + itemPos).attr("src", getItemIcon(-1));
    // Re-enable dragging/dropping for the used item
    enableDragging("#item" + craftingItemPosList[itemPos]);
    makeDroppable("#item" + craftingItemPosList[itemPos]);
}
