import { response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.moel.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //? get user details from frontend
  const { fullname, email, username, password } = req.body;
  console.log(email);

  //? validation - not empty
  //! individual validation
  // if (fullname == "") {
  //   throw new ApiError(400, "fullname is required");
  // }
  //! OR

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Please fill all fields");
  }

  //? check if user exists
  const existedUsed = User.findOne({ $or: [{ email }, { username }] });

  if (existedUsed) {
    throw new ApiError(409, "User already exists");
  }

  //? check for images, avatar
  //multer give .files object
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const CoverImagesLocalPath = req.files?.images[0]?.path;
  // check if images are uploaded
  if (!avatarLocalPath) {
    throw new ApiError(400, "Please upload avatar");
  }

  //? upload them to cloudinary avatar, images

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const CoverImages = await uploadOnCloudinary(CoverImagesLocalPath);

  if (!avatar || !CoverImages) {
    throw new ApiError(500, "Error uploading images");
  }

  //? create user object - create entery in db
  const user = await User.create({
    fullname,
    email,
    username: username.toLowerCase(),
    password,
    avatar: avatar.url,
    CoverImages: CoverImages?.url || "",
  });

  //? remove password and refresh token field from response
  const createUser = await user
    .findById(user._id)
    .select("-password -refreshToken");

  if (!createUser) {
    throw new ApiError(500, "Error creating user");
  }

  //One more way remove password and refresh token field from response

  // user.password = undefined;
  // user.refreshToken = undefined;

  //? check for user creation

  return res
    .status(201)
    .json(new ApiResponse(200, createUser, "User created successfully"));
});

export default registerUser;
