require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const Article = require('../backend/models/Article.js');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/beyondchats_assignment';

async function reset() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const res = await Article.updateMany({}, { $set: { isUpdated: false, updatedContent: "" } });
        console.log(`Reset ${res.modifiedCount} articles.`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

reset();
