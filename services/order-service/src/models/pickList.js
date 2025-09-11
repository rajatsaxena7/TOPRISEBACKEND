const mongoose = require('mongoose');

const PickListSchema = new mongoose.Schema({
    linkedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    dealerId: { type: String, required: true },
    fulfilmentStaff: { type: String },
    skuList: [{
        sku: String,
        quantity: Number,
        barcode: String
    }],
    scanStatus: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
    invoiceGenerated: { type: Boolean, default: false },
    packingSlipUrl: String,
    updatedAt: Date
}, { timestamps: true });

module.exports = mongoose.models.PickList || mongoose.model('PickList', PickListSchema);
