//import { response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccesToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });

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
  const existedUsed = await User.findOne({
    $or: [{ email }, { username }],
  });

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
  //? send cookie

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

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true, //? now this cookie can only be modified by backend/server
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
    req.user._id, //? from auth.middleware / verify jwt
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

//? end point for refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  //? get refresh token from cookie
  const incomingRefreshTokn = req.cookies.refreshToken || req.body.refreshToken;

  //? check if refresh token is valid
  if (!incomingRefreshTokn) {
    throw new ApiError(401, "Please login first");
  }

  try {
    //? verify refresh token
    const decodedToken = jwt.verify(
      incomingRefreshTokn,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (user?.refreshToken !== incomingRefreshTokn) {
      throw new ApiError(401, "Refresh token is expired/used");
    }
    //? generate new access token
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshToken } =
      await generateAccessAndRefreshTokens(user._id);
    //? send new access token
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, newrefreshToken },
          "Access token generated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentpassword = asyncHandler(async (req, res) => {
  const { oldpassword, newpassword } = req.body;
  const user = await user.findById(req.user?.id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldpassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid password");

    user.password = newpassword;
    await user.save({ validateBeforeSave: false });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname && !email) {
    throw new ApiError(400, "Please provide fullname or email");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { fullname, email },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"));
});

const updateuserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Please provide avatar");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { avatar: avatar.url },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar updated successfully"));
});

const updateuserCoverImage = asyncHandler(async (req, res) => {
  const coverLocalPath = req.file?.path;

  if (!coverLocalPath) {
    throw new ApiError(400, "Please provide coverimage");
  }

  const CoverImages = await uploadOnCloudinary(coverLocalPath);
  if (!CoverImages.url) {
    throw new ApiError(400, "Error while uploading coverimage");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { CoverImages: CoverImages.url },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User coverImages updated successfully"));
});

const getUserChannelprofile = asyncHandler(async () => {
  const { username } = req.params;
  if (!username) {
    throw new ApiError(400, "Please provide username it's missing");
  }

  //? Pipelines
  // db.collection.aggregate([ pipelines ],options)
  const channel = await User.aggregate([
    {
      $match: username?.toLowerCase(),
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribersCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $count: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        channelSubscribersCount: 1,
        subscribersCount: 1,
        isSubscribed: 1,
        avatar: 1,
        CoverImages: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutuser,
  refreshAccessToken,
  changeCurrentpassword,
  getCurrentUser,
  updateuserAvatar,
  updateuserCoverImage,
  getUserChannelprofile,
};
