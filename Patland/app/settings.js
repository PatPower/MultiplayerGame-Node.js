modules.export = {
    CWIDTH: 840,
    CHEIGHT: 600,
    BOXSIDE: 40,
    NUMCOL: Math.floor(CWIDTH / BOXSIDE),
    NUMROW: Math.floor(CHEIGHT / BOXSIDE),
    MAXSPEED: 30,
    WORLDLIMIT: 100,
    HORIZONTALRADIUS: Math.floor(NUMCOL / 2),
    VERTICALRADIUS: Math.floor(NUMROW / 2),
    MILLISECONDMAX: 000,
    structureJson: getStructureJson(),
}