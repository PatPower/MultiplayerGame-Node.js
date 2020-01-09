
var invElement = document.getElementById("inv");

var invCxt = setupInventory(invElement);

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

$(function () {
    for (var i = 1; i <= 2; i++) {
        $("#item"+i).draggable({
            snap: true,
            opacity: 0.35,
            drop: function( event, ui ) {
                console.log(event, ui)
                console.log( ui.draggable.attr("id"));
            }
        });
    }
});

function dragstart_handler(ev) {
    ev = ev || window.event;
    // Add the target element's id to the data transfer object
    console.log("onDragStart")
    ev.preventDefault();
    document.onmouseup = closeDragElement;
    ev.dataTransfer.setData("text/plain", ev.target.id);
}

function elementDrag(ev) {
    ev = ev || window.event;
    ev.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - ev.clientX;
    pos2 = pos4 - ev.clientY;
    pos3 = ev.clientX;
    pos4 = ev.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
}

function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
}