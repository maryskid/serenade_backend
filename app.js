require("dotenv").config();
require("./models/connection");

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const partnerRouter = require("./routes/partner");
const actionRouter = require("./routes/action");

var app = express();
var cors = require("cors");
var fileUpload = require("express-fileupload");

app.use(fileUpload());
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/partner", partnerRouter);
app.use("/action", actionRouter);

module.exports = app;
