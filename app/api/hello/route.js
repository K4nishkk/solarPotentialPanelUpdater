import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import yaml from 'js-yaml';
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
  const config = yaml.load(fs.readFileSync('./config.yaml', 'utf8'));
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
      // const genAI = new GoogleGenerativeAI("AIzaSyAtw3N_dAJo3_zKrz7X42aaN1krTRRkxbA");
      // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
      // const prompt = "Analyse this text an write it in structured format" + text;
  
      // const result = await model.generateContent(prompt);
      // console.log(result.response.text());
    } catch (error) {
      return errorResponse(error)
    }
  }

  return new Response(JSON.stringify({ productDetails }), {
    headers: { 'Content-Type': 'application/json' },
  });
}