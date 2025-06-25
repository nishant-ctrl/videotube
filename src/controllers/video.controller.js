import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination
    const filter = {};
    if (query) {
        filter.title = { $regex: query, $options: "i" };
    }
    if (userId) {
        filter.owner = userId;
    }

    const sortOptions = {};
    if (sortBy) {
        sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
    }

    const videos = await Video.find(filter)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const total = await Video.countDocuments(filter);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                total,
                page: Number(page),
                limit: Number(limit),
            },
            "Videos fetched successfully"
        )
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video
    if (!(title && description))
        throw new ApiError(400, "Title and description is reequired");
    const videoLocalPath = req.files.videoFile[0]?.path;
    if (!videoLocalPath) throw new ApiError(400, "Video file is required");
    const thumbnailLocalPath = req.files.thumbnail[0]?.path;
    if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail is required");

    const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!uploadedVideo || !uploadedThumbnail)
        throw new ApiError(400, "Video and thumbnail is required");

    const video = await Video.create({
        videoFile: uploadedVideo.url,
        thumbnail: uploadedThumbnail.url,
        title: title,
        description: description,
        duration: uploadedVideo.duration,
        owner: req.user._id,
    });
    // console.log(uploadedVideo);
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id
    if (!videoId) throw new ApiError(400, "Video id is required");
    if (!mongoose.Types.ObjectId.isValid(videoId))
        throw new ApiError(404, "Video not found");
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(400, "Video does not exist");
    res.status(200).json(
        new ApiResponse(
            200,
            { video: video.videoFile },
            "Video fetched successfully"
        )
    );
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail
    if (!videoId) throw new ApiError(400, "Video id is required");
    if (!mongoose.Types.ObjectId.isValid(videoId))
        throw new ApiError(404, "Video not found");
    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;
    if (!(title && description))
        throw new ApiError(400, "Title and desscription is required");
    if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail is required");

    const newUploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!newUploadedThumbnail)
        throw new ApiError(500, "Error while updating thumbnail on cloudinary");
    const oldVideo = await Video.findById(videoId);
    // console.log("Old VIDEO",oldVideo);

    await deleteFromCloudinary(oldVideo.thumbnail);

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: newUploadedThumbnail?.url,
            },
        },
        {
            new: true,
        }
    );
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: delete video
    if (!videoId) throw new ApiError(400, "Video id is required");
    if (!mongoose.Types.ObjectId.isValid(videoId))
        throw new ApiError(404, "Video not found");
    const oldVideo = await Video.findById(videoId);

    await Video.findByIdAndDelete(videoId);
    await deleteFromCloudinary(oldVideo.thumbnail);
    await deleteFromCloudinary(oldVideo.videoFile);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) throw new ApiError(400, "Video id is required");
    if (!mongoose.Types.ObjectId.isValid(videoId))
        throw new ApiError(404, "Video not found");
    const oldVideo = await Video.findById(videoId);
    const isPublished = oldVideo.isPublished;
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !isPublished,
            },
        },
        {
            new: true,
        }
    );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Video publishment toggled successfully"
            )
        );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
