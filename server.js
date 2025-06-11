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