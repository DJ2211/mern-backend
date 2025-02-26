import { asyncHandler } from "../utils/asynchandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import Jwt from "jsonwebtoken"

// generate refresh and access tokens
const generateAccessandRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken }
  } catch {
    throw new ApiError(500, "Error generating refresh and access tokens")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullname } = req.body
  if (
    [fullname, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required")
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  })
  if (existedUser) {
    throw new ApiError(409, "username or email already exist")
  }
  const avatarLocalPath = req.files?.avatar[0]?.path
  let coverImageLocalPath
  if (req.files && req.files.coverImage && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar is required")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if (!avatar) {
    throw new ApiError(500, "Error uploading avatar")
  }
  const user = await User.create({
    email,
    password,
    fullname,
    avatar: avatar.url,
    coverImage: coverImage ? coverImage.url : "",
    username: username.toLowerCase(),
  })
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  if (!createdUser) {
    throw new ApiError(500, "Error creating user")
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"))
})

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body

  if (!email && !username) {
    throw new ApiError(400, "Email and username is required")
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  })

  if (!user) {
    throw new ApiError(404, "User not found")
  }
  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User credentials")
  }

  const { accessToken, refreshToken } = await generateAccessandRefreshTokens(
    user._id
  )

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  const options = {
    httpOnly: true,
    secure: true,
  }

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  )

  const options = {
    httpOnly: true,
    secure: true,
  }

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized access")

  const decodedtoken = Jwt.verify(
    imcomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  )

  const user = await User.findById(decodedtoken?._id).select("-password")

  if (!user) throw new ApiError(404, "Invalid refresh token")

  if (incomingRefreshToken !== user?.refreshToken)
    throw new ApiError(401, "Refresh token has expired")

  const options = {
    httpOnly: true,
    secure: true,
  }

  const { accessToken, newRefreshToken } = await generateAccessandRefreshTokens(
    user._id
  )

  return res
    .status(200)
    .cookie("refreshToken", newRefreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: newRefreshToken },
        "Access token refreshed successfully"
      )
    )
})

export { registerUser, loginUser, logoutUser, refreshAccessToken }
