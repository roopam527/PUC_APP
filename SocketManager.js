let onlineUsers = {};
const mongoose = require("mongoose");

const User = mongoose.model("users"); 

const AllChats = mongoose.model('allchats')
const { 
  USER_CONNECTED,
  CREATE_CHAT
  
} = require("./events");
const SocketManager = (socket)=>{
    global.socket = socket
    console.log(socket.id)
   
    socket.on(USER_CONNECTED, (userId) => {
      //const userInfo = await User.findById(userId);
      const user = createUser({  socketId:socket.id , userId});
      // io.emit(`${userId}-connected`,true)
      console.log(user)
      addUserToOnlineUsersList(user);
    });



    socket.on(CREATE_CHAT, async (recieverId) => {
      console.log("incoming")
      const users = await User.find({//Fteching All the users that are part of chat
        $or: [{ username: socket.handshake.query.user_id }, { username: recieverId }]
      });
        const chat = new AllChats({
          users:[socket.handshake.query.user_id,recieverId]
        })
        await chat.save()
        console.log("helllloooooooooo")
        
    });
    
};

/////////////////////////////////////////////////////////////////

const createUser = ({  socketId = null , userId = ""} = {}) => ({
      
      socketId,
      userId
  });

  const isUserAlreadyOnline = username => {
    return username in onlineUsers;
  };


    
  const addUserToOnlineUsersList = ({socketId,userId,activeChat=""}) => {
    if (!isUserAlreadyOnline(socketId)) {
      onlineUsers[socketId] = {userId,activeChat}
   
    }
  };

  module.exports = SocketManager
