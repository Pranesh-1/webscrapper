const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const { scrapeBeyondChats } = require('../scraper/beyondchats');

// GET /api/articles - List
router.get('/', async (req, res) => {
    try {
        const articles = await Article.find().sort({ createdAt: -1 });
        res.json(articles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/articles - Create Manual (For Migration/Seeding)
router.post('/', async (req, res) => {
    try {
        const { title, content, link, pubDate } = req.body;
        // Upsert based on link to prevent duplicates
        const article = await Article.findOneAndUpdate(
            { link },
            { title, content, link, pubDate },
            { upsert: true, new: true }
        );
        res.status(201).json(article);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/articles/scrape - Trigger Scrape
router.post('/scrape', async (req, res) => {
    try {
        await scrapeBeyondChats();
        res.json({ message: 'Scraping triggered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/articles/:id - Read
router.get('/:id', async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) return res.status(404).json({ message: 'Not found' });
        res.json(article);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/articles/:id - Update (Used by automation script)
router.put('/:id', async (req, res) => {
    try {
        const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(article);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
