const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Load environment variables

const app = express();

// Middleware
app.use(cors()); // Allow frontend to talk to backend
app.use(express.json()); // Parse incoming JSON requests

// Basic API Route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
