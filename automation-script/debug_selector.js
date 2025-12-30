const fs = require('fs');
const cheerio = require('cheerio');

try {
    const html = fs.readFileSync('bing_debug.html', 'utf8');
    const $ = cheerio.load(html);

    console.log('--- ALL Anchors ---');
    $('a').each((i, el) => {
        console.log(`Text: ${$(el).text().substring(0, 30)} | Href: ${$(el).attr('href')} | Class: ${$(el).attr('class')}`);
    });

    console.log('--- ALL H2 ---');
    $('h2').each((i, el) => {
        console.log(`Text: ${$(el).text()} | Class: ${$(el).attr('class')}`);
    });

} catch (e) {
    console.log("Error:", e.message);
}
