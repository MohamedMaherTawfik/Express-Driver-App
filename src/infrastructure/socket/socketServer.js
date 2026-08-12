const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("../../shared/config/logger");

let io;

/*
|--------------------------------------------------------------------------
| Initialize Socket.IO
|--------------------------------------------------------------------------
*/

const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || "*",
            methods: ["GET", "POST"]
        }
    });

    /*
    |--------------------------------------------------------------------------
    | Socket Authentication
    |--------------------------------------------------------------------------
    */

    io.use((socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.replace(
                    "Bearer ",
                    ""
                );

            if (!token) {
                return next(
                    new Error("Authentication token required")
                );
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            socket.user = decoded;

            next();
        } catch (error) {
            logger.warn("Socket authentication failed", {
                socketId: socket.id,
                message: error.message
            });

            next(new Error("Invalid or expired token"));
        }
    });

    /*
    |--------------------------------------------------------------------------
    | Connection
    |--------------------------------------------------------------------------
    */

    io.on("connection", (socket) => {
        const userId = socket.user?.sub;

        logger.info("Socket client connected", {
            socketId: socket.id,
            userId
        });

        /*
        |--------------------------------------------------------------------------
        | User Room
        |--------------------------------------------------------------------------
        */

        if (userId) {
            const userRoom = `user:${userId}`;

            socket.join(userRoom);

            logger.info("Socket joined user room", {
                socketId: socket.id,
                userId,
                room: userRoom
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Disconnect
        |--------------------------------------------------------------------------
        */

        socket.on("disconnect", (reason) => {
            logger.info("Socket client disconnected", {
                socketId: socket.id,
                userId,
                reason
            });
        });
    });

    logger.info("Socket.IO initialized");

    return io;
};

/*
|--------------------------------------------------------------------------
| Get Socket.IO Instance
|--------------------------------------------------------------------------
*/

const getIO = () => {
    if (!io) {
        throw new Error(
            "Socket.IO has not been initialized"
        );
    }

    return io;
};

module.exports = {
    initializeSocket,
    getIO
};