const express = require("express");

const bookRoutes = require("./routes/bookRoutes");
const authorsRoutes = require("./routes/authorRoutes");

const app = express();

app.use(express.json());

app.use("/books", bookRoutes);
app.use("/authors", authorsRoutes);

module.exports = app;