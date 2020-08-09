let app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http); 

app.get('/', (request, response) => {
    response.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('connected', (username) => {
        socket.broadcast.emit('connected', username);
    });

    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    })

    socket.on('chat message', (msg) => {
        socket.broadcast.emit('chat message', msg);
    });
});

http.listen(3000, () => {
    console.log('listening on 3000');
});

