const notificationService = require("../services/notificationService");

const sendTestNotification = async (req, res) => {
    const userId = req.user.id;

    notificationService.sendToUser(userId, {
        type: "test",
        title: "Test Notification",
        message: "Socket.IO is working successfully 🚀"
    });

    return res.status(200).json({
        success: true,
        message: "Notification sent successfully"
    });
};

module.exports = {
    sendTestNotification
};