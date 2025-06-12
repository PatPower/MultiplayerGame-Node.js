var world;
var JsonController = require('./jsonController.js');

function Action(worldArg) {
    world = worldArg;
}

/**
 * playerId: id of player
 * structId: id of structure
 * actionId: a1, a2 or a3 depending if action 1, action 2 or action 3
 * location: {i: int, j: int} of the interacted structure
 */
Action.prototype.doAction = async function (playerId, structId, actionId, location) {
    console.log("🛠️ STRUCTURE ACTION DEBUG:");
    console.log("  Player ID:", playerId);
    console.log("  Structure ID:", structId);
    console.log("  Action ID:", actionId);
    console.log("  Location:", location);

    if (world.verifyStructureLocation(location, structId)) {
        var player = world.getPlayer(playerId);
        if (player) {
            if (world.checkIfInteractible(player, location)) {
                console.log("📦 Player inventory before action:");
                for (let i = 0; i < player.inventory.length; i++) {
                    const item = player.inventory[i];
                    if (item) {
                        console.log(`  Slot ${i}: ID ${item.id} (${JsonController.getItemName(item.id)})`);
                    } else {
                        console.log(`  Slot ${i}: Empty`);
                    }
                }

                var structureAction = JsonController.getStructureAction(structId, actionId);
                console.log("🎯 Structure action:", structureAction);
                // Check if this is a mining action that requires a pickaxe to be selected
                if (structureAction.name === "Mine") {
                    // Check if player has a pickaxe selected
                    if (player.selectedItemId !== 0) {
                        return { result: false, msg: "You need to select a pickaxe to mine!" };
                    }
                    console.log("✅ Player has pickaxe selected, mining allowed");
                }

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
                    //return { result: false, reason: "Level required: " + "{skill level}" };
                }
                for (pFlag of structureAction.cond.pFlag) {
                    // TODO: Check if flag is enabled
                    //return { result: false, reason: "You can't do this yet" };
                }

                var inventoryChanges = [];

                // Check if there is enough space in inventory for items
                var freeInvSpace = player.inventory.filter(o => o == null).length
                console.log("📊 Free inventory space:", freeInvSpace);
                console.log("📊 Items to drop:", structureAction.result.drop.length);

                if (structureAction.result.drop.length > freeInvSpace) {
                    return { result: false, msg: "Not enough inventory space!" };
                }

                // EVENT:
                if (structureAction.result.destroy) {
                    console.log("💥 Destroying structure at:", location);
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

                console.log("🎁 Processing item drops:");
                for (item of structureAction.result.drop) {
                    console.log("  Dropping item:", item);
                    var slot = await world.addPlayerItem(player, item);
                    if (slot == -1) {
                        console.log("Error: ", player.id, " inventory overflowed")
                    } else {
                        console.log("  Added to slot:", slot);
                    }
                    inventoryChanges.push({ item: item, pos: slot })
                }

                if (structureAction.result.addToInvSize) {
                    await world.changeInvSize(player, structureAction.result.addToInvSize)
                }

                console.log("📦 Player inventory after action:");
                for (let i = 0; i < player.inventory.length; i++) {
                    const item = player.inventory[i];
                    if (item) {
                        console.log(`  Slot ${i}: ID ${item.id} (${JsonController.getItemName(item.id)})`);
                    } else {
                        console.log(`  Slot ${i}: Empty`);
                    }
                }

                console.log("📡 Sending inventory changes:", inventoryChanges);
                // Updates the player's inventory
                world.playerInventoryUpdate(player, inventoryChanges)
            }
        }
    }
    return { result: true, msg: "" };
}


/**
 * playerId: id of player
 * structId: id of structure
 * actionId: a1, a2 or a3 depending if action 1, action 2 or action 3
 * invSlot: the slot of the used item
 */
