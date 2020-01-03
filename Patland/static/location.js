var locationMap = [...Array(numRow)].map(e => Array(numCol));
var structureJson = []; var groundJson = [];

$.getJSON("/static/tiles/structures.json", function (json) {
    structureJson = json;
    console.log(json);
});
$.getJSON("/static/tiles/groundTiles.json", function (json) {
    groundJson = json;
    console.log(groundJson);
});

function getStructureObj(objInfo) {
    if (objInfo) {
        var obj = structureJson.find(o => o.id == objInfo.id)
        if (obj) {
            obj.health = objInfo.health;
            obj.owner = objInfo.owner;
            return obj;
        } else {
            throw "structure does not exist in structure.json"
        }
    }
    // If obj is air or if obj not exist in structure.json
    if (structureJson.find(o => o.id == 0)) {
        return getStructureObj({ id: 0, health: -1, owner: "game" }); // Air
    } else {
        throw "structure.json is invalid";
    }
}

function getGroundObj(id) {

    if (id || id == 0) {
        var obj = groundJson.find(o => o.id == id)
        if (obj) {
            return obj;
        } else {
            throw `id: ${id} does not exist in groundTile.json`
        }
    }
    // If obj is grass or if obj not exist in groundTile.json
    if (groundJson.find(o => o.id == 0)) {
        return getGroundObj(0); // Grass
    } else {
        throw "groundTile.json is invalid";
    }
};
/**
 * 
 * @param {*} ground 2d array of ground ids
 * @param {*} structure 2d array of structure objectInfo's (id, health, owner)
 * @param {*} playersObj dict of players
 * @param {*} items 2d array of a list of items on the ground
 */
function setupLocationMap(ground2D, structure2D, playersObj, items2D) {
    for (var i = 0; i < numRow; i++) {
        for (var j = 0; j < numCol; j++) {
            locationMap[i][j] = {
                ground: getGroundObj(ground2D[i][j]),
                structure: getStructureObj(structure2D[i][j]),
                players: [],
                items: items2D[i][j] || []
            };
        }
    }
    // Adds all the players into the location map
    for (player in playersObj) {
        var p = playersObj[player];
        locationMap[p.i][p.j].players.push(p);
    }
    console.log("Done")
}

function movePlayer(oldP, newP) {
    var playerList = locationMap[oldP.i][oldP.j].players;
    if (playerList.find(o => o.id == oldP.id)) {
        var pIndex = playerList.findIndex(o => o.id == oldP.id);
        playerList.splice(pIndex, 1);
    }
    locationMap[newP.i][newP.j].players.push(newP);
}
