import mongoose from "mongoose";
import { DB_URI, NODE_ENV } from "../config/env.js";

if (!DB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env<production/development>.local')
}

// Cache the connection
let cachedConnection = null;

export const connectToDatabase = async () => {
    // Return cached connection if exists
    if (cachedConnection && mongoose.connection.readyState === 1) {
        console.log('Using cached database connection');
        return cachedConnection;
    }

    try {
        // Configure for serverless
        const connection = await mongoose.connect(DB_URI, {
            serverSelectionTimeoutMS: 10000, // Increase timeout
            socketTimeoutMS: 45000,
            maxPoolSize: 10, // Limit connections for serverless
            minPoolSize: 2,
            maxIdleTimeMS: 10000,
            retryWrites: true,
            w: 'majority'
        });

        cachedConnection = connection;
        console.log(`Connected to database in ${NODE_ENV} mode`);
        return connection;
    } catch (error) {
        console.error("Database connection failed:", error);
        cachedConnection = null;
        throw error;
    }
}

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    cachedConnection = null;
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
    cachedConnection = null;
});
