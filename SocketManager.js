const SocketManager = (socket)=>{
    global.socket = socket
    console.log(socket.id)
   
    socket.on("new message",(name)=>{
      console.log(name);
    })
    };

      
  module.exports = SocketManager
