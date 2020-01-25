var world;
var JsonController = require('./jsonController.js');

function Action(worldArg) {
    world = worldArg;
}

/**
 * id: id of structure
 * actionId: a1, a2 or a3 depending if action 1, action 2 or action 3
 * location: {i: int, j: int} of the interacted structure
 */
Action.prototype.doAction = function (playerId, structId, actionId, location) {
    console.log("STRUCT ACTION", playerId, structId, actionId, location)
    if (world.verifyStructureLocation(location, structId)) {
        var player = world.getPlayer(playerId);
        if (player) {
            if (world.checkIfInteractible(player, location)) {
                console.log(structId, actionId)
                var structureAction = JsonController.getStructureAction(structId, actionId);
                // CONDITIONS:
                for (itemCond of structureAction.cond.item) {
                    // TODO: Check player inventory for item
                    var itemInfo = world.verifyPlayerItem(player, itemCond);
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
                var inventoryChanges = [];
                for (item of structureAction.result.drop) {
                    var slot = world.addPlayerItem(player, item);
                    if (slot == -1) {
                        return { result: false, msg: "Inventory is too full!" };
                    }
                    console.log(slot)
                    inventoryChanges.push({ item: item, pos: slot })
                }
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

                if (structureAction.result.addToInvSize) {
                    world.changeInvSize(player, structureAction.result.addToInvSize)
                }
                // Updates the player's inventory
                world.playerInventoryUpdate(player, inventoryChanges)
            }
        }
    }
    return { result: true, msg: "" };
}

/**
 * id: id of item
 * actionId: a1, a2 or a3 depending if action 1, action 2 or action 3
 * location: {i: int, j: int} of the interacted structure
 */
Action.prototype.doInvAction = function (playerId, itemId, actionId, invSlot) {
    console.log("Inv Action ", playerId, itemId, actionId, invSlot)
    var player = world.getPlayer(playerId);
    if (player) {
        // Make sure player has the item at the slot specified
        if (world.verifyPlayerItem(player, itemId, invSlot)) {
            var itemAction = JsonController.getItemAction(itemId, actionId);
            var inventoryChanges = [];
            // Check if action is "DefaultDrop"
            if (itemAction.name == "DefaultDrop") {
                console.log("in dd")
                world.removePlayerItem(player, invSlot);
                inventoryChanges.push({ item: null, pos: invSlot })
            } else {
                console.log("not infaefa")
                // CONDITIONS:
                for (itemCond of itemAction.cond.item) {
                    var itemInfo = world.verifyPlayerItem(player, itemCond);
                    // If player has the item and if the durability is higher than the required durability
                    if (!itemInfo) {
                        return { result: false, msg: "Missing Item: " + JsonController.getItemName(itemCond.id) };
                    }
                    if (itemInfo.durability < itemCond.reqDurability) {
                        return { result: false, msg: "Not enough durability on: " + JsonController.getItemName(itemCond.id) };
                    }
                }
                for (skillCond in itemAction.cond.skill) {
                    // TODO: Check if player skill meets condition
                    if (false) {
                        return { result: false, reason: "Level required: " + "{skill level}" };
                    }
                }
                for (pFlag of itemAction.cond.pFlag) {
                    // TODO: Check if flag is enabled
                    if (false) {
                        return { result: false, reason: "You can't do this yet" };
                    }
                }
                // EVENT:
                if (itemAction.result.destroy) {
                    world.removePlayerItem(player, invSlot);
                    inventoryChanges.push({ item: null, pos: invSlot })
                }
                for (item of itemAction.result.degradeItems) {
                    // TODO: Degrade items
                }
                for (pFlag of itemAction.result.updatePFlag) {
                    // TODO: Update pflag
                }
                for (expGain of itemAction.result.expGain) {
                    // TODO: Gain exp
                }
                for (item of itemAction.result.drop) {
                    // TODO: Give user items
                    //inventoryChanges.push({ item: { id: item durability: 50}, pos: invSlot })
                }
                if (itemAction.result.addToInvSize) {
                    world.changeInvSize(player, itemAction.result.addToInvSize)
                }
            }
            // Updates the player's inventory
            world.playerInventoryUpdate(player, inventoryChanges)
        }
    }
    return { result: true, msg: "" };
}


module.exports = Action;