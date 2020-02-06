var mousePos = { x: 0, y: 0 };

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
    if (event.keyCode == 69) { //E
        var x = mousePos.x - $('#overlay').offset().left - 4;
        var y = mousePos.y - $('#overlay').offset().top - 4;
        var i = Math.floor(x / BOXSIDE);
        var j = Math.floor(y / BOXSIDE);
        // If out of bounds
        if (i < 0 || NUMCOL <= i || j < 0 || NUMROW <= j) {
            return;
        }
        var structId = locationMap[i][j].structure.id
        if (structId && checkIfInteractible({ i: i, j: j })) {
            console.log({ i: i, j: j });
            defaultAction(structId, getGlobalCoords({ i: i, j: j }));
            // Shows interaction effect
            $("#click").stop().show(function () {
                console.log($(this))
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
                console.log($(this))
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

$("#click").hide();

// Keeps track of the mouse position at all times
$(document).bind('mousemove', function (e) {
    mousePos.x = e.pageX;
    mousePos.y = e.pageY;
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
