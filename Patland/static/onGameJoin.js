var name = "Pat";

function show_prompt() {
    $.getJSON("/static/tiles/structures.json", function (json) {
        structureJson = json;
        console.log(json);
    });
    $.getJSON("/static/tiles/groundTiles.json", function (json) {
        groundJson = json;
        console.log(groundJson);
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
        console.log("win")
        if (structureJson[id].sprite) {
            console.log("win")
            imgList[id] = new Image();
            imgList[id].onload = function() {
                callback(imgList);
            }
            imgList[id].src = structureJson[id].sprite;
        }
    }
}


show_prompt();
