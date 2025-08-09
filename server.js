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

// Mock API endpoints to prevent console errors
app.get('/api/*', (req, res) => {
    console.log(`Mock API call: ${req.path}`);
    res.json({ 
        message: 'API connection unavailable - using development mode',
        path: req.path,
        mode: 'development'
    });
});

app.post('/api/*', (req, res) => {
    console.log(`Mock API call: ${req.path}`);
    res.json({ 
        message: 'API connection unavailable - using development mode',
        path: req.path,
        mode: 'development'
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