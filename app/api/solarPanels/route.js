import logger from '@/util/logger';
import FetcherFactory from '@/factory/fetcherFactory';
import MongoAtlasDB from '@/database/mongoAtlasDB';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  logger.info("Solar Panels database update has started");

  try {
    logger.info("Fetching product page links...");
    const productLinks = await FetcherFactory.fetchProductLinks();

    logger.info("Fetching product details...");
    const productDetails = await FetcherFactory.fetchProductDetails(productLinks);

    logger.info("Updating database...");
    await MongoAtlasDB.update(productDetails);

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
}