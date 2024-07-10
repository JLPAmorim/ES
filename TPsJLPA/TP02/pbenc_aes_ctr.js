const crypto = require("crypto")
const fs = require("fs")
const readline = require("readline")

// Pedir a pass-phrase ao utilizador
function pedirPassPhrase(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  rl.question("Introduz a pass-phrase: ", (passPhrase) => {
    rl.close()
    callback(passPhrase)
  })
}

// Derivar a chave a partir da pass-phrase
function derivarChave(passPhrase, salt, callback) {
  const iteracoes = 100000
  const tamanhoChave = 32 // Tamanho da chave AES-256 em bytes
  const digest = "sha256"

  crypto.pbkdf2(passPhrase, salt, iteracoes, tamanhoChave, digest, (err, derivedKey) => {
    if (err) throw err
    callback(derivedKey)
  })
}

// Função para cifrar com AES-CTR
function encryptAesCtr(fich, passPhrase) {
  const salt = crypto.randomBytes(16) // Gera um salt aleatório para cada cifragem
  derivarChave(passPhrase, salt, (key) => {
    const iv = crypto.randomBytes(16) // Gera um iv para AES-CTR
    const cipher = crypto.createCipheriv("aes-256-ctr", key, iv)
    const input = fs.readFileSync(`./pbenc_aes_ctr/${fich}`)
    const encrypted = Buffer.concat([salt, iv, cipher.update(input), cipher.final()])

    fs.writeFileSync(`./pbenc_aes_ctr/${fich}.enc`, encrypted)
    console.log(`${fich}.enc guardado com sucesso.`)
  })
}

// Função para decifrar com AES-CTR
function decryptAesCtr(fich, passPhrase) {
  const content = fs.readFileSync(`./pbenc_aes_ctr/${fich}`)
  const salt = content.subarray(0, 16)
  const iv = content.subarray(16, 32)
  const encryptedData = content.subarray(32)

  derivarChave(passPhrase, salt, (key) => {
    const decipher = crypto.createDecipheriv("aes-256-ctr", key, iv)
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()])

    fs.writeFileSync(`./pbenc_aes_ctr/${fich.replace(".enc", ".dec")}`, decrypted)
    console.log(`${fich.replace(".enc", ".dec")} guardado com sucesso.`)
  })
}

// Processamento dos argumentos da linha de comando
const args = process.argv.slice(2)

if (args.length < 2) {
  console.log("------   Commands to Use   ------")
  console.log()
  console.log("node pbenc_aes_ctr.js enc ficheiro")
  console.log("node pbenc_aes_ctr.js dec ficheiro.enc")
  process.exit(1)
}

const [cmd, fich] = args

pedirPassPhrase((passPhrase) => {
  if (cmd === "enc") {
    encryptAesCtr(fich, passPhrase)
  } else if (cmd === "dec") {
    decryptAesCtr(fich, passPhrase)
  } else {
    console.log("Comando não reconhecido.")
  }
})
