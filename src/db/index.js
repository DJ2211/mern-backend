import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log(`MongoDB connected to ${DB_NAME}`)
  } catch (error) {
    console.error(`Connection ERROR FOR MONGODB: ${error}`)
    process.exit(1)
  }
}

export default connectDB
