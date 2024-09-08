import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'js-yaml';
import pLimit from 'p-limit';
import { MongoClient } from 'mongodb';
import ParserFactory from '@/factory/parserFactory';
import logger from '@/util/logger';
import Constant from '@/constant';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function fetchProductLinks(productsCollectionPages, selectors) {
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

async function fetchProductDetails(productLinks, selectors) {
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

export async function GET() {
  logger.info("Solar Panels database update has started");

  const uri = process.env.MONGODB_CONNECTION_STRING;
  const client = new MongoClient(uri);

  const configPath = path.join(process.cwd(), 'config.yaml');
  const config = yaml.load(await fs.readFile(configPath, 'utf8'));
  const { productsCollectionPages, selectors } = config;

  try {
    // Fetch product links concurrently
    logger.info("Fetching product page links...");
    const productLinks = await fetchProductLinks(productsCollectionPages, selectors);

    // Fetch product details concurrently
    logger.info("Fetching product details...");
    const productDetails = await fetchProductDetails(productLinks, selectors);

    // Update MongoDB
    logger.info("Updating database...");
    await client.connect();
    const database = client.db('ProductDetailsDB');
    const collection = database.collection('ProductDetails');
    await collection.deleteMany({});
    await collection.insertOne({
      productDetails: productDetails,
      lastUpdated: new Date().toLocaleString()
    });

    logger.info("Database update finished");
    return new Response(JSON.stringify({ productDetails }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  catch (error) {
    logger.error(error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  finally {
    await client.close();
  }
}