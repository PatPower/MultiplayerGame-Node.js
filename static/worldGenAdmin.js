// World Generation Admin Functions (available in browser console)
window.worldGenAdmin = {
    // Get current world generation settings
    async getSettings() {
        try {
            const response = await fetch('/api/world/generation/settings', {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                console.log('🌍 Current World Generation Settings:');
                console.table(data.settings);
                return data.settings;
            } else {
                console.error('❌ Failed to get settings:', data.error);
            }
        } catch (error) {
            console.error('❌ Error fetching settings:', error);
        }
    },

    // Update spawn rates
    async updateRates(rates) {
        try {
            console.log('🔧 Updating world generation rates:', rates);
            const response = await fetch('/api/world/generation/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ rates: rates })
            });
            const data = await response.json();
            if (data.success) {
                console.log('✅ Settings updated successfully!');
                console.table(data.settings);
                return data.settings;
            } else {
                console.error('❌ Failed to update settings:', data.error);
            }
        } catch (error) {
            console.error('❌ Error updating settings:', error);
        }
    },

    // Regenerate the world
    async regenerateWorld() {
        if (confirm('⚠️  This will regenerate the entire world! All existing structures will be replaced. Continue?')) {
            try {
                console.log('🔄 Regenerating world...');
                const response = await fetch('/api/world/regenerate', {
                    method: 'POST',
                    credentials: 'include'
                });
                const data = await response.json();
                if (data.success) {
                    console.log('✅ World regenerated successfully!');
                    alert('🌍 World has been regenerated! The new world should be visible immediately.');
                } else {
                    console.error('❌ Failed to regenerate world:', data.error);
                }
            } catch (error) {
                console.error('❌ Error regenerating world:', error);
            }
        }
    },

    // Quick preset configurations
    presets: {
        // Sparse world with few structures
        sparse: {
            treeSpawnRate: 0.05,
            rockSpawnRate: 0.03,
            monumentSpawnRate: 0.001,
            bagsPerMonumentMin: 1,
            bagsPerMonumentMax: 2,
            treeClusterStrength: 0.3,
            rockClusterStrength: 0.2
        },

        // Default balanced world
        balanced: {
            treeSpawnRate: 0.15,
            rockSpawnRate: 0.12,
            monumentSpawnRate: 0.002,
            bagsPerMonumentMin: 1,
            bagsPerMonumentMax: 3,
            treeClusterStrength: 0.7,
            rockClusterStrength: 0.6
        },

        // Dense world with many structures
        dense: {
            treeSpawnRate: 0.25,
            rockSpawnRate: 0.20,
            monumentSpawnRate: 0.005,
            bagsPerMonumentMin: 2,
            bagsPerMonumentMax: 4,
            treeClusterStrength: 0.9,
            rockClusterStrength: 0.8
        },

        // Forest world with mostly trees
        forest: {
            treeSpawnRate: 0.35,
            rockSpawnRate: 0.05,
            monumentSpawnRate: 0.001,
            bagsPerMonumentMin: 1,
            bagsPerMonumentMax: 2,
            treeClusterStrength: 1.2,
            rockClusterStrength: 0.3
        },

        // Rocky world with mostly rocks
        rocky: {
            treeSpawnRate: 0.05,
            rockSpawnRate: 0.30,
            monumentSpawnRate: 0.003,
            bagsPerMonumentMin: 1,
            bagsPerMonumentMax: 3,
            treeClusterStrength: 0.3,
            rockClusterStrength: 1.0
        },

        // Monument world with many brick structures
        monuments: {
            treeSpawnRate: 0.08,
            rockSpawnRate: 0.08,
            monumentSpawnRate: 0.008,
            bagsPerMonumentMin: 2,
            bagsPerMonumentMax: 5,
            treeClusterStrength: 0.4,
            rockClusterStrength: 0.4
        }
    },

    // Apply a preset configuration
    async applyPreset(presetName) {
        if (this.presets[presetName]) {
            console.log(`🎨 Applying '${presetName}' preset...`);
            await this.updateRates(this.presets[presetName]);
            console.log(`✅ '${presetName}' preset applied! Use regenerateWorld() to see the changes.`);
        } else {
            console.error(`❌ Unknown preset: ${presetName}`);
            console.log('Available presets:', Object.keys(this.presets));
        }
    },

    // Show help information
    help() {
        console.log(`
🌍 World Generation Admin Commands:

📊 Information:
  worldGenAdmin.getSettings()              - View current settings
  worldGenAdmin.help()                     - Show this help

🔧 Configuration:
  worldGenAdmin.updateRates(rates)         - Update spawn rates
  Example: worldGenAdmin.updateRates({
    treeSpawnRate: 0.2,
    rockSpawnRate: 0.15,
    monumentSpawnRate: 0.003,
    bagsPerMonumentMin: 1,
    bagsPerMonumentMax: 3
  })

🎨 Presets:
  worldGenAdmin.applyPreset('presetName')  - Apply a preset
  Available presets: ${Object.keys(this.presets).join(', ')}

🔄 World Management:
  worldGenAdmin.regenerateWorld()          - Regenerate the entire world

📋 Spawn Rate Guidelines:
  • Values are between 0.0 (0%) and 1.0 (100%)
  • treeSpawnRate: 0.1-0.3 recommended
  • rockSpawnRate: 0.1-0.3 recommended
  • monumentSpawnRate: 0.001-0.01 recommended (very rare)
  • bagsPerMonumentMin/Max: 1-5 recommended (bags per monument)
  • clusterStrength: 0.0-2.0 (higher = more clustering)

🎒 Bag Changes:
  • Bags no longer spawn randomly in the world
  • Bags now only spawn inside monuments
  • Each monument contains 1-3 bags by default (configurable)

⚠️  Note: Changes only take effect after regenerating the world!
        `);
    }
};

// Show help on first load
console.log('🌍 World Generation Admin loaded! Type worldGenAdmin.help() for commands.');