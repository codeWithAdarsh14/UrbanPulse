/**
 * MongoDB Atlas connection configuration
 * Connects via Mongoose. Never logs the connection string.
 */
require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');

// Optional: override OS DNS servers via DNS_SERVERS env var (comma-separated IPs).
// If DNS_SERVERS is absent or empty, the OS default DNS configuration is used.
const rawDnsServers = process.env.DNS_SERVERS;
if (rawDnsServers && rawDnsServers.trim()) {
  const servers = rawDnsServers.split(',').map((s) => s.trim()).filter(Boolean);
  if (servers.length > 0) {
    dns.setServers(servers);
  }
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not defined. Add it to your .env file before starting the server.'
    );
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB Atlas connected successfully.');
  } catch (err) {
    // Re-throw with a plain message; never surface the URI in the error.
    throw new Error(`MongoDB connection failed: ${err.message}`);
  }
};

module.exports = { connectDB };
