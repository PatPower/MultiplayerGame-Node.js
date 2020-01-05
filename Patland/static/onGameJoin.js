var name = "Pat";

function show_prompt() {
    $.getJSON("/static/tiles/structures.json", function (json) {
        structureJson = json;
    });
    $.getJSON("/static/tiles/groundTiles.json", function (json) {
        groundJson = json;
    });
    
    do {
        name = prompt("Please enter your name (max length 5)");
    }
    while (name.length > 5) {
        $('#myinput').val(name);
    }
}

function loadImages(callback) {
    var imgList = {};
    for (id in structureJson) {
        if (structureJson[id].sprite) {
            imgList[id] = new Image();
            imgList[id].onload = function() {
                callback(imgList);
            }
            imgList[id].src = structureJson[id].sprite;
        }
    }
}


show_prompt();
