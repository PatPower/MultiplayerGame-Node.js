var Settings = require('./settings.js');

/**
 * World Generator - Handles random generation of trees, rocks, and monuments
 */
function WorldGenerator() {
    this.monuments = []; // Keep track of monument locations for spacing
}

/**
 * Generates the entire world with trees, rocks, and monuments
 * @param {Array} worldStructureMap - 2D array to populate with structures
 */
WorldGenerator.prototype.generateWorld = function (worldStructureMap) {
    console.log("🌍 Starting world generation...");

    // Reset monuments array
    this.monuments = [];

    // First pass: Generate monuments (they need the most space)
    this.generateMonuments(worldStructureMap);

    // Second pass: Generate trees and rocks with clustering
    this.generateTreesAndRocks(worldStructureMap);

    console.log(`✅ World generation complete! Generated ${this.monuments.length} monuments`);
};

/**
 * Generates random monuments made of brick walls
 * @param {Array} worldStructureMap 
 */
WorldGenerator.prototype.generateMonuments = function (worldStructureMap) {
    var config = Settings.WORLD_GENERATION;
    var monumentCount = 0;

    console.log("🏛️ Generating monuments...");

    for (var i = 0; i < Settings.WORLDLIMIT; i++) {
        for (var j = 0; j < Settings.WORLDLIMIT; j++) {
            // Skip if in safe zone
            if (this.isInSafeZone(i, j)) continue;

            // Check spawn chance
            if (Math.random() < config.MONUMENT_SPAWN_RATE) {
                // Check if location is valid for monument
                if (this.canPlaceMonument(i, j, worldStructureMap)) {
                    var size = this.randomInt(config.MONUMENT_MIN_SIZE, config.MONUMENT_MAX_SIZE);
                    this.createMonument(i, j, size, worldStructureMap);
                    monumentCount++;
                }
            }
        }
    }

    console.log(`🏛️ Generated ${monumentCount} monuments`);
};

/**
 * Generates trees and rocks with clustering behavior
 * @param {Array} worldStructureMap 
 */
WorldGenerator.prototype.generateTreesAndRocks = function (worldStructureMap) {
    var config = Settings.WORLD_GENERATION;
    var treeCount = 0;
    var rockCount = 0;

    console.log("🌲 Generating trees and rocks...");

    for (var i = 0; i < Settings.WORLDLIMIT; i++) {
        for (var j = 0; j < Settings.WORLDLIMIT; j++) {
            // Skip if already occupied or in safe zone
            if (worldStructureMap[i][j] || this.isInSafeZone(i, j)) continue;

            // Check for tree spawn
            var treeChance = config.TREE_SPAWN_RATE;
            if (this.hasNearbyStructure(i, j, 5, worldStructureMap)) { // Structure ID 5 = Tree
                treeChance *= (1 + config.TREE_CLUSTER_STRENGTH);
            }

            if (Math.random() < treeChance) {
                worldStructureMap[i][j] = { id: 5, health: 30, owner: "game" };
                treeCount++;
                continue; // Don't place rock on same tile
            }

            // Check for rock spawn
            var rockChance = config.ROCK_SPAWN_RATE;
            if (this.hasNearbyStructure(i, j, 1, worldStructureMap)) { // Structure ID 1 = Rock
                rockChance *= (1 + config.ROCK_CLUSTER_STRENGTH);
            }

            if (Math.random() < rockChance) {
                worldStructureMap[i][j] = { id: 1, health: 10, owner: "game" };
                rockCount++;
            }
        }
    }

    console.log(`🌲 Generated ${treeCount} trees`);
    console.log(`🗿 Generated ${rockCount} rocks`);
};

/**
 * Creates a monument (rectangular structure made of brick walls)
 * @param {number} startI - Starting i coordinate
 * @param {number} startJ - Starting j coordinate  
 * @param {number} size - Size of the monument
 * @param {Array} worldStructureMap 
 */
WorldGenerator.prototype.createMonument = function (startI, startJ, size, worldStructureMap) {
    var monument = {
        i: startI,
        j: startJ,
        size: size
    };

    // Create hollow rectangle of brick walls
    for (var i = startI; i < startI + size && i < Settings.WORLDLIMIT; i++) {
        for (var j = startJ; j < startJ + size && j < Settings.WORLDLIMIT; j++) {
            // Only place bricks on the border of the rectangle
            if (i === startI || i === startI + size - 1 || j === startJ || j === startJ + size - 1) {
                worldStructureMap[i][j] = { id: 4, health: 50, owner: "game" }; // Brick Wall
            }
        }
    }

    this.monuments.push(monument);
    console.log(`🏛️ Created monument at (${startI}, ${startJ}) with size ${size}x${size}`);
};

