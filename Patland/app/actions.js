var world;

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
            console.log(location)
            if (world.checkIfInteractible(player, location)) {
                var structureAction = world.structureJson.find(o => o.id == structId).action[actionId];

                // CONDITIONS:
                for (itemCond of structureAction.cond.item) {
                    // TODO: Check player inventory for item
                    if (false) {
                        return { result: false, reason: "Missing Item: " + "{item name here}" };
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

            }
        }
    }
}

module.exports = Action;