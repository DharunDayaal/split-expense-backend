import multer from "multer";
import CloudinaryStorage from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "pictures",
        allowedFormats: ["jpg", "jpeg", "png", "webp", "svg"],
        transformation: [{
            width: 600,
            height: 600,
            crop: "fill"
        }],
    },
})

const upload = multer({ storage });

export const uploadImages = upload;