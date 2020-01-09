
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