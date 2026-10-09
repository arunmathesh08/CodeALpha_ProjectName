const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/connecthub';
  
  try {
    // Attempt local/configured MongoDB first with a short timeout
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] Connected to MongoDB at ${primaryUri}`);
  } catch (err) {
    console.warn(`[Database] Could not connect to primary MongoDB (${err.message}).`);
    console.log('[Database] Starting in-memory MongoDB server (mongodb-memory-server)...');
    
    try {
      mongoServer = await MongoMemoryServer.create();
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[Database] In-memory MongoDB connected successfully at ${memUri}`);
    } catch (memErr) {
      console.error('[Database] Failed to initialize in-memory MongoDB:', memErr);
      process.exit(1);
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error(`[Database Error] ${err.message}`);
  });
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
