//import { response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccesToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating tokens");
  }
};

//! SIGNUP LOGIC
const registerUser = asyncHandler(async (req, res) => {
  //? get user details from frontend
  const { fullname, email, username, password } = req.body;
  // console.log(email);

  //? validation - not empty
  // if (fullname == "") {
  //   throw new ApiError(400, "fullname is required");
  // }

  // OR

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Please fill all fields");
  }

  //? check if user exists
  const existedUsed = await User.findOne({ $or: [{ email }, { username }] });

  if (existedUsed) {
    throw new ApiError(409, "User already exists");
  }

  //? check for images, avatar
  //multer give .files object
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const CoverImagesLocalPath = req.files?.CoverImages[0]?.path;

  //?OR
  // let CoverImagesLocalPath;
  // if (
  //   req.files &&
  //   Array.isArray(req.files.CoverImages) &&
  //   req.files.CoverImages.length > 0
  // ) {
  //   CoverImagesLocalPath = req.files.CoverImages[0].path;
  // }

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
    CoverImages: CoverImages?.url,
  });

  //? remove password and refresh token field from response
  const createUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

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

const loginUser = asyncHandler(async (req, res) => {
  //? req data body
  //? validation
  //? username or email
  //? find the user
  //? password check
  //? acces/refresh token
  //? sen cookie

  const { username, password, email } = req.body;
  if (!username || !email) {
    throw new ApiError(400, "Please provide username or email");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = user
    .findById(user._id)
    .select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const logoutuser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "user logged out successfully"));
});
export { registerUser, loginUser, logoutuser };
