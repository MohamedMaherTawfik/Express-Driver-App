const { io } = require("socket.io-client");

const ACCESS_TOKEN = "PUT_YOUR_ACCESS_TOKEN_HERE";

const socket = io("http://localhost:3000", {
    auth: {
        token: ACCESS_TOKEN
    },
    transports: ["websocket"]
});

socket.on("connect", () => {
    console.log("Connected:", socket.id);
});

socket.on("connect_error", (error) => {
    console.error("Connection failed:", error.message);
});

socket.on("notification", (data) => {
    console.log("🔔 Notification received:", data);
});

socket.on("disconnect", (reason) => {
    console.log("Disconnected:", reason);
});