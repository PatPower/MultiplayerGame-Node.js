var name = "Pat";

function show_prompt() {
    do {
        name = prompt("Please enter your name (max length 5)");
    }
    while (name.length > 5) {
        $('#myinput').val(name);
    }
}

function loadJson() {
    $.getJSON("/static/json/structures.json", function (json) {
        structureJson = json;
    });
    $.getJSON("/static/json/groundTiles.json", function (json) {
        groundJson = json;
    });
    $.getJSON("/static/json/items.json", function (json) {
        itemJson = json;
    });
}

function loadImages(callback) {
    var imgList = {};
    for (id in structureJson) {
        if (structureJson[id].sprite) {
            imgList[id] = new Image();
            imgList[id].onload = function () {
                callback(imgList);
            }
            imgList[id].src = structureJson[id].sprite;
        }
    }
}


show_prompt();
loadJson();

