var http = require('http'); //require属于commonjs语法，commonjs模块是对象；import是es6语法，es6模块通过export导出，import引入，不一定是对象
var fs = require('fs');
var path = require('path');
var mime = require('mime');

var chatServer = require('./chat_server');

var cache = {}; //缓存对象
//发送404
function send404(response){  
    response.writeHead(404,{'Content-Type':'text/plain'});
    response.write('Error 404: resource not found.');
    response.end();
}
// 发送文件
function sendFile(response,filePath,fileContents){
    response.writeHead(200,{
        'content-type':mime.getType(path.basename(filePath))
    });
    response.end(fileContents)
}
//静态文件
function serverStatic(response,cache,absPath){
    if(cache[absPath]){
        sendFile(response,absPath,cache[absPath]);
    }
    else{
        fs.exists(absPath,function(exists){
            if(exists){
                fs.readFile(absPath,function(err,data){
                    if(err){
                        send404(response);
                    }
                    else{
                        cache[absPath] = data;
                    }
                });
            }
            else{
                send404(response);
            }
        })
    }
}

//HTTP服务
var server = http.createServer(function(request,response){
    var filePath = false;
    if(request.url == '/'){
        filePath = 'webapp/index.html';
    }
    else{
        filePath = 'webapp'+request.url;
    }
    var absPath = './' + filePath;
    serverStatic(response,cache,absPath);
})

chatServer.listen(server);

server.listen(3000,function(){
    console.log(3000)
})