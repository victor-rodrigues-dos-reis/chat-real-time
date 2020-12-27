$(function () {
    let socket = io();
    let username = '';
    let typing = false; // indica se o usuário está digitando ou não
    let timeout = undefined; // guardará o timeout de digitação

    // Troca caracteres que podem ser interpretado como "comandos" HTML
    String.prototype.escape = function() {
        // caracteres que serão trocados
        var tagsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        };

        // retorna a string já com os caracteres trocados
        return this.replace(/[&<>]/g, function(tag) {
            return tagsToReplace[tag] || tag;
        });
    };

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

    // Evento de submit do formulário de username
    $('#form-username').submit(function(e){
        e.preventDefault();
        
        // Salva o conteúdo do input username e remove os espaços em branco no inicio e no final da string
        username = $('#input-username').val().trim();

        // Verifica se foi digitado um nome que não seja apenas espaços em branco
        if (username) {
            // Emite para o servidor que o usuário se conectou
            socket.emit('connected', username);

            // esconde o modal que apresenta o formulário de "cadastro" do username
            $('#modal').fadeOut();
        }

        return false;
    });

    // Evento de submit do formulário de mensagem do chat
    $('#form-message').submit(function(e){
        e.preventDefault();

        // Monta o texto enviado com o nome do usuário remetente
        const myMessage = $('#input-message').html();

        // Emite para o servidor a mensagem que foi digitada pelo usuário remetente
        // e apresenta a mensagem digitada ao usuário remetente
        socket.emit('chat message', {message: myMessage, username: username}, myMessages(myMessage));
        stopShowTyping();

        // Limpa o "input" de mensagem
        $('#input-message').html('');

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

    // Trata o conteúdo colado no "input" de mensagem
    $("#input-message").on('paste', function(event) {
        // recebe o valor do clipboard
        var pastedData = event.originalEvent.clipboardData.getData('text');
        pastedData = pastedData.trim();     // remove os espaços em branco no inicio e no final da strig
        pastedData = (pastedData).escape(); // troca os caracteres que poder ser interpretados como "comandos" HTML
        pastedData = pastedData.replace(/\n/g, "<br />"); // troca as quebras de linha por <br>
        
        // passa para o "input" de mensagem a string já tratada
        $(this).html(pastedData);

        event.preventDefault();
    });

    // Ao clicar no botão de enviar: não permite que envie a mensagem caso o "input" esteja vazio
    $("#form-message button").click(function(event) {


        // verifica se o "input" de mensagem está vazio
        if (!$('#input-message').text().trim()) {
            $('#input-message').html('');
            event.preventDefault();
        }
    });

    // Verifica se o input está vazio quando "desfocado"
    $("#input-message").focusout(function(){
        var element = $(this);

        // Se o input tiver apenas espaços em branco limpa o input
        if (!element.text().trim()) {
            element.html('');
        }
    });

    // Realiza verificações nas teclas digitadas no input de mensagem
    $("#input-message").keydown(function(event){
        const inputContent = $(this).text().trim();

        // Se for pressionado shift + enter: pula linha
        if( event.which === 13 && event.shiftKey ) {
            // Se o input estiver vazio não permitir pular linha
            if (!inputContent)
                event.preventDefault();
            
        }
        // Se  for pressionado espace: adiciona espaço
        else if (event.which === 32) {
            // Se o input estiver vazio não permitir adicionar espaço
            if (!inputContent) {
                event.preventDefault();
                return;
            }
        }
        // Se for pressionado enter: envia o formulário
        else if (event.which === 13) {
            // se o input estiver vazio não permitir enviar formulário
            if (!inputContent) {
                event.preventDefault();
                return;
            }

            // dispara o evento de submit
            $('#form-message').submit();
        }
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
            $('#show-typing').slideDown();
            $('#show-typing').text(`${user} está digitando ...`);
        }
        else {
            $('#show-typing').slideUp();
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

    // Recebe do servidor as informações de quando um usuário se desconecta 
    socket.on('disconnect', function(username){
        $('#messages').append($('<li>').text(`${username} acabou de sair do chat`).addClass('user-disconnected'));
    });
});