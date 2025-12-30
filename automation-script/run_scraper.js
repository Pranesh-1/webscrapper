const mongoose = require('../backend/node_modules/mongoose');
const { scrapeBeyondChats } = require('../backend/scraper/beyondchats');
require('dotenv').config({ path: '../backend/.env' });

async function run() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/beyondchats_assignment');
        console.log("Connected. Starting scraper...");

        await scrapeBeyondChats();

        console.log("Scrape finished. Disconnecting...");
    } catch (e) {
        console.error("Runner failed:", e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
