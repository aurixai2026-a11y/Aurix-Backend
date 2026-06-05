const { MongoClient } = require("mongodb");

const MONGO_URI =process.env.MONGODB_URI || 'mongodb+srv://bpavan422_db_user:s5mIhGPgtgF7F9TH@grozo-cluster.asew17j.mongodb.net/?appName=grozo-cluster'; // Replace with your MongoDB Atlas URI
// const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://aurixai2026_db_user:BTNNXyAiyMMOfPcb@aurix.mongodb.net/aurix?retryWrites=true&w=majority";
const DB_NAME = "aurix";

// Log connection info (mask sensitive data)
if (process.env.NODE_ENV === "production" && !process.env.MONGO_URI) {
  console.warn("⚠️  WARNING: Using default MongoDB URI. For production, set MONGO_URI environment variable.");
}

let db = null;
let client = null;

async function connectDB() {
  try {
    if (db) {
      console.log("✓ MongoDB already connected");
      return db;
    }

    client = new MongoClient(MONGO_URI, {
      maxPoolSize: 10,
      retryWrites: true,
      w: "majority"
    });

    await client.connect();
    db = client.db(DB_NAME);

    console.log("✓ Connected to MongoDB:", DB_NAME);

    // Initialize collections with indexes
    await initializeCollections();

    return db;
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error.message);
    console.error("\n🔧 Troubleshooting:");
    console.error("1. Verify MONGO_URI environment variable is set");
    console.error("2. Check MongoDB Atlas cluster is running");
    console.error("3. Verify IP whitelist includes your server's IP");
    console.error("4. Ensure cluster has public access enabled");
    console.error("5. Test connection string manually\n");
    process.exit(1);
  }
}

async function initializeCollections() {
  try {
    // Create collections if they don't exist
    const collections = ["devices", "users", "logs", "updates"];
    
    for (const collName of collections) {
      const exists = await db.listCollections({ name: collName }).hasNext();
      if (!exists) {
        await db.createCollection(collName);
        console.log(`✓ Created collection: ${collName}`);
      }
    }

    // Create indexes
    const devicesCol = db.collection("devices");
    await devicesCol.createIndex({ device_id: 1 }, { unique: true });
    await devicesCol.createIndex({ last_seen: 1 });

    const usersCol = db.collection("users");
    await usersCol.createIndex({ username: 1 }, { unique: true });

    const logsCol = db.collection("logs");
    await logsCol.createIndex({ device_id: 1 });
    await logsCol.createIndex({ created_at: 1 });
    await logsCol.createIndex({ created_at: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

    console.log("✓ MongoDB indexes created");
  } catch (error) {
    console.error("Error initializing collections:", error.message);
  }
}

function getDB() {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    console.log("✓ MongoDB connection closed");
  }
}

module.exports = {
  connectDB,
  getDB,
  closeDB
};
