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
                    var itemInfo = world.verifyPlayerItem(player, itemCond.id);
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

                var inventoryChanges = [];

                // Check if there is enough space in inventory for items
                var freeInvSpace = player.inventory.filter(o => o == null).length
                if (structureAction.result.drop.length > freeInvSpace) {
                    return { result: false, msg: "Not enough inventory space!" };
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
                // REMINDER TO MAKE SURE THIS ITEM IS ALSO CHECKED IN THE CONDITIONS
                for (itemId of structureAction.result.removeItem) {
                    var itemInfo = world.verifyPlayerItem(player, itemId);
                    world.removePlayerItem(player, itemInfo.slot);
                    inventoryChanges.push({ item: null, pos: itemInfo.slot })
                }
                for (item of structureAction.result.drop) {
                    var slot = world.addPlayerItem(player, item);
                    if (slot == -1) {
                        console.log("Error: ", player.id, " inventory overflowed")
                    }
                    console.log(slot)
                    inventoryChanges.push({ item: item, pos: slot })
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
                world.removePlayerItem(player, invSlot);
                inventoryChanges.push({ item: null, pos: invSlot })
            } else if (itemAction.name == "Select") {
                console.log(itemId, " selected!")
            } else {
                // CONDITIONS:
                for (itemCond of itemAction.cond.item) {
                    var itemInfo = world.verifyPlayerItem(player, itemCond.id);
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
                // Check if there is enough space in inventory for items
                var freeInvSpace = player.inventory.filter(o => o == null).length
                var freedUpSpace = itemAction.result.removeItem.length;
                // If used item is being destroyed, then make one free space
                freedUpSpace += itemAction.result.destroy ? 1 : 0;
                console.log("FREE", itemAction.result.drop.length, freeInvSpace + freedUpSpace)
                if (itemAction.result.drop.length > freeInvSpace + freedUpSpace) {
                    return { result: false, msg: "Not enough inventory space!" };
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
                // REMINDER TO MAKE SURE THIS ITEM IS ALSO CHECKED IN THE CONDITIONS
                for (itemId of itemAction.result.removeItem) {
                    var itemInfo = world.verifyPlayerItem(player, itemId);
                    world.removePlayerItem(player, itemInfo.slot);
                    inventoryChanges.push({ item: null, pos: itemInfo.slot })
                }
                for (item of itemAction.result.drop) {
                    var slot = world.addPlayerItem(player, item);
                    if (slot == -1) {
                        console.log("Error: ", player.id, " inventory overflowed")
                    }
                    console.log(slot)
                    inventoryChanges.push({ item: item, pos: slot })
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


/**
 * id: id of item
 * actionId: a1, a2 or a3 depending if action 1, action 2 or action 3
 * location: {i: int, j: int} of the interacted structure
 */
Action.prototype.build = function (playerId, itemId, actionId, invSlot, buildLoc) {
    console.log("Build Action ", playerId, itemId, actionId, invSlot, buildLoc);
    var player = world.getPlayer(playerId);
    if (player) {
        // Make sure player has the item at the slot specified
        if (world.verifyPlayerItem(player, itemId, invSlot)) {
        }
    }
}

module.exports = Action;