import axios from 'axios';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import { MongoClient } from 'mongodb';
import ParserFactory from '@/factory/parserFactory';
export const dynamic = 'force-dynamic';

function errorResponse(error) {
  console.error(`Error scraping the data: ${error.message}`);
  return new Response(JSON.stringify({ error: 'Error scraping the data' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET() {
  const uri = process.env.CONNECTION_STRING;
  const client = new MongoClient(uri);

  const configPath = path.join(process.cwd(), 'config.yaml');
  const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
  const { productsCollectionPages, selectors } = config;

  const productLinks = [];
  const productDetails = [];

  for (const collectionPage of productsCollectionPages) {
    try {
      const response = await axios.get(collectionPage.url);
      const links = ParserFactory.extractProductLinks(response.data, collectionPage, selectors);
      productLinks.push(...links);
    }
    catch (error) {
      return errorResponse(error);
    }
  }

  for (const link of productLinks) {
    try {
      const response = await axios.get(link.url);
      productDetails.push(ParserFactory.extractProductDetails(response.data, link, selectors))
    } catch (error) {
      return errorResponse(error)
    }
  }

  try {
    await client.connect();
    const database = client.db('ProductDetailsDB');
    const collection = database.collection('ProductDetails');
    await collection.deleteMany({});
    await collection.insertOne({ 
      productDetails: productDetails,
      lastUpdated: new Date().toLocaleString()
    });
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }

  return new Response(JSON.stringify({ productDetails }), {
    headers: { 'Content-Type': 'application/json' },
  });
}