var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


app.use(cookieParser());
app.use(bodyParser());


var users = new Array();

app.get('/', function (req, res) {
    // res.send('Hello World!');
    // res.sendFile(__dirname + '/src/index.html');
    // res.cookie("name", "hello");

    // console.log('Cookies: ', req.cookies);
    // console.log('Signed Cookies: ', req.signedCookies);

    if (req.cookies.name == null) {
        res.redirect('/signin');
    } else {
        res.sendFile(__dirname + '/src/index.html');
    }
});

app.get('/signin', function (req, res) {
    res.sendFile(__dirname + '/src/signin.html');
    console.log(users);
    // console.log("cookie:"+req.cookies.name)
});

app.post('/signin', function (req, res) {

    if (users.indexOf(req.cookies.name) != -1) {
        //存在，则不允许登陆
        res.redirect('/signin');
        // console.log("exist");
    } else {
        //不存在，把用户名存入 cookie 并跳转到主页
        // console.log("not exist");
        console.log("cookie:"+req.body.name);
        res.cookie('name', req.body.name, {domain: 'localhost',maxAge: 1000*60*60*24*30});
        users.push(req.body.name);
        res.redirect('/');
    }
});

io.on('connection', function(socket){
    // console.log('connected');
    socket.on('disconnect', function(){
        console.log(socket.name+'disconnected');
        if (users.indexOf(socket.name) != -1) {
            //从 users 对象中删除该用户名
            //todo: socket.name --> hello 与数组中不一致
            delete users[socket.name];
            console.log(users);
            //向其他所有用户广播该用户下线信息
            io.emit('offline', {users: users, user: socket.name});
        }
    });
    socket.on('chat message', function(msg, name){
        // console.log('message: ' + msg + name);
        io.emit('chat message', msg, name); //广播
    });
    socket.on('online', function(data){
        console.log(data.user+"login");
        socket.name = data.user;
        console.log("socket name:"+socket.name);
        io.emit('online', data);
    });
});

// io.on('connection', function(socket){
//     socket.broadcast.emit('chat message');
// });

http.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
