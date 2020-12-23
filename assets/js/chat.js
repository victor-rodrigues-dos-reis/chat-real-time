$(function () {
    let socket = io();
    let username = '';
    let typing = false; // indica se o usuário está digitando ou não
    let timeout = undefined; // guardará o timeout de digitação

    // Retorna o horário atual
    function getCurrentTime() {
        const date = new Date();

        const hours     = date.getHours().toString().length > 1    ? date.getHours()   : '0' + date.getHours();
        const minutes   = date.getMinutes().toString().length > 1  ? date.getMinutes() : '0' + date.getMinutes();

        const time = hours + ':' + minutes;

        return time;
    }

    // Gera a elemento que apresentará as mensagens enviadas e recebidas
    function generateMessageElement(liClass, username, message) {
        let messageTemplate = $('script[data-template="message"]').html();
        let newDate = new Date();

        messageTemplate = messageTemplate.replace(/{{class}}/g, liClass);
        messageTemplate = messageTemplate.replace(/{{username}}/g, username);
        messageTemplate = messageTemplate.replace(/{{message}}/g, message);
        messageTemplate = messageTemplate.replace(/{{current-time}}/g, getCurrentTime());

        return messageTemplate;
    }

    // Emite para o servidor que o usuário se conectou
    socket.emit('connected', username);

    // Evento de submit do formulário de username
    $('#form-username').submit(function(e){
        e.preventDefault();
        
        username = $('#input-username').val();

        // esconde o modal que apresenta o formulário de "cadastro" do username
        $('#modal').fadeOut();

        return false;
    });

    // Evento de submit do formulário de mensagem do chat
    $('#form-message').submit(function(e){
        e.preventDefault();

        // Monta o texto enviado com o nome do usuário remetente
        const myMessage = $('#input-message').val();

        // Emite para o servidor a mensagem que foi digitada pelo usuário remetente
        // e apresenta a mensagem digitada ao usuário remetente
        socket.emit('chat message', {message: myMessage, username: username}, myMessages(myMessage));
        stopShowTyping();

        // Limpa o input de mensagem
        $('#input-message').val('');

        return false;
    });

    // Evento input do input de mensagem
    $('#input-message').on('input', () => {
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
        const messageTemplate = generateMessageElement('my-message', username, message);

        $('#messages').append(messageTemplate);

        // dá scroll para o final da div-chat (para apresentar a ultima mensagem)
        $('#div-chat').scrollTop($('#div-chat').prop("scrollHeight")); 
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
    socket.on('chat message', function(data){
        const {username, message} = data;

        const messageTemplate = generateMessageElement('received-message', username, message);

        $('#messages').append(messageTemplate);
    });

    // Recebe do servidor as informações de quando um usuário se conecta 
    socket.on('connected', function(username){
        $('#messages').append($('<li>').text(`${username} acabou de entrar no chat`).addClass('user-logged'));
    });
});