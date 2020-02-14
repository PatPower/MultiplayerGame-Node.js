craftElement = document.getElementById("crafting")
craftctx = setupCraft(craftElement);


function setupCraft(canvas) {
    canvas.width = CRAFTINGWIDTH;
    canvas.height = CRAFTINGHEIGHT;
    var cxt = canvas.getContext('2d');
    cxt.fillStyle = "rgb(208, 146, 15)";
    cxt.fillRect(0, 0, CRAFTINGWIDTH, CRAFTINGHEIGHT);

    // Tool Box
    cxt.strokeRect(CRAFTINGWIDTH / 2 - 20.5, 50, INVBOXSIDE, INVBOXSIDE);
    cxt.fillStyle = "black";
    cxt.font = "bold 16px Almendra SC";
    cxt.fillText("Tool", CRAFTINGWIDTH / 2 - 15.5, 45);

    // Crafting boxes
    for (i = 0; i < 3; i++) {
        cxt.strokeRect(10 + i * (INVBOXSIDE + 10), 115, INVBOXSIDE, INVBOXSIDE);
        cxt.fillStyle = "black";
        cxt.font = "bold 16px Almendra SC";
        cxt.fillText("Item " + `${i + 1}`, 10 + i * (INVBOXSIDE + 10), 108);
    }
    craftTitle(cxt);
    return cxt;
}

function craftTitle(cxt) {
    cxt.fillStyle = "rgb(208, 146, 15)";
    cxt.fillRect(0, 0, INVWIDTH, 20);
    cxt.fillStyle = "black";
    cxt.strokeRect(0, 0, INVWIDTH, 20);
    cxt.fillStyle = 'black';
    cxt.font = "bold 16px Almendra SC";
    cxt.fillText("Crafting", INVWIDTH / 2 - 30, 14);
}
