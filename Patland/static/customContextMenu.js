
//var canvasRectPos = document.getElementById("overlay").getBoundingClientRect();

$(function () {
    $.contextMenu({
        selector: '#overlay',
        callback: function (key, options) {
            var m = "clicked: " + key;
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
        console.log('clicked', this);
    })
});

function findMenuObj(x, y) {
    var i = Math.floor(x / boxSide);
    var j = Math.floor(y / boxSide)
    console.log(i + "  " + j)
    return {
        items: {
            "ground": { name: `${locationMap[i][j].ground.name}` },
            "strucutre": { name: `${locationMap[i][j].structure.name}` },
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
                    console.log(players)
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