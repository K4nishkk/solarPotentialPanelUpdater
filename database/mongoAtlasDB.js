import { MongoClient } from 'mongodb';

export default class MongoAtlasDB {
    static async update(productDetails) {
        const uri = process.env.MONGODB_CONNECTION_STRING;
        const client = new MongoClient(uri);

        try {
            await client.connect();
            const database = client.db('ProductDetailsDB');
            const collection = database.collection('ProductDetails');

            await collection.deleteMany({});
            await collection.insertOne({
                productDetails: productDetails,
                lastUpdated: new Date().toLocaleString()
            });
        } catch (error) {
            throw new Error(`MongoDB update failed: ${error.message}`);
        } finally {
            await client.close();
        }
    }
}
