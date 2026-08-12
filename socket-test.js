const { io } = require("socket.io-client");

const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YTdiNjRmODEyODJjMzkyZGQwMzc2ZmUiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NjUxMjk3MCwiZXhwIjoxNzg2NTE2NTcwLCJhdWQiOiJzdGFydGVyLWtpdC1jbGllbnQiLCJpc3MiOiJzdGFydGVyLWtpdC1hcGkifQ.q6V7SiqMai1NIa323CTGVOZFydWvXuOAYo7IoTzamO0"

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