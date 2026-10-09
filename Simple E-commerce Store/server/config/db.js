const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * - If MONGODB_URI is set and reachable, uses that.
 * - Otherwise, starts an in-memory MongoDB server (mongodb-memory-server)
 *   so the project works without any MongoDB installation.
 */
const connectDB = async () => {
  try {
    // Try the configured URI first
    const uri = process.env.MONGODB_URI;

    if (uri && uri !== 'your_mongodb_connection_string') {
      try {
        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000 // 5-second timeout
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return;
      } catch (err) {
        console.log(`⚠️  Could not connect to MONGODB_URI: ${err.message}`);
        console.log('   Falling back to in-memory MongoDB...');
      }
    }

    // Fallback: use in-memory MongoDB server
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri();
    const conn = await mongoose.connect(memUri);
    console.log(`✅ In-Memory MongoDB Started: ${conn.connection.host}`);
    console.log('   ℹ️  Data will be lost when the server stops.');
    console.log('   ℹ️  For persistent data, set MONGODB_URI in .env');

    // Store reference so we can clean up
    process.on('SIGINT', async () => {
      await mongod.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
