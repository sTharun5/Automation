const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./modules/auth/auth.routes");

const app = express();

// Trust the proxy (Render) so rate limiting works correctly
app.set("trust proxy", 1);

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.CLIENT_URL,
    process.env.CLIENT_URL?.replace(/\/$/, "") // Allow without trailing slash
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.some(allowedOrigin => {
            return origin === allowedOrigin || origin === allowedOrigin?.replace(/\/$/, "");
        });

        if (isAllowed || origin.startsWith("http://localhost:")) {
            callback(null, true);
        } else {
            console.error(`CORS Blocked for origin: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

app.use(cookieParser());

// Apply a generic rate limit to all requests
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    message: { message: "Too many requests, please try again later." }
});
app.use(globalLimiter);
app.use(express.json());
app.use("/uploads", express.static("uploads"));


app.use("/api/auth", authRoutes);

const studentRoutes = require("./modules/students/student.routes");
app.use("/api/students", studentRoutes);

const placementRoutes = require("./modules/placements/placement.routes");
app.use("/api/placements", placementRoutes);

const odRoutes = require("./modules/od/od.routes");
app.use("/api/od", odRoutes);

const adminRoutes = require("./modules/admin/admin.routes");
app.use("/api/admin", adminRoutes);

const placementStatusRoutes = require("./modules/placementStatus/placementStatus.routes");
app.use("/api/placement-status", placementStatusRoutes);

const facultyRoutes = require("./modules/faculty/faculty.routes");
app.use("/api/faculty", facultyRoutes);

const notificationRoutes = require("./modules/notification/notification.routes");
app.use("/api/notifications", notificationRoutes);

const aiRoutes = require("./modules/ai/ai.routes");
app.use("/api/ai", aiRoutes);

const calendarRoutes = require("./modules/calendar/calendar.routes");
app.use("/api/calendar", calendarRoutes);

const supportRoutes = require("./modules/support/support.routes");
app.use("/api/support", supportRoutes);

const reportRoutes = require("./modules/reports/report.routes");
app.use("/api/reports", reportRoutes);

const coordinatorRoutes = require("./modules/events/coordinator.routes");
app.use("/api", coordinatorRoutes); // Using raw /api because the routes define /events/:eventId/... internally

const eventRoutes = require("./modules/events/event.routes");
app.use("/api/events", eventRoutes);

module.exports = app;
