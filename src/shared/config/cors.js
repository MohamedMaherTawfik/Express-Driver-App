const cors = require("cors");

app.use(cors({

    origin: process.env.CLIENT_URL,

    credentials: true,

    methods: ["GET","POST","PUT","PATCH","DELETE"],

    allowedHeaders: ["Content-Type","Authorization"]

}));