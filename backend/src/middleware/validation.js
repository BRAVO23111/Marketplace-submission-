import { ethers } from 'ethers';

export const validateAddress = (req, res, next) => {
    try {
        // Check if address is in params
        if (req.params.address) {
            try {
                ethers.getAddress(req.params.address);
            } catch (error) {
                return res.status(400).json({ error: 'Invalid Ethereum address in params' });
            }
        }

        // Check if address is in body
        if (req.body.user) {
            try {
                ethers.getAddress(req.body.user);
            } catch (error) {
                return res.status(400).json({ error: 'Invalid Ethereum address in request body' });
            }
        }

        // Check if seller address is in body
        if (req.body.seller) {
            try {
                ethers.getAddress(req.body.seller);
            } catch (error) {
                return res.status(400).json({ error: 'Invalid seller Ethereum address' });
            }
        }

        // Check if buyer address is in body
        if (req.body.buyer) {
            try {
                ethers.getAddress(req.body.buyer);
            } catch (error) {
                return res.status(400).json({ error: 'Invalid buyer Ethereum address' });
            }
        }

        next();
    } catch (error) {
        console.error('Validation error:', error);
        return res.status(500).json({ error: 'Validation failed' });
    }
}; 