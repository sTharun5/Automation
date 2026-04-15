const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression");
const authRoutes = require("./modules/auth/auth.routes");

const app = express();

// Trust the proxy (Render) so rate limiting works correctly
app.set("trust proxy", 1);

/* ─── CORS origin resolver (shared between cors() and error handler) ─── */
function isAllowedOrigin(origin) {
    if (!origin) return true; // same-origin / mobile / curl
    if (origin.startsWith("http://localhost:")) return true;
    if (origin.toLowerCase().includes("vercel.app")) return true;
    const explicit = [
        process.env.CLIENT_URL,
        process.env.CLIENT_URL?.replace(/\/$/, "")
    ].filter(Boolean);
    return explicit.some(o => o === origin || o === origin.replace(/\/$/, ""));
}

const corsOptions = {
    origin: function (origin, callback) {
        if (isAllowedOrigin(origin)) return callback(null, true);
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true
};

// 1. Apply CORS to every request (including error paths)
app.use(cors(corsOptions));

// 2. Explicitly handle OPTIONS preflight for ALL routes so they always
//    get a 204 before hitting the rate limiter or any middleware.
app.options("*", cors(corsOptions));

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow file/upload serving
}));

// Gzip compress all responses
app.use(compression());

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

// Health check for early wake-up
app.get("/api/ping", (req, res) => res.status(200).json({ status: "active" }));


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
app.use("/api", coordinatorRoutes);

const eventRoutes = require("./modules/events/event.routes");
app.use("/api/events", eventRoutes);

/* ─── Global error handler — always stamp CORS headers ─── */
// This catches errors thrown by any middleware (rate limiter, auth, etc.)
// and ensures the browser receives the Access-Control-Allow-Origin header
// even on error responses, preventing false "CORS blocked" messages.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const origin = req.headers.origin;
    if (isAllowedOrigin(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin || "*");
        res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`[ERROR] ${req.method} ${req.path} →`, message);
    res.status(status).json({ message });
});

module.exports = app;

