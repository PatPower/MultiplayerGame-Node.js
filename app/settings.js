var Settings = {
    CWIDTH: 840,
    CHEIGHT: 600,
    BOXSIDE: 40,
    NUMCOL: 0,
    NUMROW: 0,
    MAXSPEED: 30,
    WORLDLIMIT: 100,
    HORIZONTALRADIUS: 0,
    VERTICALRADIUS: 0,
    MILLISECONDMAX: 000,
    MAXINVSIZE: 60
}

Settings.NUMCOL = Math.floor(Settings.CWIDTH / Settings.BOXSIDE);
Settings.NUMROW = Math.floor(Settings.CHEIGHT / Settings.BOXSIDE);
Settings.HORIZONTALRADIUS = Math.floor(Settings.NUMCOL / 2);
Settings.VERTICALRADIUS = Math.floor(Settings.NUMROW / 2);

module.exports = Settings;