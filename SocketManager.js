let onlineUsers = {};

const { 
  USER_CONNECTED,
  
} = require("./events");
const SocketManager = (socket)=>{
    global.socket = socket
    console.log(socket)
   
    socket.on(USER_CONNECTED, (userId) => {
      //const userInfo = await User.findById(userId);
      const user = createUser({  socketId:socket.id , userId});
      // io.emit(`${userId}-connected`,true)
      console.log(user)
      addUserToOnlineUsersList(user);
     // const chatHistory = await getAllPeviousChats(userInfo.chatsIdArray);

    //  setUser(user, chatHistory);
    });
    // socket.on("CREATE_CHAT",(senderId,recieverId)=>{

    // })
    };


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
