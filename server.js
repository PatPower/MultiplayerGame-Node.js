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

// Routes
app.get('/', auth.middleware(), (req, res) => {
    res.render('index', { user: req.user });
});

// API endpoint to get user info
app.get('/api/user', auth.middleware(), (req, res) => {
    res.json(req.user);
});

server.listen(port, function () {
    console.log('listening on ' + port);
});

// Initialize the world with database support
var world = new World(database);

// Enhanced socket controller with authentication
var SocketController = require('./app/socketController.js')(io, world, auth, database);