/**
 * Checks if a monument can be placed at the given location
 * @param {number} i - i coordinate
 * @param {number} j - j coordinate
 * @param {Array} worldStructureMap 
 * @returns {boolean}
 */
WorldGenerator.prototype.canPlaceMonument = function (i, j, worldStructureMap) {
    var config = Settings.WORLD_GENERATION;
    var maxSize = config.MONUMENT_MAX_SIZE;

    // Check if monument would fit within world bounds
    if (i + maxSize >= Settings.WORLDLIMIT || j + maxSize >= Settings.WORLDLIMIT) {
        return false;
    }

    // Check spacing from other monuments
    for (var m = 0; m < this.monuments.length; m++) {
        var monument = this.monuments[m];
        var distance = Math.sqrt(Math.pow(i - monument.i, 2) + Math.pow(j - monument.j, 2));
        if (distance < config.MONUMENT_MIN_SPACING) {
            return false;
        }
    }

    // Check if area is clear
    for (var checkI = i; checkI < i + maxSize; checkI++) {
        for (var checkJ = j; checkJ < j + maxSize; checkJ++) {
            if (worldStructureMap[checkI][checkJ]) {
                return false;
            }
        }
    }

    return true;
};

/**
 * Checks if there's a nearby structure of the specified type for clustering
 * @param {number} i - i coordinate
 * @param {number} j - j coordinate
 * @param {number} structureId - ID of structure to look for
 * @param {Array} worldStructureMap 
 * @returns {boolean}
 */
WorldGenerator.prototype.hasNearbyStructure = function (i, j, structureId, worldStructureMap) {
    var radius = Settings.WORLD_GENERATION.CLUSTER_RADIUS;

    for (var checkI = Math.max(0, i - radius); checkI <= Math.min(Settings.WORLDLIMIT - 1, i + radius); checkI++) {
        for (var checkJ = Math.max(0, j - radius); checkJ <= Math.min(Settings.WORLDLIMIT - 1, j + radius); checkJ++) {
            if (checkI === i && checkJ === j) continue; // Skip current position

            var structure = worldStructureMap[checkI][checkJ];
            if (structure && structure.id === structureId) {
                return true;
            }
        }
    }

    return false;
};

/**
 * Checks if coordinates are within the safe zone around spawn
 * @param {number} i - i coordinate
 * @param {number} j - j coordinate
 * @returns {boolean}
 */
WorldGenerator.prototype.isInSafeZone = function (i, j) {
    var config = Settings.WORLD_GENERATION;
    var spawn = config.SPAWN_POINT;
    var distance = Math.sqrt(Math.pow(i - spawn.i, 2) + Math.pow(j - spawn.j, 2));
    return distance <= config.SAFE_ZONE_RADIUS;
};

/**
 * Generates random integer between min and max (inclusive)
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
WorldGenerator.prototype.randomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Updates spawn rates for world generation
 * @param {Object} rates - Object containing new spawn rates
 */
WorldGenerator.prototype.updateSpawnRates = function (rates) {
    var config = Settings.WORLD_GENERATION;

    if (rates.treeSpawnRate !== undefined) {
        config.TREE_SPAWN_RATE = Math.max(0, Math.min(1, rates.treeSpawnRate));
        console.log(`🌲 Tree spawn rate updated to: ${config.TREE_SPAWN_RATE}`);
    }

    if (rates.rockSpawnRate !== undefined) {
        config.ROCK_SPAWN_RATE = Math.max(0, Math.min(1, rates.rockSpawnRate));
        console.log(`🗿 Rock spawn rate updated to: ${config.ROCK_SPAWN_RATE}`);
    }

    if (rates.monumentSpawnRate !== undefined) {
        config.MONUMENT_SPAWN_RATE = Math.max(0, Math.min(1, rates.monumentSpawnRate));
        console.log(`🏛️ Monument spawn rate updated to: ${config.MONUMENT_SPAWN_RATE}`);
    }

    if (rates.treeClusterStrength !== undefined) {
        config.TREE_CLUSTER_STRENGTH = Math.max(0, Math.min(2, rates.treeClusterStrength));
        console.log(`🌲 Tree cluster strength updated to: ${config.TREE_CLUSTER_STRENGTH}`);
    }

    if (rates.rockClusterStrength !== undefined) {
        config.ROCK_CLUSTER_STRENGTH = Math.max(0, Math.min(2, rates.rockClusterStrength));
        console.log(`🗿 Rock cluster strength updated to: ${config.ROCK_CLUSTER_STRENGTH}`);
    }
};

module.exports = WorldGenerator;