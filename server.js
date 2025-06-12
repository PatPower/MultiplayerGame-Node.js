require('dotenv').config();
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var World = require('./app/world.js');
var CloudflareAuth = require('./app/auth.js');
var Database = require('./app/database.js');

const port = process.env.PORT || 80;
const DEV_MODE = process.env.DEV_MODE === 'true' || process.env.NODE_ENV === 'development';

console.log('🔧 Development Mode:', DEV_MODE ? 'ENABLED' : 'DISABLED');

// Initialize authentication and database
const auth = new CloudflareAuth();
const database = new Database();

app.set('port', port);
app.set('view engine', 'pug');
app.use('/static', express.static(__dirname + '/static'));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
    console.log('\n📥 Incoming Request:');
    console.log('  Time:', new Date().toISOString());
    console.log('  Method:', req.method);
    console.log('  URL:', req.url);
    console.log('  User-Agent:', req.headers['user-agent']?.substring(0, 100) || 'None');
    console.log('  IP:', req.ip || req.connection.remoteAddress);
    next();
});

// Helper function to generate random dev user
function generateDevUser() {
    const adjectives = ['Swift', 'Brave', 'Wise', 'Bold', 'Clever', 'Strong', 'Quick', 'Sharp', 'Bright', 'Noble', 'Wild', 'Free', 'Cool', 'Fast', 'Smart'];
    const nouns = ['Explorer', 'Builder', 'Miner', 'Crafter', 'Hunter', 'Warrior', 'Trader', 'Pioneer', 'Adventurer', 'Hero', 'Coder', 'Gamer', 'Player', 'Ninja', 'Wizard'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);
    const username = `${adjective}${noun}${number}`;

    return {
        id: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: `${username.toLowerCase()}@dev.local`,
        name: username,
        username: username,
        isDev: true
    };
}

// Dev mode middleware
function devModeMiddleware() {
    return (req, res, next) => {
        if (DEV_MODE) {
            // Generate a random dev user for each request
            req.user = generateDevUser();
            console.log('🔧 Dev mode: Generated user', req.user.username);
            next();
        } else {
            // Use normal Cloudflare authentication
            auth.middleware()(req, res, next);
        }
    };
}

// Routes
app.get('/', devModeMiddleware(), (req, res) => {
    console.log('🏠 Serving homepage for user:', req.user.email);
    res.render('index', { user: req.user, devMode: DEV_MODE });
});

// API endpoint to get user info
app.get('/api/user', devModeMiddleware(), (req, res) => {
    console.log('👤 API user info request for:', req.user.email);
    res.json({ ...req.user, devMode: DEV_MODE });
});

// API endpoint to get user profile (including username status)
app.get('/api/user/profile', devModeMiddleware(), async (req, res) => {
    try {
        console.log('👤 API user profile request for:', req.user.email);

        if (DEV_MODE) {
            // In dev mode, user always has a username ready
            res.json({
                hasUsername: true,
                username: req.user.username,
                email: req.user.email,
                devMode: true
            });
            return;
        }

        // Check if user has a saved profile in database
        const savedPlayer = await database.getPlayer(req.user.id);

        if (savedPlayer && savedPlayer.username) {
            res.json({
                hasUsername: true,
                username: savedPlayer.username,
                email: req.user.email
            });
        } else {
            res.json({
                hasUsername: false,
                email: req.user.email
            });
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// API endpoint to save username
app.post('/api/user/username', devModeMiddleware(), async (req, res) => {
    try {
        console.log('👤 API username save request for:', req.user.email);

        if (DEV_MODE) {
            // In dev mode, just return success with the current username
            res.json({ success: true, username: req.user.username, devMode: true });
            return;
        }

        const { username } = req.body;

        // Validate username
        if (!username || typeof username !== 'string') {
            return res.status(400).json({ error: 'Username is required' });
        }

        const trimmedUsername = username.trim();

        if (trimmedUsername.length < 3 || trimmedUsername.length > 10) {
            return res.status(400).json({ error: 'Username must be between 3 and 10 characters' });
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
            return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, and hyphens' });
        }

        // Check if username is already taken
        const existingPlayer = await database.getPlayerByUsername(trimmedUsername);
        if (existingPlayer && existingPlayer.userId !== req.user.id) {
            return res.status(400).json({ error: 'Username is already taken' });
        }

        // Save username to user's profile
        let savedPlayer = await database.getPlayer(req.user.id);
        if (savedPlayer) {
            // Update existing player
            savedPlayer.username = trimmedUsername;
            savedPlayer.name = trimmedUsername; // Also update the display name
            await database.savePlayer(req.user.id, savedPlayer);
        } else {
            // Create new player profile with username
            await database.createPlayer(req.user.id, req.user.email, trimmedUsername);
        }

        console.log('✅ Username saved successfully:', trimmedUsername);
        res.json({ success: true, username: trimmedUsername });

    } catch (error) {
        console.error('Error saving username:', error);
        res.status(500).json({ error: 'Failed to save username' });
    }
});

// Initialize the world with database support
var world = new World(database);

// World Generation API endpoints (must be after world initialization)
app.get('/api/world/generation/settings', devModeMiddleware(), (req, res) => {
    try {
        console.log('🌍 API world generation settings request');
        const settings = world.getWorldGenerationSettings();
        res.json({ success: true, settings: settings });
    } catch (error) {
        console.error('Error fetching world generation settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.post('/api/world/generation/update', devModeMiddleware(), (req, res) => {
    try {
        console.log('🌍 API world generation update request');
        const { rates } = req.body;

        if (!rates || typeof rates !== 'object') {
            return res.status(400).json({ error: 'Invalid rates object' });
        }

        world.updateWorldGeneration(rates);
        const updatedSettings = world.getWorldGenerationSettings();

        res.json({
            success: true,
            message: 'World generation settings updated successfully',
            settings: updatedSettings
        });
    } catch (error) {
        console.error('Error updating world generation settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

app.post('/api/world/regenerate', devModeMiddleware(), (req, res) => {
    try {
        console.log('🌍 API world regeneration request');
        world.regenerateWorld();
        res.json({
            success: true,
            message: 'World regenerated successfully'
        });
    } catch (error) {
        console.error('Error regenerating world:', error);
        res.status(500).json({ error: 'Failed to regenerate world' });
    }
});

server.listen(port, function () {
    console.log('🚀 Server started successfully!');
    console.log('  Port:', port);
    console.log('  Environment:', process.env.NODE_ENV || 'production');
    console.log('  Dev Mode:', DEV_MODE ? 'ENABLED' : 'DISABLED');
    if (!DEV_MODE) {
        console.log('  Cloudflare Team Domain:', process.env.CLOUDFLARE_TEAM_DOMAIN);
    }
    console.log('========================================');
});

// Enhanced socket controller with authentication
var SocketController = require('./app/socketController.js')(io, world, auth, database);