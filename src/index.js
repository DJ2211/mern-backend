import dotenv from "dotenv"
import connectDB from "./db/index.js"
import app from "./app.js"
dotenv.config({
  path: "./env",
})
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`App is listening on ${process.env.PORT}`)
    })
  })
  .catch((error) => {
    console.error("Error connecting to the database", error)
    process.exit(1)
  })

/*
;(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("error", (error) => {
      console.error("Error starting the server", error)
      throw error
    })

    app.listen(Process.env.PORT, () => {
      console.log(`App is listening on ${Process.env.PORT}`)
    })

    app.listen()
  } catch (error) {
    console.error("Error connecting to the database", error)
    throw error
  }
})()

*/
