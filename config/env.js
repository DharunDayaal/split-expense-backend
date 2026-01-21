import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || "development"}.local` })

export const {
    DB_URI,
    NODE_ENV,
    ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRES_IN,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET
} = process.env;