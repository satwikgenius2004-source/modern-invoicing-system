const express = require("express");
const Client = require("../models/Client");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE CLIENT
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { name, email, phone, billingAddress } = req.body;

        if (!name || !email || !phone || !billingAddress) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const client = await Client.create({
            name,
            email,
            phone,
            billingAddress,
            user: req.user.userId
        });

        res.status(201).json({
            message: "Client created successfully",
            client
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// GET ALL CLIENTS
router.get("/", authMiddleware, async (req, res) => {
    try {
        const clients = await Client.find({
            user: req.user.userId
        }).sort({ createdAt: -1 });

        res.status(200).json(clients);
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// UPDATE CLIENT
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const client = await Client.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user.userId
            },
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!client) {
            return res.status(404).json({
                message: "Client not found"
            });
        }

        res.status(200).json({
            message: "Client updated successfully",
            client
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// DELETE CLIENT
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const client = await Client.findOneAndDelete({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!client) {
            return res.status(404).json({
                message: "Client not found"
            });
        }

        res.status(200).json({
            message: "Client deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

module.exports = router;