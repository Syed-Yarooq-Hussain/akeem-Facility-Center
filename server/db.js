import { MongoClient } from 'mongodb';

let clientPromise;
export async function getDatabase() {
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('USERNAME:PASSWORD')) {
    const error = new Error('Database is not configured'); error.status = 503; throw error;
  }
  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000, maxPoolSize: 5 });
    clientPromise = client.connect().catch(error => { clientPromise = undefined; throw error; });
  }
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || 'williams_facility');
}
