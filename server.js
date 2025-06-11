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

// Routes
app.get('/', auth.middleware(), (req, res) => {
    console.log('🏠 Serving homepage for user:', req.user.email);
    res.render('index', { user: req.user });
});

// API endpoint to get user info
app.get('/api/user', auth.middleware(), (req, res) => {
    console.log('👤 API user info request for:', req.user.email);
    res.json(req.user);
});

// API endpoint to get user profile (including username status)
app.get('/api/user/profile', auth.middleware(), async (req, res) => {
    try {
        console.log('👤 API user profile request for:', req.user.email);
        
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
app.post('/api/user/username', auth.middleware(), async (req, res) => {
    try {
        console.log('👤 API username save request for:', req.user.email);
        const { username } = req.body;
        
        // Validate username
        if (!username || typeof username !== 'string') {
            return res.status(400).json({ error: 'Username is required' });
        }
        
        const trimmedUsername = username.trim();
        
        if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
            return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
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

server.listen(port, function () {
    console.log('🚀 Server started successfully!');
    console.log('  Port:', port);
    console.log('  Environment:', process.env.NODE_ENV || 'production');
    console.log('  Cloudflare Team Domain:', process.env.CLOUDFLARE_TEAM_DOMAIN);
    console.log('========================================');
});

// Initialize the world with database support
var world = new World(database);

// Enhanced socket controller with authentication
var SocketController = require('./app/socketController.js')(io, world, auth, database);