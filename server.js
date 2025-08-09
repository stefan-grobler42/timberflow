const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Health check endpoint for deployment
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'Millennium Timber Roof ERP'
    });
});

// Main route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API routes for development mode (mock endpoints)
app.get('/api/health', (req, res) => {
    res.json({ status: 'API healthy', mode: 'development' });
});

// Import database storage
const { storage } = require('./server/storage.js');

// Stock Items API Routes
app.get('/api/stock/items', async (req, res) => {
    try {
        const filters = {
            search: req.query.search,
            status: req.query.status,
            itemType: req.query.itemType
        };
        const items = await storage.getStockItems(filters);
        res.json({ success: true, data: items });
    } catch (error) {
        console.error('Failed to get stock items:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/stock/items/:id', async (req, res) => {
    try {
        const item = await storage.getStockItem(parseInt(req.params.id));
        if (!item) {
            return res.status(404).json({ success: false, error: 'Stock item not found' });
        }
        res.json({ success: true, data: item });
    } catch (error) {
        console.error('Failed to get stock item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/stock/items', async (req, res) => {
    try {
        const item = await storage.createStockItem(req.body);
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        console.error('Failed to create stock item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/stock/items/:id', async (req, res) => {
    try {
        const item = await storage.updateStockItem(parseInt(req.params.id), req.body);
        res.json({ success: true, data: item });
    } catch (error) {
        console.error('Failed to update stock item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Lookup Tables API Routes
app.get('/api/lookup/uoms', async (req, res) => {
    try {
        const uoms = await storage.getBaseUoms();
        res.json({ success: true, data: uoms });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/lookup/categories', async (req, res) => {
    try {
        const categories = await storage.getItemCategories();
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/lookup/variants', async (req, res) => {
    try {
        const variants = await storage.getVariants();
        res.json({ success: true, data: variants });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/lookup/margin-categories', async (req, res) => {
    try {
        const categories = await storage.getMarginCategories();
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/lookup/discount-categories', async (req, res) => {
    try {
        const categories = await storage.getDiscountCategories();
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fallback for other API routes
app.get('/api/*', (req, res) => {
    console.log(`API endpoint not found: ${req.path}`);
    res.status(404).json({ 
        success: false,
        error: 'API endpoint not found',
        path: req.path
    });
});

app.post('/api/*', (req, res) => {
    console.log(`API endpoint not found: ${req.path}`);
    res.status(404).json({ 
        success: false,
        error: 'API endpoint not found',
        path: req.path
    });
});

// Catch-all handler: send back index.html for any non-API routes
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
        return;
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Millennium Timber Roof ERP Server running on port ${PORT}`);
    console.log(`Server accessible at: http://0.0.0.0:${PORT}`);
    console.log(`Health check available at: http://0.0.0.0:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});