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
function derivarChaves(passPhrase, salt, callback) {
  const iteracoes = 100000
  // Solicita bytes adicionais para dividir entre a chave de cifra e a chave HMAC
  const comprimentoTotalChaves = 64 // 32 bytes para AES-256 e 32 bytes para HMAC
  const digest = "sha256"

  crypto.pbkdf2(passPhrase, salt, iteracoes, comprimentoTotalChaves, digest, (err, derivedKeys) => {
    if (err) throw err
    // Divide o buffer derivado nas duas chaves
    const keyCifra = derivedKeys.subarray(0, 32)
    const keyHmac = derivedKeys.subarray(32, 64)
    callback(keyCifra, keyHmac)
  })
}

// Função para cifrar com AES-CTR e adicionar HMAC
function encryptAesCtrHmac(fich, passPhrase) {
  const salt = crypto.randomBytes(16) // Gera um salt aleatório para cada cifragem
  derivarChaves(passPhrase, salt, (keyCifra, keyHmac) => {
    const iv = crypto.randomBytes(16) //
    const cipher = crypto.createCipheriv("aes-256-ctr", keyCifra, iv)
    const input = fs.readFileSync(`./pbenc_aes_ctr_hmac/${fich}`)
    const encrypted = Buffer.concat([cipher.update(input), cipher.final()])

    // Gera o HMAC do conteúdo cifrado
    const hmac = crypto.createHmac("sha256", keyHmac)
    hmac.update(encrypted)
    const digest = hmac.digest()

    // Armazena salt, iv, conteúdo cifrado e HMAC
    const finalEncrypted = Buffer.concat([salt, iv, encrypted, digest])
    fs.writeFileSync(`./pbenc_aes_ctr_hmac/${fich}.enc`, finalEncrypted)
    console.log(`${fich}.enc guardado com sucesso.`)
  })
}

// Função para decifrar com AES-CTR e verificar HMAC
function decryptAesCtrHmac(fich, passPhrase) {
  const content = fs.readFileSync(`./pbenc_aes_ctr_hmac/${fich}`)
  const salt = content.subarray(0, 16)
  const iv = content.subarray(16, 32)
  const hmacIndex = content.length - 32 // HMAC SHA-256 tem 32 bytes
  const encryptedData = content.subarray(32, hmacIndex)
  const receivedHmac = content.subarray(hmacIndex)

  derivarChaves(passPhrase, salt, (keyCifra, keyHmac) => {
    // Verifica o HMAC
    const hmac = crypto.createHmac("sha256", keyHmac)
    hmac.update(encryptedData)
    const recalculatedHmac = hmac.digest()

    if (!crypto.timingSafeEqual(receivedHmac, recalculatedHmac)) {
      console.log("Falha na verificação do HMAC. Os dados podem ter sido alterados.")
      return
    }

    // Decifra os dados
    const decipher = crypto.createDecipheriv("aes-256-ctr", keyCifra, iv)
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()])
    fs.writeFileSync(`./pbenc_aes_ctr_hmac/${fich.replace(".enc", ".dec")}`, decrypted)
    console.log(`${fich.replace(".enc", ".dec")} guardado com sucesso.`)
  })
}

// Processamento dos argumentos da linha de comando
const args = process.argv.slice(2)

if (args.length < 2) {
  console.log("------   Commands to Use   ------")
  console.log()
  console.log("node pbenc_aes_ctr_hmac.js enc fich")
  console.log("node pbenc_aes_ctr_hmac.js dec fich.enc")
  process.exit(1)
}

const [cmd, fich] = args

pedirPassPhrase((passPhrase) => {
  if (cmd === "enc") {
    encryptAesCtrHmac(fich, passPhrase)
  } else if (cmd === "dec") {
    decryptAesCtrHmac(fich, passPhrase)
  } else {
    console.log("Comando não reconhecido.")
  }
})
