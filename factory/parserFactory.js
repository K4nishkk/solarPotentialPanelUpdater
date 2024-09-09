import * as cheerio from 'cheerio';
import logger from '@/util/logger';
import Constant from '@/constant';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKeys = [
    process.env.GEMINI_API_KEY1,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY3,
    process.env.GEMINI_API_KEY4,
    process.env.GEMINI_API_KEY5,
    process.env.GEMINI_API_KEY6
]

let currentKeyIndex = 0;

function getNextApiKey() {
    const apiKey = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    return apiKey;
}

export default class ParserFactory {
    static extractProductLinks(responseData, collectionPage, selectors) {
        const $ = cheerio.load(responseData);
        const links = [];
        $(selectors[collectionPage.site].collectionPage).each((index, element) => {
            const link = $(element).attr('href');
            if (link) {
                links.push({
                    site: collectionPage.site,
                    url: collectionPage.areLinksRelative ? collectionPage.baseURL + link : link
                });
            }
        });
        return links;
    }

    static async extractProductDetails(responseData, link, selectors) {
        const $ = cheerio.load(responseData);
        const imgSelector = $(selectors[link.site].img);

        const rawText = $(selectors[link.site].text).text().trim().replace(/\s+/g, ' ');
        const img = (link.site === "loomsolar") ? imgSelector.attr('data-src').replace("{width}", "600") : imgSelector.attr('src');
        const price = $(selectors[link.site].price).first().text().trim();
    
        const prompt = `
          "${rawText}"
          Generate an array of two pure JSON objects with no formatting seperated by comma:
          1. First: powerOutput, efficiency, durability/warranty, dimensions, and one miscellaneous sentence.
          2. Second: all information as key-value pairs.
        `;
    
        let retries = Constant.MAX_REQUEST_RETRIES_COUNT;
    
        while (retries > 0) {
          const apiKey = getNextApiKey();
          try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
            const result = await model.generateContent(prompt);

            const parsedText = result.response.candidates[0].content.parts[0].text.replace(/```json\n|```|\u003E /g, '').trim();
            const jsonText = JSON.parse((parsedText[0] === "[") ? parsedText : "[" + parsedText + "]");
            return { text: jsonText, img: img, price: price, link: link.url };
          }
          catch (error) {
            logger.error(`Error with API key ${currentKeyIndex}: ${error.message}`);
            if (error.response && error.response.status === 429) {
              logger.error(`Rate limit exceeded for API key: ${currentKeyIndex}, switching to next key...`);
            }
            else if (error.response && error.response.status === 503) {
              logger.error(`Service unavailable for API key: ${currentKeyIndex}, switching to next key...`)
            }
            else {
              throw new Error(`Failed to extract details with API key ${currentKeyIndex}: ${error.message}`);
            }
          }
    
          retries--;
        }

        throw new Error('All API keys exhausted or failed.');
      }
}