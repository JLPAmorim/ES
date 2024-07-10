const crypto = require("crypto")
const fs = require("fs")

// Função para gerar e guardar a chave
function setup(fkey) {
  const key = crypto.randomBytes(32) // Gera uma chave de 32 bytes
  fs.writeFileSync(`./cfich_aes_cbc/${fkey}`, key)
  console.log(`Chave gerada e guardada em ${fkey}`)
}

// Função para encrypt do ficheiro
function encrypt(fich, fkey) {
  //Leitura do ficheiro
  const key = fs.readFileSync(`./cfich_aes_cbc/${fkey}`)

  // IV de 16 bytes - 4 para counter em little-endian e 12 para nonce
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv)

  const input = fs.readFileSync(`./cfich_aes_cbc/${fich}`)

  // Concatena o IV com o criptograma
  const encrypted = Buffer.concat([iv, cipher.update(input), cipher.final()])

  // Guarda o ficheiro encriptado em test_file.enc
  fs.writeFileSync(`./cfich_aes_cbc/${fich}.enc`, encrypted)
}

// Função para decrypt do ficheiro
function decrypt(fich, fkey) {
  //Leitura dos ficheiros
  const key = fs.readFileSync(`./cfich_aes_cbc/${fkey}`)
  const content = fs.readFileSync(`./cfich_aes_cbc/${fich}`)

  // Extrai IV de 16 bytes
  const iv = content.subarray(0, 16)

  // Extrai  restantes bytes a decifrar
  const encryptedData = content.subarray(16)

  // Decrypt do criptograma
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv)
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()])

  // Guarda o ficheiro pretendido
  fs.writeFileSync(`./cfich_aes_cbc/${fich}`.replace(".enc", ".dec"), decrypted)
}

// Processamento dos argumentos da linha de comando
const args = process.argv.slice(2)

switch (args[0]) {
  case "setup":
    setup(args[1])
    break
  case "enc":
    encrypt(args[1], args[2])
    break
  case "dec":
    decrypt(args[1], args[2])
    break
  default:
    console.log("------   Commands to Use   ------")
    console.log()
    console.log("node cfich_aes_cbc.js setup fkey")
    console.log("node cfich_aes_cbc.js enc fich fkey")
    console.log("node cfich_aes_cbc.js dec fich fkey")
}
