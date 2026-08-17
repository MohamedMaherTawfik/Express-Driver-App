const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const rateLimiter = require("./shared/middlewares/rateLimiter");
const apiKey = require("./shared/middlewares/checkApiKey");
const upload = require("./shared/middlewares/upload");
const errorMiddleware = require("./shared/middlewares/errorMiddleware");
const NotFoundError = require("./shared/errors/NotFoundError");
const authRoutes = require("./modules/auth/routes/authRoutes");
const userRoutes = require("./modules/users/routes/userRoutes");
const healthRoutes = require("./shared/routes/healthRoutes");
const driverRoutes = require("./modules/drivers/routes/driverRoutes");
const driverApplicationRoutes = require("./modules/driverApplications/routes/driverApplicationRoutes");
const vehicleRoutes = require("./modules/vehicles/routes/vehicleRoutes");
const requestLogger = require("./shared/middlewares/requestLogger");
const app = express();
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");
const notificationRoutes = require("./modules/notifications/routes/notificationRoutes");

/* ===========================
        App Settings
=========================== */

app.disable("x-powered-by");
app.set("trust proxy", 1);

/* ===========================
      Global Middlewares
=========================== */

app.use(helmet());

app.use(compression());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(rateLimiter);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(hpp());

app.use(requestLogger);

/* ===========================
        Static Files
=========================== */
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

app.use("/uploads", express.static("src/uploads"));

/* ===========================
            Routes
=========================== */

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use("/health", healthRoutes);

app.use(
    "/api/notifications",
    notificationRoutes
);

app.use(
    "/api/drivers",
    driverRoutes
);

app.use(
    "/api/driver-applications",
    driverApplicationRoutes
);

app.use(
    "/api/vehicles",
    vehicleRoutes
);
/* ===========================
        404 Handler
=========================== */

app.use((req, res, next) => {
    next(new NotFoundError("Route"));
});

/* ===========================
    Global Error Handler
=========================== */

app.use(errorMiddleware);

module.exports = app;