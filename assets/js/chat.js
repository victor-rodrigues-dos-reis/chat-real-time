$(function () {
    let socket = io();
    let username = prompt('Digite seu nick name');
    let typing = false; // indica se o usuário está digitando ou não
    let timeout = undefined; // guardará o timeout de digitação

    // Emite para o servidor que o usuário se conectou
    socket.emit('connected', username);

    // Evento de submit do formulário de mensagem do chat
    $('form').submit(function(e){
        e.preventDefault();

        // Monta o texto enviado com o nome do usuário remetente
        const myMessage = username + ': ' + $('#m').val();

        // Emite para o servidor a mensagem que foi digitada pelo usuário remetente
        // e apresenta a mensagem digitada ao usuário remetente
        socket.emit('chat message', myMessage, myMessages(myMessage));
        stopShowTyping();

        // Limpa o input de mensagem
        $('#m').val('');

        return false;
    });

    // Evento input do input de mensage
    $('input').on('input', () => {
        // Verifica se o usuário remetente NÃO está digitando
        if (!typing) {
            typing = true
            // Emite para o servidor que o usuário remetente está digitando
            socket.emit('typing', {user: username, status: true});
        }

        // Limpa o "timer" que indica o intervalo de digitação
        clearTimeout(timeout);

        // Estabelece o intervalo de digitação (indica quanto tempo após para de digitar o sistema vai emitir para o servidor)
        timeout = setTimeout(function() {
            stopShowTyping()
        }, 1500);
    });

    // Emite para o servidor quando o usuário remetente para de digitar
    function stopShowTyping() {
        typing = false;
        socket.emit('typing', {user: username, status: false});
    }

    // Anexa a mensagem enviada a div que mostra todas as mensagens
    function myMessages(message) {
        $('#messages').append($('<li>').text(message).addClass('my-messages'));
    }
    
    // Recebe do servidor as informações de quanto um usuário está digitando
    socket.on('typing', function(data) {
        const {user, status} = data;

        // Verifica se o status retornou "true" (true indica que o usuário ainda está digitando)
        // true: Adiciona uma mensagem indicando que o usuário específico está digitando
        // false: Remove a mensagem que indica que um usuário está digitando
        if (status) {
            $('#messages').append($('<li>').text(`${user} está digitando ...`).attr('id', 'typing'));
        }
        else {
            $('#typing').remove();
        }
    })

    // Recebe do servidor as informações de quando um usuário envia uma mensagem
    socket.on('chat message', function(msg){
        $('#messages').append($('<li>').text(msg));
    });

    // Recebe do servidor as informações de quando um usuário se conecta 
    socket.on('connected', function(username){
        $('#messages').append($('<li>').text(`${username} acabou de entrar no chat`).addClass('user-logged'));
    });
});