require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/articles';

async function check() {
    try {
        const { data } = await axios.get(API_BASE);
        const updated = data.filter(a => a.isUpdated);
        console.log(`Total: ${data.length}`);
        console.log(`Updated: ${updated.length}`);
        updated.forEach(a => {
            console.log(`- [${a._id}] ${a.title.substring(0, 20)}... Leng: ${a.updatedContent.length}`);
        });
    } catch (err) {
        console.error(err.message);
    }
}

check();
