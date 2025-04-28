import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS with specific origins
const allowedOrigins = [
    'https://aimarketanalyzer.netlify.app',
    'https://james-project.onrender.com',
    'http://localhost:5173'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Apply CORS middleware before routes
app.use(cors(corsOptions));

// Enable pre-flight for all routes
app.options('*', cors(corsOptions));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Chart proxy server is running' });
});

// Chart proxy endpoint
app.get('/api/chart', cors(corsOptions), async (req, res) => {
    try {
        const { interval, height, symbol } = req.query;
        
        if (!process.env.VITE_CHART_IMG_API_KEY) {
            return res.status(500).json({
                error: 'Server configuration error',
                details: 'API key not configured'
            });
        }

        // Construct the chart-img.com URL
        const chartUrl = new URL('https://api.chart-img.com/v1/tradingview/advanced-chart');
        
        // Add parameters
        chartUrl.searchParams.append('interval', interval || '4h');
        chartUrl.searchParams.append('height', height || '300');
        chartUrl.searchParams.append('symbol', symbol || 'EURUSD');
        chartUrl.searchParams.append('key', process.env.VITE_CHART_IMG_API_KEY);

        const response = await fetch(chartUrl, {
            headers: {
                'Accept': 'image/png,image/*',
                'User-Agent': 'AI Market Analyzer'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Chart API error',
                details: await response.text()
            });
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('image')) {
            return res.status(400).json({
                error: 'Invalid response',
                details: 'Expected image response'
            });
        }

        // Set CORS headers dynamically based on origin
        const requestOrigin = req.get('origin');
        if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
            res.set({
                'Access-Control-Allow-Origin': requestOrigin,
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
                'Access-Control-Max-Age': '86400',
                'Content-Type': contentType
            });
        }

        response.body.pipe(res);
    } catch (error) {
        res.status(500).json({
            error: 'Server error',
            details: error.message
        });
    }
});

// Handle all other routes for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
