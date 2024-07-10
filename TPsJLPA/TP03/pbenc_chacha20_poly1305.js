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

// Derivar as chaves a partir da pass-phrase
function derivarChave(passPhrase, salt, callback) {
  const iteracoes = 100000
  const tamanhoChave = 32
  const digest = "sha256"

  crypto.pbkdf2(passPhrase, salt, iteracoes, tamanhoChave, digest, (err, derivedKey) => {
    if (err) throw err
    callback(derivedKey)
  })
}

// Função para cifrar com ChaCha20-Poly1305
function encryptChaCha20Poly1305(fich, passPhrase) {
  const salt = crypto.randomBytes(16) // Gera um salt aleatório
  derivarChave(passPhrase, salt, (key) => {
    const iv = crypto.randomBytes(12) //
    const cipher = crypto.createCipheriv("chacha20-poly1305", key, iv, { authTagLength: 16 })
    const input = fs.readFileSync(`./pbenc_chacha20_poly1305/${fich}`)
    const encrypted = cipher.update(input)
    cipher.final()
    const authTag = cipher.getAuthTag() // Obtém a tag de autenticação

    // Armazena salt, iv, conteúdo cifrado e tag de autenticação
    const output = Buffer.concat([salt, iv, encrypted, authTag])
    fs.writeFileSync(`./pbenc_chacha20_poly1305/${fich}.enc`, output)
    console.log(`${fich}.enc guardado com sucesso.`)
  })
}

// Função para decifrar com ChaCha20-Poly1305
function decryptChaCha20Poly1305(fich, passPhrase) {
  const content = fs.readFileSync(`./pbenc_chacha20_poly1305/${fich}`)
  const salt = content.subarray(0, 16)
  const iv = content.subarray(16, 28)
  const encryptedData = content.subarray(28, content.length - 16)
  const authTag = content.subarray(content.length - 16)

  derivarChave(passPhrase, salt, (key) => {
    const decipher = crypto.createDecipheriv("chacha20-poly1305", key, iv, { authTagLength: 16 })
    decipher.setAuthTag(authTag)
    const decrypted = decipher.update(encryptedData)
    decipher.final()

    fs.writeFileSync(`./pbenc_chacha20_poly1305/${fich.replace(".enc", ".dec")}`, decrypted)
    console.log(`${fich.replace(".enc", ".dec")} guardado com sucesso.`)
  })
}

// Processamento dos argumentos da linha de comando
const args = process.argv.slice(2)

if (args.length < 2) {
  console.log("------   Commands to Use   ------")
  console.log()
  console.log("node pbenc_chacha20_poly1305.js enc fich")
  console.log("node pbenc_chacha20_poly1305.js dec fich.enc>")
  process.exit(1)
}

const [cmd, fich] = args

pedirPassPhrase((passPhrase) => {
  if (cmd === "enc") {
    encryptChaCha20Poly1305(fich, passPhrase)
  } else if (cmd === "dec") {
    decryptChaCha20Poly1305(fich, passPhrase)
  } else {
    console.log("Comando não reconhecido.")
  }
})
