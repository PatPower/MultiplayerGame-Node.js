var world;
var JsonController = require('./jsonController.js');

function Action(worldArg) {
    world = worldArg;
}

/**
 * id: id of structure
 * actionId: 1, 2 or 3 depending if action 1, action 2 or action 3
 * location: {i: int, j: int} of the interacted structure
 */
Action.prototype.doAction = function (playerId, structId, actionId, location) {
    console.log(playerId, structId, actionId, location)
    if (world.verifyStructureLocation(location, structId)) {
        var player = world.getPlayer(playerId);
        if (player) {
            if (world.checkIfInteractible(player, location)) {
                var structureAction = JsonController.getStructureAction(structId, actionId);
                // CONDITIONS:
                for (itemCond of structureAction.cond.item) {
                    // TODO: Check player inventory for item
                    var itemInfo = player.inventory.find(o => o.id == itemCond.id);
                    // If player has the item and if the durability is higher than the required durability
                    if (!itemInfo) {
                        return { result: false, msg: "Missing Item: " + JsonController.getItemName(itemCond.id) };
                    }
                    if (itemInfo.durability < itemCond.reqDurability) {
                        return { result: false, msg: "Not enough durability on: " + JsonController.getItemName(itemCond.id) };
                    }
                }
                for (skillCond in structureAction.cond.skill) {
                    // TODO: Check if player skill meets condition
                    if (false) {
                        return { result: false, reason: "Level required: " + "{skill level}" };
                    }
                }
                for (pFlag of structureAction.cond.pFlag) {
                    // TODO: Check if flag is enabled
                    if (false) {
                        return { result: false, reason: "You can't do this yet" };
                    }
                }

                // EVENT:
                if (structureAction.result.destroy) {
                    world.removeStructure(location);
                }
                for (item of structureAction.result.degradeItems) {
                    // TODO: Degrade items
                }
                for (pFlag of structureAction.result.updatePFlag) {
                    // TODO: Update pflag
                }
                for (expGain of structureAction.result.expGain) {
                    // TODO: Gain exp
                }
                for (item of structureAction.result.drop) {
                    // TODO: Give user items
                }
            }
        }
    }
    return { result: true, msg: "" };
}



module.exports = Action;