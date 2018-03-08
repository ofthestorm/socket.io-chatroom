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
    // console.log(users);
    // console.log("cookie:"+req.cookies.name)
});

app.post('/signin', function (req, res) {

    // if (users.indexOf(req.cookies.name) != -1) {
    if (users.has(req.cookies.name)) {
        //存在，则不允许登陆
        res.redirect('/signin');
        // console.log("exist");
    } else {
        //不存在，把用户名存入 cookie 并跳转到主页
        // console.log("not exist");
        console.log("cookie:"+req.body.name);
        res.cookie('name', req.body.name, {domain: 'localhost',maxAge: 1000*60*60*24*30});
        users.add(req.body.name);
        res.redirect('/');
    }
});

io.on('connection', function(socket){
    // console.log('connected');
    
    //https://stackoverflow.com/questions/40816355/socket-io-send-disconnect-event-with-parameter
    socket.on('disconnect', function(){
        // console.log(socket.name+' disconnected');
        if (users.has(socket.name)) {
            //从 users 对象中删除该用户名
            users.delete(socket.name);
            //向其他所有用户广播该用户下线信息
            io.emit('offline', {users: users, user: socket.name});
        }
    });

    socket.on('chat message', function(msg, name){
        // console.log('message: ' + msg + name);
        io.emit('chat message', msg, name); //广播
    });

    socket.on('online', function(data){
        // console.log(data.user+" login");
        socket.name = data.user;
        // console.log("socket name:"+socket.name);
        users.add(data.user);
        console.log(users);

        //fixme： users无法传递
        // io.emit('online', {users: users, user: socket.name});
        io.emit('online', {users: users, user: socket.name});

    });
});

http.listen(3000, function () {
    console.log('Listening on port 3000');
});
