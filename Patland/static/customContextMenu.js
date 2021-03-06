var currentSelectedActionId = -1;

$(function () {
    // Map
    $.contextMenu({
        selector: '#overlay, #click',
        autoHide: true,
        hideOnSecondTrigger: true,
        position: function (opt, x, y) {
            opt.$menu.css({ top: y, left: x - 30 });
        },
        build: function ($triggerElement, e) {
            var x = mousePos.x - $('#overlay').offset().left - 4;
            var y = mousePos.y - $('#overlay').offset().top - 4;
            return findMenuObj(x, y)
        },
        zIndex: 4
    });

    // Inventory
    $.contextMenu({
        selector: '.item',
        autoHide: true,
        hideOnSecondTrigger: true,
        position: function (opt, x, y) {
            opt.$menu.css({ top: y, left: x - 30 });
        },
        build: function ($triggerElement, e) {
            return findMenuObjInv(parseInt($triggerElement.attr("id").slice(4)) - 1);
        },
        zIndex: 4
    });


});

function findMenuObj(x, y) {
    var i = Math.floor(x / BOXSIDE);
    var j = Math.floor(y / BOXSIDE);
    var locWhenClicked = { i: currPlayer.i, j: currPlayer.j }
    var structIdWhenClicked = locationMap[i][j].structure.id
    var itemsDict = {};
    var menuDict = {};
    var locationObj = locationMap[i][j];
    itemsDict["ground"] = {
        name: `${locationObj.ground.name}`,
        icon: "far fa-list-alt"
    }
    itemsDict["structure"] = {
        name: `${locationObj.structure.name}`,
        icon: "far fa-list-alt"
    }
    for (action in locationObj.structure.actions) {
        itemsDict[action] = {
            name: `Action: ${locationObj.structure.actions[action]}`,
            icon: 'fas fa-hammer',
            // TODO: check if player close enough to interact
            callback: function (key, opt) {
                sendPlayerAction(structIdWhenClicked, key, getGlobalCoords({ i: i, j: j }, locWhenClicked));
            }
        }
    }
    itemsDict["players"] = {
        name: "Players:",
        visible: function (key, opt) {
            return (locationMap[i][j].players.length > 0);
        },
        items: (function () {
            var players = {}
            for (index in locationMap[i][j].players) {
                players[`${index}`] = { name: locationMap[i][j].players[index].name }
            }
            return players;
        })()
    }
    itemsDict["sep1"] = "---------";
    itemsDict["quit"] = {
        name: "quit", icon: function () {
            return 'context-menu-icon context-menu-icon-quit';
        }
    }
    menuDict["items"] = itemsDict;
    return menuDict
}

/**
 * 
 * @param {*} invSlot slot of the inventory (starting from 0) 
 */
function findMenuObjInv(invSlot) {
    var itemsDict = {};
    var menuDict = {};
    var itemObj;
    var itemName = "";
    if (currPlayer.inventory[invSlot]) {
        itemObj = getItemObj(currPlayer.inventory[invSlot].id);
        itemName = itemObj.name;
    }
    itemsDict["itemName"] = {
        name: `${itemName}`,
        visible: function (key, opt) {
            // If item has a name
            return Boolean(itemObj)
        },
        icon: "far fa-list-alt"
    }
    if (itemObj) {
        for (action in itemObj.actions) {
            itemsDict[action] = {
                name: function () {
                    if (itemObj.actions[action] == "Select") {
                        if (currentSelectedSlot == -1 || invSlot != currentSelectedSlot) {
                            return "Action: Select"
                        } else {
                            return "Action: Deselect"
                        }
                    } else {
                        return `Action: ${itemObj.actions[action]}`
                    }

                }(),
                icon: 'fas fa-hammer',
                callback: function (key, opt) {
                    if (itemObj.actions[key] == "Select") {
                        if (currentSelectedSlot == -1 || invSlot != currentSelectedSlot) {
                            selectInvItem(invSlot);
                            currentSelectedActionId = key;
                        } else {
                            deselectInvItem();
                            currentSelectedActionId = -1;
                        }
                    } else {
                        deselectInvItem();
                    }

                    sendPlayerInvAction(itemObj.id, key, invSlot);
                }
            }
        }
    }
    itemsDict["sep1"] = "---------";
    itemsDict["quit"] = {
        name: "quit", icon: function () {
            return 'context-menu-icon context-menu-icon-quit';
        }
    }
    menuDict["items"] = itemsDict;
    return menuDict
};

function updateMenu() {
    $(function () {
        //$.contextMenu('update');
        $("#overlay").contextMenu('update');
        $("#overlay").contextMenu('hide');
    });
}

function structHasActionAtMousePos(mousePos) {
    // If the loation in locationMap hasn't been initalized yet
    if (!locationMap || !locationMap[mousePos.i][mousePos.j]) {
        return;
    }
    // Check if the player is in interactable range
    if (!checkIfInteractible(mousePos)) {
        return;
    }
    var structObj = locationMap[mousePos.i][mousePos.j].structure;
    if (structObj) {
        var obj = structureJson.find(o => o.id == structObj.id)
        if (obj) {
            // If there are actions for this structure
            if (Object.keys(obj["actions"]).length > 0) {
                return true;
            }
        }
    }
    return false;
}

