const { getIO } = require("./socketServer");

class SocketService {

    emitToUser(userId, event, data) {
        const io = getIO();

        io.to(`user:${userId}`).emit(event, data);
    }

    emitToRoom(room, event, data) {
        const io = getIO();

        io.to(room).emit(event, data);
    }

    broadcast(event, data) {
        const io = getIO();

        io.emit(event, data);
    }
}

module.exports = new SocketService();