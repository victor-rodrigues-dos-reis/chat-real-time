let app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http);

const port = 3000;

// Informa qual página será retornada na rota '/'
app.get('/', (request, response) => {
    response.sendFile(`${__dirname}/index.html`);
});

// Informa quais eventos serão ouvidos ao se conectar ao socket
io.on('connection', (socket) => {
    // Emitir para todos quando um usuário conectar (Quando informar seu nome de usuário)
    socket.on('connected', (username) => {
        socket.broadcast.emit('connected', username);
    });

    // Emitir para todos quando um usuário digitar
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    })

    // Emitir para todos quando um usuário enviar uma mensagem
    socket.on('chat message', (msg) => {
        socket.broadcast.emit('chat message', msg);
    });
});

// Informa a porta onde o servidor irá "escutar"
http.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});

