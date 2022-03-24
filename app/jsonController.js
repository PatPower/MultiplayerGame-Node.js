var fs = require('fs');
var path = require('path');

var structureJson, itemJson;

module.exports = function JsonController() {
    if (!structureJson) {
        structureJson = getStructureJson();
        itemJson = getItemJson();
        generateClientJson();
    }
    return module.exports;
};

module.exports.getStructureJson = function () {
    if (!structureJson) {
        throw new Error("Error: Can't this function until properly initalized");
    }
    return structureJson;
}

module.exports.getItemJson = function () {
    if (!structureJson) {
        throw new Error("Error: Can't this function until properly initalized");
    }
    return itemJson;
}

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
    return structureJson.find(o => o.id == structId).actions[actionId];
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
    return itemJson.find(o => o.id == itemId).actions[actionId];
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

function generateClientJson() {
    var jsonPath = path.normalize(__dirname + '/../static/json/');
    var clientStructureJson = [], clientItemJson = [];
    // Structure Json
    for (index in structureJson) {
        var clientStructObj = {};
        clientStructObj["id"] = structureJson[index]["id"];
        clientStructObj["name"] = structureJson[index]["name"];
        clientStructObj["armor"] = structureJson[index]["armor"];
        clientStructObj["health"] = structureJson[index]["health"];
        clientStructObj["owner"] = "game"
        clientStructObj["sprite"] = structureJson[index]["sprite"];
        var clientActionObj = {};
        for (actionId in structureJson[index]["actions"]) {
            //console.log(structureJson[index]["actions"][actionId]["name"])
            // Sets the value of the client acion id to the name of the action
            // eg. {"a1": "Mine", "a2": "Inspect"}
            clientActionObj[actionId] = structureJson[index]["actions"][actionId]["name"];
        }
        

        clientStructObj["actions"] = clientActionObj;
        clientStructureJson.push(clientStructObj)
    }

    // Item Json
    for (index in itemJson) {
        var clientItemObj = {};
        clientItemObj["id"] = itemJson[index]["id"];
        clientItemObj["name"] = itemJson[index]["name"];
        clientItemObj["icon"] = itemJson[index]["icon"];
        clientItemObj["placeableStructId"] = itemJson[index]["placeableStructId"];
        
        var clientItemActionObj = {};
        for (actionId in itemJson[index]["actions"]) {
            //console.log(structureJson[index]["actions"][actionId]["name"])
            // Sets the value of the client acion id to the name of the action
            // eg. {"a1": "Mine", "a2": "Inspect"}
            if (itemJson[index]["actions"][actionId]["name"] == "DefaultDrop") {
                clientItemActionObj[actionId] = "Drop";
            } else {
                clientItemActionObj[actionId] = itemJson[index]["actions"][actionId]["name"];
            }
        }
        

        clientItemObj["actions"] = clientItemActionObj;
        clientItemJson.push(clientItemObj)
    }


    var newStructureJson = JSON.stringify(clientStructureJson)
    fs.writeFile(jsonPath + "structures.json", newStructureJson,function(err, result) {
        if(err) console.log('error', err);
    });

    var newItemJson = JSON.stringify(clientItemJson)
    fs.writeFile(jsonPath + "items.json", newItemJson,function(err, result) {
        if(err) console.log('error', err);
    });
}