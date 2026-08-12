const { io } = require("socket.io-client");

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YTdiNjRmODEyODJjMzkyZGQwMzc2ZmUiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NjU1NDM1MiwiZXhwIjoxNzg2NTU3OTUyLCJhdWQiOiJzdGFydGVyLWtpdC1jbGllbnQiLCJpc3MiOiJzdGFydGVyLWtpdC1hcGkifQ.rxnfawqFcEwqYkDNP7EgKql2TUti79lxIrEWs9B0DPI";

const socket = io("http://localhost:3000", {
    auth: {
        token
    },
});

socket.on("connect", () => {
    console.log("Connected:", socket.id);
});

socket.on("notification", (notification) => {
    console.log("🔔 NOTIFICATION RECEIVED:");
    console.dir(notification, { depth: null });
});

socket.on("connect_error", (error) => {
    console.error("Connection failed:", error.message);
});

socket.on("disconnect", (reason) => {
    console.log("Disconnected:", reason);
});