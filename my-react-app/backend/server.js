const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const clientRoutes = require("./routes/ClientRoutes");
const invoiceRoutes = require("./routes/InvoiceRoutes");
const authRoutes = require("./routes/AuthRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Invoice Pro Backend is running"
    });
});

app.use("/api/clients", clientRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/auth", authRoutes);

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.log("MongoDB connection error:", error.message);
    });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});