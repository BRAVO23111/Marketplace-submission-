import mongoose from 'mongoose';
import { ethers } from 'ethers';

// Clear any existing models to prevent OverwriteModelError
if (mongoose.models.Item) {
    delete mongoose.models.Item;
}

// Validator for Ethereum addresses
const validateAddress = {
    validator: function(address) {
        try {
            return ethers.isAddress(address);
        } catch (error) {
            return false;
        }
    },
    message: props => `${props.value} is not a valid Ethereum address!`
};

// Pre-save middleware to normalize addresses
function normalizeAddress(address) {
    try {
        return address ? ethers.getAddress(address) : null;
    } catch (error) {
        return address;
    }
}

const itemSchema = new mongoose.Schema({
    tokenId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    seller: {
        type: String,
        required: true,
        validate: validateAddress,
        set: normalizeAddress
    },
    image: {
        type: String
    },
    contractProductId: {
        type: String,
        select: false
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['listed', 'sold', 'cancelled'],
        default: 'listed'
    },
    carbonFootprint: {
        newProductEmission: {
            type: Number,
            default: 0,
            min: 0
        },
        reuseSavings: {
            type: Number,
            default: 0,
            min: 0
        },
        netImpact: {
            type: Number,
            default: 0
        }
    },
    transaction: {
        hash: String,
        blockNumber: String,
        events: [{
            name: String,
            args: [mongoose.Schema.Types.Mixed]
        }]
    },
    buyer: {
        type: String,
        validate: validateAddress,
        set: normalizeAddress
    },
    soldAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    // Enable strict mode
    strict: true,
    // Add timestamps
    timestamps: true,
    // Ensure toJSON includes virtuals and transforms
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            return {
                _id: ret._id,
                tokenId: ret.tokenId,
                name: ret.name,
                description: ret.description,
                price: ret.price,
                seller: ret.seller,
                image: ret.image,
                contractProductId: ret.contractProductId,
                quantity: ret.quantity,
                status: ret.status,
                carbonFootprint: ret.carbonFootprint,
                transaction: ret.transaction,
                buyer: ret.buyer,
                soldAt: ret.soldAt,
                createdAt: ret.createdAt
            };
        }
    }
});

// Add middleware to calculate netImpact before saving
itemSchema.pre('save', function(next) {
    if (this.carbonFootprint) {
        this.carbonFootprint.netImpact = 
            (this.carbonFootprint.newProductEmission || 0) - 
            (this.carbonFootprint.reuseSavings || 0);
    }
    next();
});

// Add middleware to always include contractProductId
itemSchema.pre(/^find/, function() {
    this.select('+contractProductId');
});

// Add a pre-save hook to validate contractProductId and transaction
itemSchema.pre('save', function(next) {
    if (!this.contractProductId) {
        return next(new Error('contractProductId is required'));
    }
    if (!this.transaction || !this.transaction.hash) {
        return next(new Error('transaction details are required'));
    }
    next();
});

// Index on seller address for faster queries
itemSchema.index({ seller: 1 });

// Pre-save hook to ensure addresses are normalized
itemSchema.pre('save', function(next) {
    if (this.isModified('seller')) {
        try {
            this.seller = ethers.getAddress(this.seller);
        } catch (error) {
            next(new Error(`Invalid seller address: ${error.message}`));
            return;
        }
    }
    if (this.isModified('buyer') && this.buyer) {
        try {
            this.buyer = ethers.getAddress(this.buyer);
        } catch (error) {
            next(new Error(`Invalid buyer address: ${error.message}`));
            return;
        }
    }
    next();
});

const Item = mongoose.model('Item', itemSchema);

export default Item;
