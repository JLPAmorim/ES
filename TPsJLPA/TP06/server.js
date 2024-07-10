const tls = require("tls")
const fs = require("fs")
const readline = require("readline")

const options = {
  key: fs.readFileSync("./certs/server.key"),
  cert: fs.readFileSync("./certs/server.cert"),
  ca: fs.readFileSync("./certs/ca.cert"),
  requestCert: true,
  rejectUnauthorized: true,
  minVersion: "TLSv1.3",
  ciphers: "TLS_CHACHA20_POLY1305_SHA256",
}

const server = tls.createServer(options, (socket) => {
  console.log("server connected", socket.authorized ? "authorized" : "unauthorized")
  console.log("Cipher suite:", socket.getCipher())

  // Set up readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "Server> ",
  })

  rl.prompt()

  rl.on("line", (line) => {
    socket.write(line)
    rl.prompt()
  })

  socket.on("data", (data) => {
    console.log("Received from client:", data.toString())
  })

  socket.on("end", () => {
    console.log("Server connection ended")
    rl.close()
  })

  socket.on("error", (error) => {
    console.error("Error:", error.message)
  })
})

server.listen(8443, () => {
  console.log("Server listening on port 8443")
})
