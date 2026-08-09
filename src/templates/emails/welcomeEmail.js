const welcomeEmail = ({ name }) => {

    return {
        subject: "Welcome to our platform",

        text: `
Hello ${name},

Welcome to our platform!

Your account has been created successfully.

Best regards,
The Team
        `.trim(),

        html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
</head>

<body style="font-family: Arial, sans-serif;">

    <h2>Welcome, ${name}!</h2>

    <p>
        Your account has been created successfully.
    </p>

    <p>
        We're happy to have you with us.
    </p>

    <p>
        Best regards,<br>
        The Team
    </p>

</body>
</html>
        `.trim()
    };

};

module.exports = welcomeEmail;