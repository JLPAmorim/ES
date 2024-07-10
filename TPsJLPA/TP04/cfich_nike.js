const crypto = require("crypto")
const fs = require("fs")

function serializeKey(key) {
  return key.toString("base64")
}

function deserializeKey(pem, format = "base64") {
  return Buffer.from(pem, format)
}

function generateDHKeys(user) {
  const dh = crypto.createDiffieHellman(2048) // Gera parâmetros p e g
  const privateKey = dh.generateKeys()
  const publicKey = dh.getPublicKey()

  // Salva os parâmetros e as chaves
  fs.writeFileSync(`./cfich_nike/${user}.params`, JSON.stringify({ p: dh.getPrime("base64"), g: dh.getGenerator("base64") }), "utf8")
  fs.writeFileSync(`./cfich_nike/${user}.sk`, serializeKey(privateKey))
  fs.writeFileSync(`./cfich_nike/${user}.pk`, serializeKey(publicKey))
  console.log(`Keys and parameters saved for ${user}`)
}

function getSharedSecret(myPrivateKeyPEM, theirPublicKeyPEM, params) {
  const { p, g } = JSON.parse(fs.readFileSync(params, "utf8"))
  const dh = crypto.createDiffieHellman(p, "base64", g, "base64")
  dh.setPrivateKey(deserializeKey(myPrivateKeyPEM))
  const theirPublicKey = deserializeKey(theirPublicKeyPEM)
  return dh.computeSecret(theirPublicKey)
}

// Função para cifrar com AES-GCM
function encryptWithAESGCM(secret, message) {
  const iv = crypto.randomBytes(12) // AES-GCM recommends 12-byte IVs
  const cipher = crypto.createCipheriv("aes-256-gcm", secret.slice(0, 32), iv)
  let encrypted = cipher.update(message, "utf8", "hex")
  encrypted += cipher.final("hex")
  const authTag = cipher.getAuthTag().toString("hex")
  return { encrypted, iv: iv.toString("hex"), authTag }
}

// Função para decifrar com AES-GCM
function decryptWithAESGCM(secret, encryptedData) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", secret.slice(0, 32), Buffer.from(encryptedData.iv, "hex"))
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, "hex"))
  let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

// Função para cifrar mensagens
function encryptMessage(user, filePath) {
  const theirPublicKeyPEM = fs.readFileSync(`./cfich_nike/${user}.pk`, "utf8")
  const myPrivateKeyPEM = fs.readFileSync(`./cfich_nike/${user}.sk`, "utf8")
  const secret = getSharedSecret(myPrivateKeyPEM, theirPublicKeyPEM, `./cfich_nike/${user}.params`)

  console.log("Secret in Enc: " + secret.toString("base64"))
  console.log("Base64:", secret.toString("base64"))
  const message = fs.readFileSync(`./cfich_nike/${filePath}`, "utf8")
  const { encrypted, iv, authTag } = encryptWithAESGCM(secret, message)

  const outputFilePath = `./cfich_nike/${filePath}.enc`
  fs.writeFileSync(outputFilePath, JSON.stringify({ encrypted, iv, authTag }))
}

// Função para decifrar mensagens
function decryptMessage(user, encryptedFilePath) {
  const theirPublicKeyPEM = fs.readFileSync(`./cfich_nike/${user}.pk`, "utf8")
  const myPrivateKeyPEM = fs.readFileSync(`./cfich_nike/${user}.sk`, "utf8")
  const secret = getSharedSecret(myPrivateKeyPEM, theirPublicKeyPEM, `./cfich_nike/${user}.params`)

  console.log("Secret in DEC: " + secret.toString("base64"))
  const encryptedData = JSON.parse(fs.readFileSync(`./cfich_nike/${encryptedFilePath}`, "utf8"))
  const decryptedMessage = decryptWithAESGCM(secret, encryptedData)

  const outputFilePath = `./cfich_nike/${encryptedFilePath.replace(".enc", ".dec")}`
  fs.writeFileSync(outputFilePath, decryptedMessage, "utf8")
}

// Função principal para manipular a linha de comando
function main() {
  const args = process.argv.slice(2)
  const operation = args[0]

  switch (operation) {
    case "setup":
      generateDHKeys(args[1])
      break
    case "enc":
      encryptMessage(args[1], args[2])
      break
    case "dec":
      decryptMessage(args[1], args[2])
      break
    default:
      console.log("Operação desconhecida:", operation)
  }
}

main()
