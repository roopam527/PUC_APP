const express = require("express");
const app = express();
const passport = require("passport");
const mongoose = require("mongoose");
const keys = require("./config/keys");
const session = require('express-session');
const MongoStore = require("connect-mongo")(session);
const bodyParser = require('body-parser');
require("./models/users");
require("./models/challenges");
require("./services/passport");



app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use('/uploads',express.static('uploads'));

mongoose.connect(keys.MONGO_URI, { useNewUrlParser: true });
mongoose.connection
  .once("open", () => console.log("Connected to MongoLab instance."))
  .on("error", error => console.log("Error connecting to MongoLab:", error));



const passport_config = require("./services/passport");
passport_config(passport);
app.use(passport.initialize());
app.use(passport.session());

mongoose.set('useFindAndModify', false);

const PORT = process.env.PORT || 8000;

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const challengeRoute = require("./routes/challengeRoutes");
app.use("/auth", authRoutes);
app.use("/user",userRoutes);
app.use("/challenge",challengeRoute)
app.listen(PORT, () => {
  console.log("Server is listening at", PORT);
});
