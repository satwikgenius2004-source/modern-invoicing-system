const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            required: true,
            trim: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            required: true,
            trim: true,
        },

        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        dueDate: {
            type: Date,
            required: true,
        },

        tax: {
            type: Number,
            default: 0,
            min: 0,
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },

        taxAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        total: {
            type: Number,
            required: true,
            min: 0,
        },

        status: {
            type: String,
            enum: ["Draft", "Sent", "Paid", "Overdue"],
            default: "Draft",
        },

        items: {
            type: [invoiceItemSchema],
            required: true,
            validate: {
                validator: (items) => items.length > 0,
                message: "Invoice must have at least one item",
            },
        },
    },
    {
        timestamps: true,
    }
);

// Invoice number unique for each user
invoiceSchema.index(
    { user: 1, invoiceNumber: 1 },
    { unique: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);