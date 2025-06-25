import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
});
const extractPublicId = (url) => {
    const withoutParams = url.split("?")[0]; // Remove query params
    const parts = withoutParams.split("/"); // Split by /
    const filenameWithExt = parts[parts.length - 1]; // Get 'ppqeorbdpxtbrd2qt493.avi'
    const publicId = filenameWithExt.split(".")[0]; // Get 'ppqeorbdpxtbrd2qt493'
    return publicId;
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
        if (!response)
            console.log("Error while deleting avatar from cloudinary");

        return response;
    } catch (error) {
        console.log("Not deleted");
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
