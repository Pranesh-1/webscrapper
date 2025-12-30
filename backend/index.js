require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const articleRoutes = require('./routes/articles');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/articles', articleRoutes);

const { scrapeBeyondChats } = require('./scraper/beyondchats');
app.post('/api/scrape', async (req, res) => {
    try {
        console.log("Manual scrape triggered via API");
        await scrapeBeyondChats();
        res.json({ success: true, message: "Scrape completed" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Database Connection
async function startServer() {
    let mongoUri = process.env.MONGODB_URI;

    // Use In-Memory DB if no URI provided or if explicitly local
    if (!mongoUri || mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost')) {
        try {
            console.log('Using In-Memory MongoDB for demo purposes...');
            const mongod = await MongoMemoryServer.create();
            mongoUri = mongod.getUri();
        } catch (e) {
            console.error("Failed to start memory server", e);
        }
    }

    try {
        await mongoose.connect(mongoUri);
        console.log(`Connected to MongoDB at ${mongoUri}`);
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
        console.error('DB Connection Error:', err);
    }
}

startServer();
