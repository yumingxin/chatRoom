var socketio = require('socket.io');

var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

//启动socket.io服务器
exports.listen = function(server){

    io = socketio.listen(server);
    //io.set('log level',1);

    io.sockets.on('connection',function(socket){
        guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed);
        //添加用户进入聊天室
        joinRoom(socket,'Lobby');
        //处理消息
        handleMessageBroadcasting(socket,nickNames);
        //更名
        handleNameChangeAttempts(socket,nickNames,namesUsed);

        handleRoomJoining(socket);

        socket.on('room',function(){
            //socket.emit('room',io.sockets.manager.rooms);
            socket.emit('room',io.sockets.adapter.rooms);
            
        })

        handleClientDisconnection(socket,nickNames,namesUsed);
    })
}
//分配昵称
function assignGuestName(socket,guestNumber,nickNames,namesUsed){
    var name = 'Guest' + guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult',{
        success:true,
        name:name
    });
    namesUsed.push(name);
    return guestNumber + 1;
}

//进入聊天室

function joinRoom(socket,room){
    socket.join(room);
    //记录该用户（socketid）当前房间
    currentRoom[socket.id] = room;
    socket.emit('joinResult',{room:room});
    socket.broadcast.to(room).emit('message',{
        text:nickNames[socket.id] + ' has joined ' + room + '.'
    });
    //var usersInRoom = io.sockets.clients(room);
    var usersInRoom = io.sockets.adapter.rooms[room].sockets;

    if(usersInRoom.length>1){
        var usersInRoomSummary = 'Users currently in ' + room + ':' ;
        for(var index in usersInRoom){
            var userSocketId = usersInRoom[index].id;
            if(userSocketId != socket.id){
                if(index>0){
                    usersInRoomSummary += ',';
                }
                // console.log(userSocketId)
                 console.log(usersInRoom[index].id)
                usersInRoomSummary += nickNames[userSocketId];
            }
        }

        usersInRoomSummary += '.';
        socket.emit('message',{text:usersInRoomSummary});
    }
}

//昵称变更

function handleNameChangeAttempts(socket,nickNames,namesUsed){
    socket.on('nameAttempt',function(name){
        if(name.index('Guest')==0){
            socket.emit('nameResult',{
                success:false,
                message:'Names cannot begin with "Guest".'
            });
        }
        else{
            if(namesUsed.indexOf(name) == -1){
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex];
                socket.emit('nameResult',{
                    success:true,
                    name:name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message',{
                    text:previousName + ' is now known as ' + name + '.'
                });
            }
            else{
                socket.emit('nameResult',{
                    success:false,
                    message:'That name is already in use.'
                });
            }
        }
    })
}

//发送聊天消息

function handleMessageBroadcasting(socket){
    socket.on('message',function(message){
        console.log(message)
        socket.broadcast.to(message.room).emit('message',{
            text:nickNames[socket.id]+':'+message.text
        });
    });
}

//创建房间
function handleRoomJoining(socket){
    socket.on('join',function(room){
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket,room.newRoom);
    })
}

//断开连接

function handleClientDisconnection(socket){
    socket.on('disconnect',function(){
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    })
}