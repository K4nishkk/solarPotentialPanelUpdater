import axios from 'axios';
import * as cheerio from 'cheerio';
export const dynamic = 'force-dynamic';

export async function GET() {
  const url1 = 'https://www.loomsolar.com/collections/solar-panels';
  const url2 = 'https://shop.waaree.com/solar-module/';
  const url3 = 'https://www.upsinverter.com/product-category/solar-solutions/solar-panel/';

  try {
    const productLinks = [];

    const response1 = await axios.get(url1);
    const data1 = cheerio.load(response1.data);
    data1('.product-item__title').each((index, element) => {
      const link = data1(element).attr('href');  // Extract the href attribute
      if (link) {
        productLinks.push("https://www.loomsolar.com" + link);  // Add to the list if href exists
      }
    });

    const response2 = await axios.get(url2);
    const data2 = cheerio.load(response2.data);
    data2('.card-title a').each((index, element) => {
      const link = data2(element).attr('href');  // Extract the href attribute
      if (link) {
        productLinks.push(link);  // Add to the list if href exists
      }
    });

    const response3 = await axios.get(url3);
    const data3 = cheerio.load(response3.data);
    data3('.woocommerce-LoopProduct-link').each((index, element) => {
      const link = data3(element).attr('href');  // Extract the href attribute
      if (link) {
        productLinks.push(link);  // Add to the list if href exists
      }
    });
    
    console.log({ links: productLinks })
    return new Response(JSON.stringify({ links: productLinks }), {
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