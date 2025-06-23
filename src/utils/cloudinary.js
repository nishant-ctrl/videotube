import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
});
const extractPublicId = (url) => {
    const match = url.match(
        /\/upload\/(?:v\d+\/)?(.+?)\.(jpg|jpeg|png|webp|gif)$/
    );
    return match ? match[1] : null;
};

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        // console.log(
        //     "File is uploaded on Cloudinary Successfully ",
        //     response.url
        // );
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
};

const deleteFromCloudinary = async (url) => {
    try {
        const publicId = extractPublicId(url);
        if (!publicId) console.log("Error while getting");

        const response = await cloudinary.uploader.destroy(publicId);
        // console.log("Deleted");
        if(!response) console.log("Error while deleting avatar from cloudinary");
        
        return response;
    } catch (error) {
        console.log("Not deleted");
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
