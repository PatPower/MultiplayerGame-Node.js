var fs = require('fs');

var structureJson, itemJson;

module.exports = function JsonController() {
    if (!structureJson) {
        structureJson = getStructureJson();
        itemJson = getItemJson();
    }
    return module.exports;
};

module.exports.isStructurePassable = function (structId) {
    if (!structureJson) {
        throw new Error("Error: Can't this function until properly initalized");
    }
    return structureJson.find(o => o.id == structId).passable;
}

module.exports.getStructureAction = function (structId, actionId) {
    if (!structureJson) {
        throw new Error("Error: Can't this function until properly initalized");
    }
    return structureJson.find(o => o.id == structId).action[actionId];
}

module.exports.getStructureHealth = function (structId) {
    if (!structureJson) {
        throw new Error("Error: Can't this function until properly initalized");
    }
    return structureJson.find(o => o.id == structId).health;
}

module.exports.getItemAction = function (itemId, actionId) {
    if (!structureJson) {
        throw new Error("Error: Can't this function until properly initalized");
    }
    return itemJson.find(o => o.id == itemId).action[actionId];
}

module.exports.getItemName = function (itemId) {
    if (!structureJson) {
        throw new Error("Error: Can't this function until properly initalized");
    }
    return itemJson.find(o => o.id == itemId).name
}

function getStructureJson() {
    let structureJson = JSON.parse(fs.readFileSync('./app/json/structureServer.json'))
    return structureJson;
}

function getItemJson() {
    let itemJson = JSON.parse(fs.readFileSync('./app/json/itemServer.json'))
    return itemJson;
}