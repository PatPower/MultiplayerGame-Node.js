var mousePos = { x: 0, y: 0, i: 0, j: 0 };
var lastI = -1, lastJ = -1;
var windowLoaded = false;

$(window).on('load', function () {
    windowLoaded = true;
});

// The object being sent to server to move the character
var movement = {
    up: false,
    down: false,
    left: false,
    right: false
}

var firstKeyHold = true;
document.addEventListener('keydown', function (e) {
    if (e.keyCode == 87) { movement.up = true; } //W 
    if (e.keyCode == 68) { movement.right = true; } //D
    if (e.keyCode == 83) { movement.down = true; } //S
    if (e.keyCode == 65) { movement.left = true; } //A
});

document.addEventListener('keyup', function (e) {
    if (e.keyCode == 87) { movement.up = false; } //W 
    if (e.keyCode == 68) { movement.right = false; } //D
    if (e.keyCode == 83) { movement.down = false; } //S
    if (e.keyCode == 65) { movement.left = false; } //A
    if (e.keyCode == 27) { // Escape
        deselectInvItem();
    }
    if (e.keyCode == 69) { //E
        // If out of bounds
        if (mousePos.i < 0 || NUMCOL <= mousePos.i || mousePos.j < 0 || NUMROW <= mousePos.j) {
            return;
        }
        var structId = locationMap[mousePos.i][mousePos.j].structure.id
        if (structId && checkIfInteractible({ i: mousePos.i, j: mousePos.j })) {
            defaultAction(structId, getGlobalCoords({ i: mousePos.i, j: mousePos.j }));
            // Shows interaction effect
            $("#click").stop().show(function () {
                $(this).css({
                    opacity: 1,
                    width: 8,
                    height: 8,
                })
            }).css({ position: "absolute", top: mousePos.y - 4, left: mousePos.x - 4 }).animate({
                opacity: 1,
                width: 24,
                height: 24,
                top: mousePos.y - 12,
                left: mousePos.x - 12
            }, 300, function () {
                $(this).css({
                    opacity: 0,
                    width: 0,
                    height: 0,
                })
            });
        }
    }
    timeoutCounter = 0;
    firstKeyHold = true
});

$(document).click(function (event) {
    if (currentSelectedSlot != -1) {
        if (checkIfInteractible({ i: mousePos.i, j: mousePos.j })) {
            if (currentSelectedActionId == -1) {
                console.log("Error: Undefined action ID (controls)")
                return
            }
            emitBuild(getSelectedItemId(), currentSelectedActionId, currentSelectedSlot, getGlobalCoords({ i: mousePos.i, j: mousePos.j }))
        } else {
            // If left clicked outside of buildable region and on map
            if (mousePos.i >= 0 && NUMCOL > mousePos.i && mousePos.j >= 0 && NUMROW > mousePos.j) {
                deselectInvItem();
            }
        }
    }
    var x = mousePos.x - $('#itemArea').offset().left;
    var y = mousePos.y - $('#itemArea').offset().top;
    var i = Math.floor(x / BOXSIDE);
    var j = Math.floor(y / BOXSIDE);
    if (i >= 0 && i < INVNUMCOL && j >= 0 && j < NUMROW && $(event.target).attr("id")) {
        var slot = parseInt($(event.target).attr("id").slice(4)) - 1;
        var actionId = getActionId(slot);
        if (actionId) {
            if (currentSelectedSlot == -1 || slot != currentSelectedSlot) {
                selectInvItem(slot);
                currentSelectedActionId = actionId;
            } else {
                deselectInvItem();
                currentSelectedActionId = -1;
            }
        }
    }
});

document.addEventListener('mouseup', function (e) {
    if (typeof e === 'object') {
        // Left click && currently selected a buildable item
        if (e.button == 0) {

        }
    }
});

$("#click").hide();

// Keeps track of the mouse position at all times
$(document).mousemove(function (e) {
    // If the mousemove have valid coordinates
    if (e.pageX && e.pageY) {
        mousePos.x = e.pageX;
        mousePos.y = e.pageY;
    }
    mousePos.i = Math.floor((mousePos.x - $('#overlay').offset().left - 4) / BOXSIDE);
    mousePos.j = Math.floor((mousePos.y - $('#overlay').offset().top - 4) / BOXSIDE);
    // Wait for the screen to finish loading
    if (!windowLoaded) {
        return;
    }
    if (lastI != mousePos.i || lastJ != mousePos.j) {
        // If on map
        if (mousePos.i >= 0 && NUMCOL > mousePos.i && mousePos.j >= 0 && NUMROW > mousePos.j) {
            updateCursorType(mousePos);
        }
        lastI = mousePos.i;
        lastJ = mousePos.j;
    }
    if ($('#tooltip').is(":visible")) {
        $('#tooltip').css({
            left: mousePos.x + 12,
            top: mousePos.y - 30
        });
    }
});

// TimeoutCounter limits how fast the user can move from the client side
// FirstKeyHold makes the first press take a bit longer to move the player to allow easier tap movement 
var timeoutCounter = 0;
setInterval(function () {
    if (timeoutCounter >= 1) { timeoutCounter--; return false; }
    if (movement.up || movement.right || movement.down || movement.left) {
        if (firstKeyHold) { timeoutCounter = 8; firstKeyHold = false } else { timeoutCounter = 3; }
        emitMovement(movement);
    }
}, 40);

function updateCursorType(mousePos) {
    // If out of bounds
    if (mousePos.i < 0 || NUMCOL <= mousePos.i || mousePos.j < 0 || NUMROW <= mousePos.j) {
        return;
    }
    // TODO: have different mouse cursors for different situations
    var structObj = structHasActionAtMousePos(mousePos);
    if (structObj) {
        document.body.style.cursor = 'pointer';
        // If building mode is on, then remove placable struct at cursor
        if (currentSelectedSlot != -1) {
            var selectedBuild = $("#selectedBuild");
            selectedBuild.attr("src", null);
            selectedBuild.css({
                visibility: "hidden"
            });
        }
        if (!menuVisible) {
            $('#tooltip').show();
            $("#tooltiptext").text(getActionName(structObj.id, getDefaultAction(structObj.id)) + " (e)");
        }
    } else {
        if ($('#tooltip').is(":visible")) {
            $('#tooltip').hide();
        }
        // If in building mode and is hovering over a buildable area
        if (currentSelectedSlot != -1 && checkIfInteractible(mousePos)) {
            document.body.style.cursor = 'grabbing';
            var selectedBuild = $("#selectedBuild");
            var structSrc = structureJson[getItemObj(currPlayer.inventory[currentSelectedSlot].id).placeableStructId].sprite;
            // Sets the src to the one selected
            selectedBuild.attr("src", structSrc);
            selectedBuild.css({
                visibility: "visible",
                left: $('#overlay').offset().left + 4 + BOXSIDE * mousePos.i,
                top: $('#overlay').offset().top + 4 + BOXSIDE * mousePos.j,
                opacity: 0.6
            });
        } else {
            document.body.style.cursor = 'default';
            // If the mouse is hovered out of the building area while build mode is on
            if (currentSelectedSlot != -1) {
                var selectedBuild = $("#selectedBuild");
                selectedBuild.attr("src", null);
                selectedBuild.css({
                    visibility: "hidden"
                });
            }
        }
    }
}
