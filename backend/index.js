require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3001;

// Middleware to parse JSON requests
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true }));

// Add basic CORS support
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE,PATCH");
        return res.status(200).json({});
    }
    next();
});

const setupSwagger = require("./swagger");
setupSwagger(app);

// Import routes
const userRoutes = require("./routes/userRoutes");
const sediRoutes = require("./routes/sediRoutes");
const spaziRoutes = require("./routes/spaziRoutes");
const disponibilitaRoutes = require("./routes/disponibilitaRoutes");


// Basic route
app.get("/", (req, res) => {
    res.send("CoWorkSpace API - CoWorkSpace Platform");
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});

// API routes
app.use("/api/users", userRoutes);
app.use("/api/sedi", sediRoutes);
app.use("/api/spazi", spaziRoutes);
app.use("/api/disponibilita", disponibilitaRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

// Start the server
app
    .listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    })
    .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.error(`Port ${port} is already in use. Try a different port.`);
        } else {
            console.error("Error starting server:", err);
        }
        process.exit(1);
    });

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});
