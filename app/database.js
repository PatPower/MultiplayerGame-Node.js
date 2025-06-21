const fs = require('fs').promises;
const path = require('path');

class Database {
    constructor() {
        this.dbType = process.env.DATABASE_TYPE || 'json';
        this.dbPath = process.env.DATABASE_PATH || './data/players.json';
        this.ensureDataDirectory();
    }

    async ensureDataDirectory() {
        const dir = path.dirname(this.dbPath);
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async loadPlayerData() {
        try {
            await fs.access(this.dbPath);
            const data = await fs.readFile(this.dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // File doesn't exist or is invalid, return empty object
            return {};
        }
    }

    async savePlayerData(data) {
        await this.ensureDataDirectory();
        await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2));
    }

    async getPlayer(userId) {
        const data = await this.loadPlayerData();
        return data[userId] || null;
    }

    async getPlayerByUsername(username) {
        const data = await this.loadPlayerData();
        // Search through all players to find one with matching username
        for (const userId in data) {
            if (data[userId].username === username) {
                return data[userId];
            }
        }
        return null;
    }

    async savePlayer(userId, playerData) {
        const data = await this.loadPlayerData();
        data[userId] = {
            ...playerData,
            lastSaved: new Date().toISOString()
        };
        await this.savePlayerData(data);
    }

    async createPlayer(userId, email, name) {
        const existingPlayer = await this.getPlayer(userId);
        if (existingPlayer) {
            return existingPlayer;
        }

        const newPlayer = {
            userId: userId,
            email: email,
            name: name,
            username: name, // Use the provided name as the username
            inventory: [
                { id: 0, durability: 50 }, // Pickaxe
                { id: 6, durability: 50 }, // Hatchet
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
            ],
            inventorySize: 12,
            skills: {
                "mining": { level: 1, experience: 0 },
                "woodcutting": { level: 1, experience: 0 }
            },
            position: { i: 200, j: 200 }, // Changed from { i: 10, j: 7 } to center of 400x400 world
            color: this.generatePlayerColor(),
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        await this.savePlayer(userId, newPlayer);
        return newPlayer;
    }

    async updatePlayerInventory(userId, inventory, inventorySize) {
        const player = await this.getPlayer(userId);
        if (player) {
            player.inventory = inventory;
            player.inventorySize = inventorySize;
            await this.savePlayer(userId, player);
        }
    }

    async updatePlayerPosition(userId, position) {
        const player = await this.getPlayer(userId);
        if (player) {
            player.position = position;
            await this.savePlayer(userId, player);
        }
    }

    async updatePlayerSkills(userId, skills) {
        const player = await this.getPlayer(userId);
        if (player) {
            player.skills = skills;
            await this.savePlayer(userId, player);
        }
    }

    async migrateAllPlayersInventory() {
        const data = await this.loadPlayerData();
        let migrationCount = 0;

        for (const userId in data) {
            const player = data[userId];

            // Update inventory to only have pickaxe and hatchet
            player.inventory = [
                { id: 0, durability: 50 }, // Pickaxe
                { id: 1, durability: 50 }, // Hatchet
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
            ];
            player.inventorySize = 12;

            migrationCount++;
        }

        if (migrationCount > 0) {
            await this.savePlayerData(data);
            console.log(`Successfully migrated ${migrationCount} players to new inventory system`);
        }

        return migrationCount;
    }

    generatePlayerColor() {
        const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    async getAllPlayers() {
        return await this.loadPlayerData();
    }

    async deletePlayer(userId) {
        const data = await this.loadPlayerData();
        delete data[userId];
        await this.savePlayerData(data);
    }
}

module.exports = Database;