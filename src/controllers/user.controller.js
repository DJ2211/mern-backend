import { asyncHandler } from "../utils/asynchandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullname } = req.body
  if (
    [fullname, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required")
  }
  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  })
  if (existedUser) {
    throw new ApiError(409, "username or email already exist")
  }
  const avatarLocalPath = req.files?.avatar[0]?.path
  const coverImageLocalPath = req.files?.coverImage[0]?.path
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
    coverImage: coverImage ? url : "",
    username: username.toloLowerCase(),
  })
  const createdUser = await user
    .findById(user._id)
    .select("-password -refreshToken")
  if (!createdUser) {
    throw new ApiError(500, "Error creating user")
  }
  return res.this
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered successfully"))
})

export { registerUser }
