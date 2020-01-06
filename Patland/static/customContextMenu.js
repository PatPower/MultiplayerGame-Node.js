
//var canvasRectPos = document.getElementById("overlay").getBoundingClientRect();

$(function () {
    $.contextMenu({
        selector: '#overlay',
        callback: function (key, options, rootMenu, origEvent) {
            var m = "1 clicked: " + key;
            console.log(options, "HEY")
            console.log(rootMenu)
            console.log(options.$label)
            window.console && console.log(m) || alert(m);
        },
        autoHide: true,
        hideOnSecondTrigger: true,
        build: function ($triggerElement, e) {
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
    var j = Math.floor(y / BOXSIDE)
    console.log(i + "  " + j)
    return {
        items: {
            "ground": { name: `${locationMap[i][j].ground.name}`, icon: "far fa-list-alt" },
            "structure": { name: `${locationMap[i][j].structure.name}`, icon: "far fa-list-alt"},
            "a1": {
                name: `Action: ${locationMap[i][j].structure.action.a1}`,
                icon: 'fas fa-hammer',
                visible: function (key, opt) {
                    // TODO: Check if in interactible range
                    if (locationMap[i][j].structure.action.a1) {
                        return true;
                    } else {
                        return false;
                    }
                },
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