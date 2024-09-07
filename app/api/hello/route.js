import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
export const dynamic = 'force-dynamic';

export async function GET() {
  const productsCollectionPages = [
    {
      site: "loomsolar",
      url: 'https://www.loomsolar.com/collections/solar-panels',
      selector: '.product-item__title',
      areLinksRelative: true,
      baseURL: 'https://www.loomsolar.com'
    },
    {
      site: "waaree",
      url: 'https://shop.waaree.com/solar-module/',
      selector: '.card-title a',
      areLinksRelative: false
    },
    {
      site: "upsinverter",
      url: 'https://www.upsinverter.com/product-category/solar-solutions/solar-panel/',
      selector: '.woocommerce-LoopProduct-link',
      areLinksRelative: false
    }
  ]

  const productLinks = [];

  for (const collectionPage of productsCollectionPages) {
    try {
      const response = await axios.get(collectionPage.url);
      const $ = cheerio.load(response.data);
      $(collectionPage.selector).each((index, element) => {
        const link = $(element).attr('href');
        if (link) {
          productLinks.push({
            site: collectionPage.site,
            url: collectionPage.areLinksRelative ? collectionPage.baseURL + link : link
          });
        }
      });
    }
    catch (error) {
      console.error(`Error scraping the data: ${error.message}`);
      return new Response(JSON.stringify({ error: 'Error scraping the data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const productData = [];

  const selectors = {
    loomsolar: {
      text: '.rte.text--pull',
      img: '.product-gallery__image',
      price: '.price.price--highlight'
    },
    waaree: {
      text: '.productView-info',
      img: '.productView-image--default',
      price: '.productView-price .price.price--withTax'
    },
    upsinverter: {
      text: '.woocommerce-product-details__short-description',
      img: '.wp-post-image',
      price: '.woocommerce-Price-amount.amount'
    }
  }

  for (const link of productLinks) {
    try {
      const response = await axios.get(link.url);
      const $ = cheerio.load(response.data);
      
      const rawText = $(selectors[link.site].text).text().trim();
      const text = rawText.replace(/\s+/g, ' ');

      var img;
      if (link.site === "loomsolar") {
        const unsizedImage = $(selectors[link.site].img).attr('data-src')
        img = unsizedImage.replace("{width}", "600")
      }
      else {
        img = $(selectors[link.site].img).attr('src')
      }

      const price = $(selectors[link.site].price).first().text().trim();

      productData.push({text: text, img: img, price: price});
      // const genAI = new GoogleGenerativeAI("AIzaSyAtw3N_dAJo3_zKrz7X42aaN1krTRRkxbA");
      // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
      // const prompt = "Analyse this text an write it in structured format" + text;
  
      // const result = await model.generateContent(prompt);
      // console.log(result.response.text());
    } catch (error) {
      console.error('Error:', error.message);
    }
  }

 

  return new Response(JSON.stringify({ productData }), {
    headers: { 'Content-Type': 'application/json' },
  });
}