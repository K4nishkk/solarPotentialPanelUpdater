import axios from 'axios';
import pLimit from 'p-limit';
import path from 'path';
import yaml from 'js-yaml';
import { promises as fs } from 'fs';
import ParserFactory from '@/factory/parserFactory';
import Constant from '@/constant';

const configPath = path.join(process.cwd(), 'config/solarPanelsConfig.yaml');
const config = yaml.load(await fs.readFile(configPath, 'utf8'));
const { productsCollectionPages, selectors } = config;

export default class FetcherFactory {
    static async fetchProductLinks() {
        const limit = pLimit(Constant.MAX_CONCURRENT_REQUESTS_NUM);
        const requests = productsCollectionPages.map((collectionPage) =>
            limit(() =>
                axios.get(collectionPage.url)
                    .then(response => ParserFactory.extractProductLinks(response.data, collectionPage, selectors))
                    .catch(error => {
                        logger.error(`Failed to fetch product links from ${collectionPage.url}: ${error.message}`);
                        return [];
                    })
            )
        );

        const productLinks = await Promise.all(requests);
        return productLinks.flat();
    }

    static async fetchProductDetails(productLinks) {
        const limit = pLimit(Constant.MAX_CONCURRENT_REQUESTS_NUM);
        const requests = productLinks.map((link) =>
            limit(() =>
                axios.get(link.url)
                    .then(response => ParserFactory.extractProductDetails(response.data, link, selectors))
                    .catch(error => {
                        logger.error(`Failed to fetch details for product at ${link.url}: ${error.message}`);
                        return null;
                    })
            )
        );

        const productDetails = await Promise.all(requests);
        return productDetails.filter(detail => detail !== null);
    }
}