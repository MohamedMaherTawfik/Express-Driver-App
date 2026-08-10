const emailQueue = require("./emailQueue");

const addEmailJob = async ({
    to,
    subject,
    text,
    html,
    delay = 0,
    priority = 0
}) => {

    return await emailQueue.add(
        "send-email",
        {
            to,
            subject,
            text,
            html
        },
        {
            delay,
            priority
        }
    );
};

module.exports = {
    addEmailJob
};