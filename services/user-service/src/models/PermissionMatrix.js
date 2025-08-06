const mongoose = require('mongoose');

const PermissionMatrixSchema = new mongoose.Schema({
    module: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    AccessPermissions: [
        {
            role: {
                type: String,
                required: true,
                trim: true
            },
            permissions: [{
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                },
                allowedFields: {
                    type: [String],
                    default: []
                },
                read: {
                    type: Boolean,
                    default: false
                },
                write: {
                    type: Boolean,
                    default: false
                },
                update: {
                    type: Boolean,
                    default: false
                },
                delete: {
                    type: Boolean,
                    default: false
                }
            }]
        }
    ],
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
});

// Indexes for better query performance
// PermissionMatrixSchema.index({ module: 1 });
PermissionMatrixSchema.index({ 'AccessPermissions.role': 1 });
PermissionMatrixSchema.index({ 'AccessPermissions.permissions.userId': 1 });

const PermissionMatrix = mongoose.model('PermissionMatrix', PermissionMatrixSchema);

module.exports = PermissionMatrix;