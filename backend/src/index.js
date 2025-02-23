import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import connectDB from './config/db.js';
import 'dotenv/config';
import itemRoutes from './routes/itemRoutes.js';
import industryRoutes from './routes/industryRoutes.js';

// Initialize express
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
    console.log('Request received:', {
        method: req.method,
        path: req.path,
        body: req.body
    });
    next();
});

// Routes
app.use('/api/items', itemRoutes);
app.use('/api/industry', industryRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
