var createError = require("http-errors")
var express = require("express")
var logger = require("morgan")
var cors = require("cors")
const fs = require("fs")
const https = require("https")
const path = require("path")

var indexRouter = require("./routes/index")

const options = {
  key: fs.readFileSync("./src/certs/localhost+2-key.pem"),
  cert: fs.readFileSync("./src/certs/localhost+2.pem"),
}

var mongoose = require("mongoose")

//Criar BD e alterar url
mongoose.connect("mongodb+srv://jlupamorim:ueMr90cu096qodhG@es-cluster.ubnw59v.mongodb.net/mail?retryWrites=true&w=majority", { serverSelectionTimeoutMS: 5000 })

const db = mongoose.connection
db.on("error", console.error.bind(console, "Erro de conexão ao MongoDB..."))
db.once("open", function () {
  console.log("Conexão ao MongoDB realizada com sucesso...")
})

var app = express()

app.use(cors())
app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use("/", indexRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  if (!req.client.authorized) {
    return res.status(401).send("Client certificate is required")
  }
  next()
})

const server = https.createServer(options, app)

const PORT = process.env.PORT || 8001
server.listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`)
})
