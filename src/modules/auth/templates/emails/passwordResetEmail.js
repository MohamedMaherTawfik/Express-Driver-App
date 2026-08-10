module.exports = ({ name, resetUrl }) => ({
    subject: "Reset your password",

    text: `
Hello ${name},

You requested to reset your password.

Reset your password using this link:

${resetUrl}

This link expires in 15 minutes.

If you did not request this, you can safely ignore this email.
    `.trim(),

    html: `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >
    <title>Reset Password</title>
</head>

<body style="font-family: Arial, sans-serif;">

    <h2>Hello ${name}!</h2>

    <p>
        You requested to reset your password.
    </p>

    <p>
        Click the button below to reset your password:
    </p>

    <p>
        <a href="${resetUrl}">
            Reset Password
        </a>
    </p>

    <p>
        This link expires in 15 minutes.
    </p>

    <p>
        If you did not request this, you can safely ignore this email.
    </p>

</body>

</html>
    `.trim()
});