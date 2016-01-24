var express = require('express');
var http = require('http');
var dotenv = require('dotenv');
var Clarifai = require('./clarifai_node.js');
var io = require('socket.io');
var sockets = require('./sockets.js');

var url = 'mongodb://localhost:27017/dogeku';
var app = {};
var port = 8000;


dotenv.load();

/**
 * Setup Clarifi
 */
Clarifai.initAPI(process.env.CLIENT_ID, process.env.CLIENT_SECRET);



/**
 * Setup Express
 */
var e = app.e = express();
app.server = app.server = http.createServer(e);
io = io(app.server);

e.use(express.static(__dirname + '/public'));

sockets(io);

/**
 * Routes
 */


app.server.listen(port, function() {
	console.log('Listening on port ' + port + '\n');
});




