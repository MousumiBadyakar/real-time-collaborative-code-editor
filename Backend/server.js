import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import { YSocketIO } from "y-socket.io/dist/server"

const app = express()
app.use(express.static("public"))

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

const ySocketIO = new YSocketIO(io)

let sharedLanguage = "javascript"

ySocketIO.on("document-loaded", (doc) => {
  const yText = doc.getText("monaco")

  if (yText.length === 0) {
    yText.insert(0, 'console.log("Hello from CodeCollab!");')
  }
})

ySocketIO.initialize()

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.emit("editor:language", sharedLanguage)

  socket.on("editor:language", (language) => {
    sharedLanguage = language
    io.emit("editor:language", language)
  })

  socket.on("chat:message", (message) => {
    io.emit("chat:message", message)
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

app.get("/health", (req, res) => {
  res.status(200).json({
    message: "ok",
    success: true
  })
})

httpServer.listen(3000, () => {
  console.log("Server is running on port 3000")
})