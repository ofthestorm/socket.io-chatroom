var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


app.use(cookieParser());
app.use(bodyParser());

//online users
var users = new Set();

app.get('/', function (req, res) {
    if (req.cookies.name == null) {
        res.redirect('/signin');
    } else {
        res.sendFile(__dirname + '/src/index.html');
    }
});

app.get('/signin', function (req, res) {
    if (req.cookies.name == null) {
        res.sendFile(__dirname + '/src/signin.html');
    } else {
        res.redirect('/');
    }
});

app.post('/signin', function (req, res) {

    if (users.has(req.cookies.name)) {
        res.redirect('/signin');
    } else {
        res.cookie('name', req.body.name, {domain: 'localhost',maxAge: 1000*60*60*24*30});
        users.add(req.body.name);
        res.redirect('/');
    }
});

io.on('connection', function(socket){

    //https://stackoverflow.com/questions/40816355/socket-io-send-disconnect-event-with-parameter
    socket.on('disconnect', function(){
        if (users.has(socket.name)) {
            users.delete(socket.name);
            io.emit('offline', {users: users, user: socket.name});
        }
    });

    socket.on('chat message', function(msg, name){
        io.emit('chat message', msg, name); //广播
    });

    socket.on('online', function(data){
        socket.name = data.user;
        users.add(data.user);
        console.log(users);

        //fixme： users无法传递
        io.emit('online', {users: users, user: socket.name});

    });
});

http.listen(3000, function () {
    console.log('Listening on port 3000');
});
