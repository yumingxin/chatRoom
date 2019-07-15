//非受信内容
function divEscapedContentElement(message){
    return $('<div></div>').text(message);
}
//受信内容
function divSystemContentElement(message){
    return $('<div></div>').html('<li>'+message+'</li>');
}
//处理原始输入
function processUserInput(chatApp,socket){
    var message = $("#send-message").val();
    var systemMessage;
    if(message[0]=='/'){
        systemMessage = chatApp.processCommand(message);
        if(systemMessage){
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    }
    else{
        chatApp.sendMessage($('#room').text(),message);
        $('#messages').append(divEscapedContentElement(message));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }
    $('#send-message').val('');
}
//初始化

var socket = io.connect('ws://localhost:3000');

$(document).ready(function(){
    var chatApp = new Chat(socket);
    socket.on('nameResult',function(result){
        var message;

        if(result.success){
            message = 'You are known as ' + result.name +'.'
        }
        else{
            message = result.message;
        }
        $('#message').append(divSystemContentElement(message));
    });
    socket.on('joinResult',function(result){
        $('#room').text(result.room);
        $("#messages").append(divSystemContentElement('room changed.'));
    });
    socket.on('message',function(message){
        var newElement = $('<div></div>').text(message.text);
        $('#messages').append(newElement);
    });
    socket.on('rooms',function(rooms){
        $('#room-list').empty();
        for(var room in rooms){
            room = room.substring(1,room.length);
            if(room != ''){
                $("room-list").append(divEscapedContentElement(room));
            }
        }
        $('#room-list div').click(function(){
            chatApp.processCommand('/join'+$(this).text());
            $('#send-message').focus();
        });
    });
    setInterval(function(){
        socket.emit('room');
    },1000);

    $('#send-message').focus();

    $('#send-form').submit(function(e){
        e.preventDefault();
        processUserInput(chatApp,socket);
        return false;
    });
});