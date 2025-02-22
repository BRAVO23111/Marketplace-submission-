import mongoose from 'mongoose';

const industryProfileSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true
    },
    industryName: {
        type: String,
        required: true
    },
    industryType: {
        type: String,
        required: true,
        enum: ['Chemical', 'Manufacturing', 'Textile', 'Electronics', 'Automotive', 'Others']
    },
    location: {
        type: String,
        required: true
    },
    totalCarbonSaved: {
        type: Number,
        default: 0
    },
    transactionHistory: [{
        transactionHash: String,
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item'
        },
        role: {
            type: String,
            enum: ['buyer', 'seller']
        },
        carbonSaved: Number,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    certifications: [{
        name: String,
        issuer: String,
        validUntil: Date,
        documentUrl: String
    }],
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const IndustryProfile = mongoose.model('IndustryProfile', industryProfileSchema);

export default IndustryProfile;
