// The map relative to the player
var locationMap = [...Array(NUMCOL)].map(e => Array(NUMROW));
var structureJson = []; var groundJson = [];



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
    // If obj is void or if obj not exist in groundTile.json
    if (groundJson.find(o => o.id == -1)) {
        return getGroundObj(-1); // Void
    } else {
        throw "groundTile.json is invalid";
    }
};

/**
 * 
 * @param {*} ground 2d array of ground ids
 * @param {*} structure 2d array of structure objectInfo's (id, health, owner)
 * @param {*} playersObj dict of players
 * @param {*} currPlayer the current player
 */
function loadLocationMap(ground2D, structure2D, playersObj, currPlayer) {
    var trueRange = getTrueRange(currPlayer);
    for (var i = 0; i < NUMCOL; i++) {
        for (var j = 0; j < NUMROW; j++) {
            locationMap[i][j] = {
                ground: getGroundObj(ground2D[i][j]),
                structure: getStructureObj(structure2D[i][j]),
                players: [],
            };
        }
    }
    // Adds all the players into the location map
    for (player in playersObj) {
        var p = playersObj[player];
        // Places the other players relative to the current player
        addOtherPlayerToLocationMap(trueRange, p);
    }
}

// TODO: Change to (othP, movement)
function movePlayer(othP, movement, currPlayer) {
    var relCoords = getRelativeCoords(othP, currPlayer)
    removePlayerFromMap(othP, relCoords);
    var newRelCoords = getNewCoordsLocation(relCoords, movement);
    locationMap[newRelCoords.i][newRelCoords.j].players.push(othP);
}

function removePlayerFromMap(othP, relCoords) {
    var playerList = locationMap[relCoords.i][relCoords.j].players;
    var pIndex = playerList.findIndex(o => o.id == othP.id);
    if (pIndex >= 0) {
        playerList.splice(pIndex, 1);
    }
}

// Gets the left and top edge of the viewable coordinates
function getTrueRange(player) {
    var trueLeftI; var trueTopJ;
    trueLeftI = player.i - HORIZONTALRADIUS
    trueTopJ = player.j - VERTICALRADIUS
    return { truelefti: trueLeftI, truetopj: trueTopJ };
}

/**
 * 
 * @param {*} trueRange trueRange object with truelefti and truetopj
 * @param {*} player the other player
 */
function addOtherPlayerToLocationMap(trueRange, player) {
    locationMap[player.i - trueRange.truelefti][player.j - trueRange.truetopj].players.push(player);
}

// Gets the relative coordinates of the other player from the player
function getRelativeCoords(othPlayer, currPlayer) {
    var trueRange = getTrueRange(currPlayer);
    var relI = othPlayer.i - trueRange.truelefti;
    var relJ = othPlayer.j - trueRange.truetopj;
    return {i: relI, j: relJ};
}