Action.prototype.doInvAction = async function (playerId, itemId, actionId, invSlot) {
    console.log("Inv Action ", playerId, itemId, actionId, invSlot)
    var player = world.getPlayer(playerId);
    console.log(player.inventory)

    if (player) {
        // Make sure player has the item at the slot specified
        if (world.verifyPlayerItem(player, itemId, invSlot)) {
            var itemAction = JsonController.getItemAction(itemId, actionId);
            var inventoryChanges = [];
            // Check if action is "DefaultDrop"
            if (itemAction.name == "DefaultDrop") {
                await world.removePlayerItem(player, invSlot);
                inventoryChanges.push({ item: null, pos: invSlot })
            } else if (itemAction.name == "Select") {
                console.log(itemId, " selected!");
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
                    await world.removePlayerItem(player, invSlot);
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
                    if (itemInfo) {
                        await world.removePlayerItem(player, itemInfo.slot);
                        inventoryChanges.push({ item: null, pos: itemInfo.slot })
                    }
                }
                for (item of itemAction.result.drop) {
                    var slot = await world.addPlayerItem(player, item);
                    if (slot == -1) {
                        console.log("CRITICAL ERROR!!!: ", player.id, " inventory overflowed")
                    }
                    console.log(item)
                    inventoryChanges.push({ item: item, pos: slot })
                }
                if (itemAction.result.addToInvSize) {
                    await world.changeInvSize(player, itemAction.result.addToInvSize)
                }
            }
            if (inventoryChanges.length > 0) {
                // Updates the player's inventory
                world.playerInventoryUpdate(player, inventoryChanges)
            }
        }
    }
    return { result: true, msg: "" };
}

/**
 * playerId: id of player
 * structId: id of structure
 * actionId: a1, a2 or a3 depending if action 1, action 2 or action 3
 * invSlot: the slot of the used item
 * buildLoc: {i: int, j: int} the location where the structure is being placed
 */
Action.prototype.build = function (playerId, itemId, actionId, invSlot, buildLoc) {
    console.log("🔨 BUILD ACTION DEBUG:");
    console.log("  Player ID:", playerId);
    console.log("  Item ID:", itemId);
    console.log("  Action ID:", actionId);
    console.log("  Inventory Slot:", invSlot);
    console.log("  Build Location:", buildLoc);

    var player = world.getPlayer(playerId);
    if (!player) {
        return { result: false, msg: "Player not found" };
    }

    console.log("📦 Player inventory before build:");
    for (let i = 0; i < player.inventory.length; i++) {
        const item = player.inventory[i];
        if (item) {
            console.log(`  Slot ${i}: ID ${item.id} (${JsonController.getItemName(item.id)})`);
        } else {
            console.log(`  Slot ${i}: Empty`);
        }
    }

    // Make sure player has the item at the slot specified
    var itemVerification = world.verifyPlayerItem(player, itemId, invSlot);
    if (!itemVerification) {
        console.log("❌ Item verification failed!");
        return { result: false, msg: "Item not found in specified slot" };
    }

    console.log("✅ Item verification passed:");
    console.log("  Found item:", itemVerification);

    // Check if the structure being placed is around the player
    if (!world.checkIfInteractible(player, buildLoc)) {
        return { result: false, msg: "Too far to build here" };
    }

    // Also check if the build location is not on top of the player
    if (player.i == buildLoc.i && player.j == buildLoc.j) {
        return { result: false, msg: "Cannot build on yourself" };
    }

    // Determines if the location has no solid structures or players
    if (!checkLocationBuildable(buildLoc)) {
        return { result: false, msg: "Not buildable here" };
    }

    var itemAction = JsonController.getItemAction(itemId, actionId);
    if (!itemAction) {
        return { result: false, msg: "Invalid action for this item" };
    }

    var structId = itemAction.structId;
    if (!structId && structId !== 0) {
        return { result: false, msg: "Item not placeable (no structure ID)" };
    }

    var structHealth = JsonController.getStructureHealth(structId);

    try {
        // Place the structure first
        world.placeStructure(buildLoc, structId, structHealth, player.id);
        console.log("🏗️ Structure placed successfully");

        // Remove the item from inventory and send update to client
        console.log("🗑️ Removing item from slot:", invSlot);
        world.removePlayerItem(player, invSlot, false); // Don't auto-update
        var inventoryChanges = [{ item: null, pos: invSlot }];

        console.log("📦 Player inventory after removal:");
        for (let i = 0; i < player.inventory.length; i++) {
            const item = player.inventory[i];
            if (item) {
                console.log(`  Slot ${i}: ID ${item.id} (${JsonController.getItemName(item.id)})`);
            } else {
                console.log(`  Slot ${i}: Empty`);
            }
        }

        console.log("📡 Sending inventory update:", inventoryChanges);
        world.playerInventoryUpdate(player, inventoryChanges);

        return { result: true, msg: "Structure placed successfully" };
    } catch (error) {
        console.error("Error placing structure:", error);
        return { result: false, msg: "Failed to place structure" };
    }
}

function checkLocationBuildable(buildLoc) {
    // If there is no structure there already
    if (!world.getStructureAtLocation(buildLoc)) {
        // If there is no player at that current location.	
        if (world.getPlayersAtLocation(buildLoc).length == 0) {
            return true;
        }
    }
    return false;
}

module.exports = Action;