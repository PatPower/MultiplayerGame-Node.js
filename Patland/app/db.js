function DB() {
    var data = getDataFromDB();
    this.worldStructureMap = data.worldStructureMap;
    this.worldGroundMap = data.worldGroundMap;
    this.worldPlayerMap = data.worldPlayerMap;
}

DB.prototype.getStructureMap() = function() {
    return this.worldStructureMap;
}

DB.prototype.getGroundMap() = function() {
    return this.worldGroundMap;
}

DB.prototype.getPlayerMap() = function() {
    return this.worldPlayerMap;
}

function getDataFromDB() {
    return {worldStructureMap: [], worldGroundMap: [], worldPlayerMap: []}
}

module.exports = DB;