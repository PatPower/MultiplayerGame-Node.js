var Settings = require('./settings.js');
var DB = require('./db.js')

function LocationUtil() {}
 
/**
* Gets a 2D list of players in viewing distance of the given player and returns a dict of players
* @param {*} player 
*/
LocationUtil.prototype.getLocal2DPlayerDict = function getLocal2DPlayerDict(player) {
    var localPlayerDict = {};
    var range = getIJRange(player.i, player.j);
    for (var i = range.lefti; i <= range.righti; i++) {
        for (var j = range.topj; j <= range.bottomj; j++) {
            if (worldPlayerMap[i][j].length > 0) {
                for (othplayer of worldPlayerMap[i][j]) {
                    localPlayerDict[othplayer.id] = othplayer;
                }
            }
        }
    }
    return localPlayerDict;
}

module.exports = LocationUtil