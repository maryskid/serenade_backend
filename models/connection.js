const mongoose = require("mongoose");

const connection_string = process.env.CONNECTION_STRING;

mongoose
  .connect(connection_string, { connectTimeoutMS: 2000 })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error(err));
