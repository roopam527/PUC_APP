const express = require("express");
const app = express();
const passport = require("passport");
const mongoose = require("mongoose");
const keys = require("./config/keys");
const socket = require("socket.io");
var server = require("http").Server(app);
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const bodyParser = require("body-parser");

//const http = http.createServer(app);
//const io = socket.io(server);

// let usersockets = {};

// io.on("connection", socket => {
//   console.log("New socket formed with id:" + socket.id);
//   socket.emit("connected");
//   usersockets[data.user] = socket.id;
//   socket.on("login", data => {
//     io.emit("online", data.user);
//   });
// });
require("./models/users");

require("./models/allchats");
require("./models/messages");
require("./models/doneChallenge");
require("./models/challenges");
require("./services/passport");

var io = (module.exports.io = require("socket.io")(server));

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());

//app.get("/uploads", express.static("uploads"));
app.use("/uploads", express.static("uploads"));
app.use('/uploads/challenge_pics', express.static('uploads/challenge_pics'));

mongoose.connect(keys.MONGO_URI, { useNewUrlParser: true });
mongoose.connection
  .once("open", () => console.log("Connected to MongoLab instance."))
  .on("error", error => console.log("Error connecting to MongoLab:", error));

const passport_config = require("./services/passport");

passport_config(passport);
app.use(passport.initialize());
app.use(passport.session());

mongoose.set("useFindAndModify", false);

const PORT = process.env.PORT || 8000;

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const challengeRoute = require("./routes/challengeRoutes");
const postRoute = require("./routes/post");
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/challenge", challengeRoute);
app.use("/post", postRoute);
app.get("/", (req, res) => {
  res.send("Chat Server is running on port 8000");
});
// app.listen(PORT, () => {
//   console.log("Server is listening at", PORT);
// });

server.listen(PORT, () => {
  console.log("Server is started!");
});

const SocketManger = require("./SocketManager");
io.on("connection", SocketManger);

// io.on("connect", (socket)=>{
//     global.socket = socket
//     console.log(connected",socket.id)

//     socket.on("new message",(name)=>{
//       console.log(name);
//     })
//     }
// )