import * as cheerio from 'cheerio';

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

    static extractProductDetails(responseData, link, selectors) {
        const $ = cheerio.load(responseData);
        const imgSelector = $(selectors[link.site].img)

        const text = $(selectors[link.site].text).text().trim().replace(/\s+/g, ' ');
        const img = (link.site === "loomsolar") ? imgSelector.attr('data-src').replace("{width}", "600") : imgSelector.attr('src')
        const price = $(selectors[link.site].price).first().text().trim();

        return ({ text: text, img: img, price: price });
    }
}