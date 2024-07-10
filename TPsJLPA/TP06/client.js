const tls = require("tls")
const fs = require("fs")
const readline = require("readline")

const options = {
  host: "localhost",
  port: 8443,
  key: fs.readFileSync("./certs/client.key"),
  cert: fs.readFileSync("./certs/client.cert"),
  ca: fs.readFileSync("./certs/ca.cert"),
  checkServerIdentity: () => {
    return null
  },
  minVersion: "TLSv1.3",
  ciphers: "TLS_CHACHA20_POLY1305_SHA256",
}

const client = tls.connect(options, () => {
  console.log("client connected", client.authorized ? "authorized" : "unauthorized")
  console.log("Cipher suite:", client.getCipher())

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "Client> ",
  })

  rl.prompt()

  rl.on("line", (line) => {
    client.write(line)
    rl.prompt()
  })

  client.on("data", (data) => {
    console.log("Received from server:", data.toString())
  })

  client.on("end", () => {
    console.log("Client connection ended")
    rl.close()
  })

  client.on("error", (error) => {
    console.error("Error:", error.message)
  })
})

client.setEncoding("utf8")
