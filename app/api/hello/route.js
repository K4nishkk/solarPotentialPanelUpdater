// app/api/scrape/route.js
import axios from 'axios';
import * as cheerio from 'cheerio'; // Correct import

export async function GET() {
  const url = 'https://www.loomsolar.com/collections/solar-panels';

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data); // Use cheerio.load to parse the HTML
    const products = $('.product-item');

    const productTitles = [];

    products.each((index, product) => {
      const title = $(product).find('a.product-item__title').text().trim();
      productTitles.push(title);
    });

    // Send the scraped data back as JSON
    console.log({ titles: productTitles })
    return new Response(JSON.stringify({ titles: productTitles }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`Error scraping the data: ${error.message}`);
    return new Response(JSON.stringify({ error: 'Error scraping the data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}