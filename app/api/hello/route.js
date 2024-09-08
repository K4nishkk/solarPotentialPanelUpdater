import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'js-yaml';
import { MongoClient } from 'mongodb';
import ParserFactory from '@/factory/parserFactory';
import logger from '@/util/logger';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function fetchProductLinks(productsCollectionPages, selectors) {
  try {
    const requests = productsCollectionPages.map((collectionPage) =>
      axios.get(collectionPage.url)
        .then(response => ParserFactory.extractProductLinks(response.data, collectionPage, selectors))
    );
    const productLinks = await Promise.all(requests);
    return productLinks.flat(); // Flatten array
  } catch (error) {
    throw new Error(`Failed to fetch product links: ${error.message}`);
  }
}

async function fetchProductDetails(productLinks, selectors) {
  try {
    const requests = productLinks.map((link) =>
      axios.get(link.url)
        .then(response => ParserFactory.extractProductDetails(response.data, link, selectors))
    );
    const productDetails = await Promise.all(requests);
    return productDetails;
  } catch (error) {
    throw new Error(`Failed to fetch product details: ${error.message}`);
  }
}

export async function GET() {
  logger.info("Solar Panels database update has started");

  const uri = process.env.CONNECTION_STRING;
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