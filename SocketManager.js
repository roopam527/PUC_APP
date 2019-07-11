let onlineUsers = {};

const { 
  USER_CONNECTED,
  
} = require("./events");
const SocketManager = (socket)=>{
    global.socket = socket
    console.log(socket.id)
   
    socket.on(USER_CONNECTED, async (userId) => {
      //const userInfo = await User.findById(userId);
      const user = createUser({  socketId:socket.id , userId});
      io.emit(`${userId}-connected`,true)
      addUserToOnlineUsersList(user);
     // const chatHistory = await getAllPeviousChats(userInfo.chatsIdArray);
    
    //  setUser(user, chatHistory);
    });
    };

const createUser = ({  socketId = null , userId = ""} = {}) => ({
      
      socketId,
      userId
  });

    
  const addUserToOnlineUsersList = ({socketId,userId,activeChat=""}) => {
    if (!isUserAlreadyOnline(socketId)) {
      onlineUsers[socketId] = {userId,activeChat}
   
    }
  };

  module.exports = SocketManager
