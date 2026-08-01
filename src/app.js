const express = require("express");

const bookRoutes = require("./routes/bookRoutes");
const authorsRoutes = require("./routes/authorRoutes");

const app = express();
const ApiKey = require("./middlewares/checkApiKey");
const logger = require("./middlewares/logger");
const form = require("./middlewares/upload");
const errorMiddleware  = require("./middlewares/errorMiddleware");

app.use(express.json());

app.use('/authors', logger , ApiKey , form.none());
app.use("/authors", authorsRoutes);
app.use("/books", bookRoutes);

app.use(errorMiddleware );
module.exports = app;