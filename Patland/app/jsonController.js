var fs = require('fs');

var structureJson, itemJson;

module.exports = function JsonController() {
    if (!structureJson) {
        structureJson = getStructureJson();
        itemJson = getItemJson();
    }
    return module.exports;
};

module.exports.isStructurePassable = function(structId) {
    return structureJson.find(o => o.id == structId).passable;
}

module.exports.getStructureAction = function (structId, actionId) {
    return structureJson.find(o => o.id == structId).action[actionId];
}

function getStructureJson() {
    let structureJson = JSON.parse(fs.readFileSync('./app/json/structureServer.json'))
    return structureJson;
}

function getItemJson() {
    let itemJson = JSON.parse(fs.readFileSync('./app/json/itemServer.json'))
    return itemJson;
}