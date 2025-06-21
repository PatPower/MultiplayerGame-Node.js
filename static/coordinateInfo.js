var tileMarker = document.getElementById("tileMarker");

function updateTileMarker(player) {
    tileMarker.width = TILEMARKERWIDTH;
    tileMarker.height = TILEMARKERHEIGHT;
    var tmcxt = tileMarker.getContext('2d');
    for (var i = 0; i < NUMCOL; i++) {
        var adjust = 8;
        if (i == HORIZONTALRADIUS) {
            tmcxt.font = "bold 15px Arial";
        } else {
            tmcxt.font = "11px Arial";
        }
        if (player.i < 10) {
            adjust = 4;
        }
        tmcxt.fillText(player.i - HORIZONTALRADIUS + i, (BOXSIDE * i) + OUTERMARGINSIDE + BOXSIDE / 2 - adjust, OUTERMARGINTOP - 5);
    }
    for (var j = 0; j < NUMROW; j++) {
        if (j == VERTICALRADIUS) {
            tmcxt.font = "bold 15px Arial";
        } else {
            tmcxt.font = "11px Arial";
        }
        tmcxt.fillText(player.j - VERTICALRADIUS + j, 0, (BOXSIDE * j) + OUTERMARGINTOP + BOXSIDE / 2 + 10);
    }
    tmcxt.font = "12px Arial";
}



