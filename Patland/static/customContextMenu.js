
//var canvasRectPos = document.getElementById("overlay").getBoundingClientRect();

$(function () {
    $.contextMenu({
        selector: '#overlay',
        autoHide: true,
        hideOnSecondTrigger: true,
        build: function ($triggerElement, e) {
            console.log(e.offsetX, e.offsetY, "HEY")
            return findMenuObj(e.offsetX, e.offsetY)
        },
        zIndex: 4
    });

    $('.context-menu-one').on('click', function (e) {
        console.log('2 clicked', this);
    })
});

function findMenuObj(x, y) {
    var i = Math.floor(x / BOXSIDE);
    var j = Math.floor(y / BOXSIDE);
    var locWhenClicked = { i: currPlayer.i, j: currPlayer.j }
    var structIdWhenClicked = locationMap[i][j].structure.id
    console.log(i + "  " + j)
    return {
        items: {
            "ground": { name: `${locationMap[i][j].ground.name}`, icon: "far fa-list-alt" },
            "structure": { name: `${locationMap[i][j].structure.name}`, icon: "far fa-list-alt" },
            "a1": {
                name: `Action: ${locationMap[i][j].structure.action.a1}`,
                icon: 'fas fa-hammer',
                visible: function (key, opt) {
                    console.log("H")
                    if (locationMap[i][j].structure.action.a1) {
                        var structureLoc = { i: i, j: j };
                        if (checkIfInteractible(getMiddleLocation(), structureLoc)) {
                            return true;
                        }
                    }
                    return false;
                },
                callback: function (key, opt) {
                    console.log(getGlobalCoords({ i: i, j: j }, locWhenClicked));
                    sendPlayerAction(structIdWhenClicked, "a1", getGlobalCoords({ i: i, j: j }, locWhenClicked));
                }
            },
            "players": {
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
            },
            "sep1": "---------",
            "quit": {
                name: "Hello", icon: function () {
                    return 'context-menu-icon context-menu-icon-quit';
                }
            }
        }
    };
}

function updateMenu() {
    $(function () {
        //$.contextMenu('update');
        console.log("tue")
        $("#overlay").contextMenu('update');
        $("#overlay").contextMenu('hide');
    });
}