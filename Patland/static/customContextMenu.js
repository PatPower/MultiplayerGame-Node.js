$(function () {
    // Map
    $.contextMenu({
        selector: '#overlay, #click',
        autoHide: true,
        hideOnSecondTrigger: true,
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
        build: function ($triggerElement, e) {
            var x = mousePos.x - $('#overlay').offset().left - 4;
            var y = mousePos.y - $('#overlay').offset().top - 4;
            return findMenuObjInv(x, y, parseInt($triggerElement.attr("id").slice(4)) - 1);
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
                console.log(key, opt);
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

    console.log(i + "  " + j)
    return menuDict


}

/**
 * 
 * @param {*} x 
 * @param {*} y 
 * @param {*} invSlot slot of the inventory (starting from 0) 
 */
function findMenuObjInv(x, y, invSlot) {
    var i = Math.floor(x / BOXSIDE);
    var j = Math.floor(y / BOXSIDE);
    var itemsDict = {};
    var menuDict = {};
    var itemObj;
    var itemName = "";
    console.log(currPlayer.inventory[invSlot], invSlot)
    if (currPlayer.inventory[invSlot]) {
        itemObj = getItemObj(currPlayer.inventory[invSlot].id);
        itemName = itemObj.name;
    }
    console.log(i + "  " + j)
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
                name: `Action: ${itemObj.actions[action]}`,
                icon: 'fas fa-hammer',
                callback: function (key, opt) {
                    if (itemObj.actions[key] == "Select") {
                        selectInvItem(invSlot)
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