const express = require("express");
const Invoice = require("../models/Invoice");
const Client = require("../models/Client");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// CREATE INVOICE
// ==========================================
router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            invoiceNumber,
            client,
            dueDate,
            tax,
            subtotal,
            taxAmount,
            total,
            status,
            items
        } = req.body;

        // Validate required fields
        if (
            !invoiceNumber ||
            !client ||
            !dueDate ||
            subtotal === undefined ||
            taxAmount === undefined ||
            total === undefined ||
            !items ||
            items.length === 0
        ) {
            return res.status(400).json({
                message: "All required invoice fields are required"
            });
        }

        // Check client belongs to logged-in user
        const existingClient = await Client.findOne({
            _id: client,
            user: req.user.userId
        });

        if (!existingClient) {
            return res.status(404).json({
                message: "Client not found"
            });
        }

        // Check duplicate invoice number for same user
        const existingInvoice = await Invoice.findOne({
            invoiceNumber,
            user: req.user.userId
        });

        if (existingInvoice) {
            return res.status(409).json({
                message: "Invoice number already exists"
            });
        }

        // Validate invoice items
        for (const item of items) {
            if (
                !item.description ||
                item.quantity === undefined ||
                item.price === undefined
            ) {
                return res.status(400).json({
                    message: "Please complete all invoice items"
                });
            }

            if (Number(item.quantity) < 1) {
                return res.status(400).json({
                    message: "Quantity must be at least 1"
                });
            }

            if (Number(item.price) < 0) {
                return res.status(400).json({
                    message: "Price cannot be negative"
                });
            }
        }

        // Create invoice
        const invoice = await Invoice.create({
            invoiceNumber,
            client,
            user: req.user.userId,
            dueDate,
            tax: Number(tax || 0),
            subtotal: Number(subtotal),
            taxAmount: Number(taxAmount),
            total: Number(total),
            status: status || "Draft",
            items: items.map((item) => ({
                description: item.description,
                quantity: Number(item.quantity),
                price: Number(item.price)
            }))
        });

        // Populate client information
        await invoice.populate("client", "name email phone billingAddress");

        res.status(201).json({
            message: "Invoice created successfully",
            invoice
        });

    } catch (error) {
        console.error("CREATE INVOICE ERROR:", error);

        res.status(500).json({
            message: "Failed to create invoice",
            error: error.message
        });
    }
});


// ==========================================
// GET ALL INVOICES
// ==========================================
router.get("/", authMiddleware, async (req, res) => {
    try {
        const invoices = await Invoice.find({
            user: req.user.userId
        })
            .populate("client", "name email phone billingAddress")
            .sort({ createdAt: -1 });

        res.status(200).json(invoices);

    } catch (error) {
        console.error("GET INVOICES ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch invoices",
            error: error.message
        });
    }
});


// ==========================================
// GET SINGLE INVOICE
// ==========================================
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            user: req.user.userId
        }).populate(
            "client",
            "name email phone billingAddress"
        );

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        res.status(200).json(invoice);

    } catch (error) {
        console.error("GET SINGLE INVOICE ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch invoice",
            error: error.message
        });
    }
});


// ==========================================
// UPDATE INVOICE
// ==========================================
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const {
            invoiceNumber,
            client,
            dueDate,
            tax,
            subtotal,
            taxAmount,
            total,
            status,
            items
        } = req.body;

        // If client is being changed, verify ownership
        if (client) {
            const existingClient = await Client.findOne({
                _id: client,
                user: req.user.userId
            });

            if (!existingClient) {
                return res.status(404).json({
                    message: "Client not found"
                });
            }
        }

        const invoice = await Invoice.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user.userId
            },
            {
                invoiceNumber,
                client,
                dueDate,
                tax: Number(tax || 0),
                subtotal: Number(subtotal),
                taxAmount: Number(taxAmount),
                total: Number(total),
                status,
                items: items?.map((item) => ({
                    description: item.description,
                    quantity: Number(item.quantity),
                    price: Number(item.price)
                }))
            },
            {
                new: true,
                runValidators: true
            }
        ).populate(
            "client",
            "name email phone billingAddress"
        );

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        res.status(200).json({
            message: "Invoice updated successfully",
            invoice
        });

    } catch (error) {
        console.error("UPDATE INVOICE ERROR:", error);

        res.status(500).json({
            message: "Failed to update invoice",
            error: error.message
        });
    }
});


// ==========================================
// DELETE INVOICE
// ==========================================
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const invoice = await Invoice.findOneAndDelete({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        res.status(200).json({
            message: "Invoice deleted successfully"
        });

    } catch (error) {
        console.error("DELETE INVOICE ERROR:", error);

        res.status(500).json({
            message: "Failed to delete invoice",
            error: error.message
        });
    }
});


module.exports = router;
       