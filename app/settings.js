var Settings = {
    CWIDTH: 840,
    CHEIGHT: 600,
    BOXSIDE: 40,
    NUMCOL: 0,
    NUMROW: 0,
    MAXSPEED: 30,
    WORLDLIMIT: 400,  // Changed from 100 to 400
    HORIZONTALRADIUS: 0,
    VERTICALRADIUS: 0,
    MILLISECONDMAX: 0,
    MAXINVSIZE: 60,

    // World Generation Settings
    WORLD_GENERATION: {
        // Spawn rates (0.0 to 1.0, where 1.0 = 100% chance)
        TREE_SPAWN_RATE: 0.05,        // 5% chance per tile (reduced from 15%)
        ROCK_SPAWN_RATE: 0.04,        // 4% chance per tile (reduced from 12%)
        MONUMENT_SPAWN_RATE: 0.003,   // Increased from 0.001 to 0.003 for more monuments

        // Monument bag spawning settings
        BAGS_PER_MONUMENT_MIN: 1,      // Minimum bags per monument
        BAGS_PER_MONUMENT_MAX: 3,      // Maximum bags per monument

        // Clustering settings (higher values = more clustering)
        TREE_CLUSTER_STRENGTH: 0.3,   // Reduced clustering (was 0.7)
        ROCK_CLUSTER_STRENGTH: 0.25,  // Reduced clustering (was 0.6)
        CLUSTER_RADIUS: 3,             // How far to look for clustering

        // Monument settings
        MONUMENT_MIN_SIZE: 3,          // Minimum monument size (3x3)
        MONUMENT_MAX_SIZE: 6,          // Maximum monument size (6x6)
        MONUMENT_MIN_SPACING: 15,      // Minimum distance between monuments

        // Generation bounds (avoid spawning too close to spawn point)
        SAFE_ZONE_RADIUS: 5,          // No structures within this radius of spawn
        SPAWN_POINT: { i: 200, j: 200 } // Changed to center of 400x400 world
    }
}

Settings.NUMCOL = Math.floor(Settings.CWIDTH / Settings.BOXSIDE);
Settings.NUMROW = Math.floor(Settings.CHEIGHT / Settings.BOXSIDE);
Settings.HORIZONTALRADIUS = Math.floor(Settings.NUMCOL / 2);
Settings.VERTICALRADIUS = Math.floor(Settings.NUMROW / 2);

module.exports = Settings;