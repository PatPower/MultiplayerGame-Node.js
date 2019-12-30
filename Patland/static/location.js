var locationMap = [...Array(numRow)].map(e => Array(numCol));


/**
 * 
 * @param {*} ground 2d array of ground ids
 * @param {*} structure 2d array of structure objects
 * @param {*} playersObj dict of players
 * @param {*} items 2d array of a list of items on the ground
 */
function setupLocationMap(ground2D, structure2D, playersObj, items2D) {
    for (var i = 0; i < numRow; i++) {
        for (var j = 0; j < numCol; j++) {
            locationMap[i][j] = {
                ground: ground2D[i][j] || 0,
                structure: structure2D[i][j] || { id: 0, name: "Air", owner: "game" },
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
}

function movePlayer(oldP, newP) {
    var playerList = locationMap[oldP.i][oldP.j].players;
    if (playerList.find(o => o.id == oldP.id)) {
        var pIndex = playerList.findIndex(o => o.id == oldP.id);
        playerList.splice(pIndex, 1);
    }
    locationMap[newP.i][newP.j].players.push(newP);
}
