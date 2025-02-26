import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asynchandler.js"
import Jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      throw new ApiError(401, "Unauthorized access")
    }

    const decodedtoken = Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedtoken._id).select(
      "-password -refreshToken"
    )

    if (!user) {
      throw new ApiError(404, "User not found")
    }

    req.user = user
    next()
  } catch (error) {
    new ApiError(401, "Unauthorized access")
  }
})
