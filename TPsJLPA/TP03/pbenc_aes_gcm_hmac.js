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
  const tamanhoChave = 32
  const digest = "sha256"

  crypto.pbkdf2(passPhrase, salt, iteracoes, tamanhoChave, digest, (err, derivedKey) => {
    if (err) throw err
    callback(derivedKey)
  })
}

// Função para cifrar com AES-GCM
function encryptAesGcm(fich, passPhrase) {
  const salt = crypto.randomBytes(16) // Gera um salt aleatório
  derivarChave(passPhrase, salt, (key) => {
    const iv = crypto.randomBytes(12) //
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
    const input = fs.readFileSync(`./pbenc_aes_gcm_hmac/${fich}`)
    const encrypted = cipher.update(input)
    cipher.final() //
    const authTag = cipher.getAuthTag() // Obtém a tag de autenticação

    // Armazena salt, IV, conteúdo cifrado e tag de autenticação
    const output = Buffer.concat([salt, iv, encrypted, authTag])
    fs.writeFileSync(`./pbenc_aes_gcm_hmac/${fich}.enc`, output)
    console.log(`${fich}.enc guardado com sucesso.`)
  })
}

// Função para decifrar com AES-GCM
function decryptAesGcm(fich, passPhrase) {
  const content = fs.readFileSync(`./pbenc_aes_gcm_hmac/${fich}`)
  const salt = content.subarray(0, 16)
  const iv = content.subarray(16, 28)
  const authTagIndex = content.length - 16
  const encryptedData = content.subarray(28, authTagIndex)
  const authTag = content.subarray(authTagIndex)

  derivarChave(passPhrase, salt, (key) => {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()])

    fs.writeFileSync(`./pbenc_aes_gcm_hmac/${fich.replace(".enc", ".dec")}`, decrypted)
    console.log(`${fich.replace(".enc", ".dec")} guardado com sucesso.`)
  })
}

// Processamento dos argumentos da linha de comando
const args = process.argv.slice(2)

if (args.length < 2) {
  console.log("------   Commands to Use   ------")
  console.log()
  console.log("node pbenc_aes_gcm_hmac.js enc <ficheiro>")
  console.log("node pbenc_aes_gcm_hmac.js dec <ficheiro.gcm>")
  process.exit(1)
}

const [cmd, fich] = args

pedirPassPhrase((passPhrase) => {
  if (cmd === "enc") {
    encryptAesGcm(fich, passPhrase)
  } else if (cmd === "dec") {
    decryptAesGcm(fich, passPhrase)
  } else {
    console.log("Comando não reconhecido.")
  }
})
