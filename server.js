/* server.js
 */

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var fs = require('fs');

function getCodeList () {
    var jsfiles = [];
    var files = fs.readdirSync('code/');
    for (var i = 0; i < files.length; i++) {
        if (/\.js$/.test(files[i])) {
            jsfiles.push(files[i]);
        }
    }
    return jsfiles;
}

var codeList = getCodeList();
var watcher = fs.watch('code/');
watcher.on('change', function (event, filename) {
    console.log('Change in code directory', filename);
    codeList = getCodeList();
    for (var k in sockets) {
        sockets[k].emit('code files', codeList);
    }
});

// Handle socket requests
var sockets = {};
io.on('connect', function (socket) {
    console.log('Socket connection', socket.id);
    sockets[socket.id] = socket;
    socket.on('get code list', function () {
        socket.emit('code files', codeList);
    });
});

app.use('/js/', express.static(__dirname + '/js/'));
app.use('/css/', express.static(__dirname + '/css/'));
app.use('/lib/', express.static(__dirname + '/lib/'));
app.use('/code/', express.static(__dirname + '/code/'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/index.html', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
server.listen(process.env.PORT, process.env.IP);
