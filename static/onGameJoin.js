var name = window.authenticatedUser ? window.authenticatedUser.name : "Anonymous";

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

// No longer need to show prompt since we use authenticated user
loadJson();

