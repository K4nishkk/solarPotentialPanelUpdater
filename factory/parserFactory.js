import * as cheerio from 'cheerio';
// import { GoogleGenerativeAI } from '@google/generative-ai';

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
        const imgSelector = $(selectors[link.site].img)

        const text = $(selectors[link.site].text).text().trim().replace(/\s+/g, ' ');
        const img = (link.site === "loomsolar") ? imgSelector.attr('data-src').replace("{width}", "600") : imgSelector.attr('src')
        const price = $(selectors[link.site].price).first().text().trim();

        // const genAI = new GoogleGenerativeAI(process.env.API_KEY);
        // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // const prompt = "Write a story about a magic backpack.";

        // const result = await model.generateContent(prompt);
        // console.log(result.response.text());

        return ({ text: text, img: img, price: price, link: link.url });
    }
}