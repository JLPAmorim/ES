const forge = require("node-forge")
const fs = require("fs")
const readline = require("readline")

// Função para assinar um ficheiro
function sign(user, fich, password) {
  const privateKeyPem = fs.readFileSync(`./sig_fich/${user}.key`, "utf8")
  const certPem = fs.readFileSync(`./sig_fich/${user}.crt`, "utf8")
  let privateKey
  try {
    privateKey = forge.pki.decryptRsaPrivateKey(privateKeyPem, password)
    if (!privateKey) {
      console.error("Failed to decrypt the private key: Incorrect password.")
      return
    }
  } catch (e) {
    console.error("Failed to decrypt the private key:", e)
    return
  }

  const data = fs.readFileSync(`./sig_fich/${fich}`)
  const md = forge.md.sha256.create()
  md.update(data, "utf8")
  const signature = privateKey.sign(
    md,
    forge.pss.create({
      md: forge.md.sha256.create(),
      mgf: forge.mgf.mgf1.create(forge.md.sha256.create()),
      saltLength: 20,
    })
  )

  const signatureHex = forge.util.bytesToHex(signature)
  const output = JSON.stringify({ signature: signatureHex, certificate: certPem })
  fs.writeFileSync(`./sig_fich/${fich}.sig`, output)
  console.log(`Signed '${fich}' using '${user}' key and certificate.`)
}

// Função para verificar a assinatura de um ficheiro
function verify(fich) {
  const sigFileContent = fs.readFileSync(`./sig_fich/${fich}.sig`, "utf8")
  const { signature, certificate } = JSON.parse(sigFileContent)
  const cert = forge.pki.certificateFromPem(certificate)
  const publicKey = cert.publicKey
  const data = fs.readFileSync(`./sig_fich/${fich}`)

  const md = forge.md.sha256.create()
  md.update(data, "utf8")
  const pss = forge.pss.create({
    md: forge.md.sha256.create(),
    mgf: forge.mgf.mgf1.create(forge.md.sha256.create()),
    saltLength: 20,
  })

  const isValid = publicKey.verify(md.digest().bytes(), forge.util.hexToBytes(signature), pss)
  if (isValid) {
    console.log("The signature is valid.")
    console.log("Signatory data:", cert.subject.attributes.map((attr) => `${attr.name}: ${attr.value}`).join(", "))
  } else {
    console.log("The signature is invalid.")
  }
}

// Interface da linha de comando
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

if (process.argv.length > 2) {
  const command = process.argv[2]
  switch (command) {
    case "sign":
      if (process.argv.length === 5) {
        rl.question("Enter the private key password: ", (password) => {
          sign(process.argv[3], process.argv[4], password)
          rl.close()
        })
      } else {
        console.log("Usage: node sig_fich.js sign <user> <fich>")
        rl.close()
      }
      break
    case "verify":
      if (process.argv.length === 4) {
        verify(process.argv[3])
        rl.close()
      } else {
        console.log("Usage: node sig_fich.js verify <fich>")
        rl.close()
      }
      break
    default:
      console.log("Invalid command.")
      rl.close()
  }
} else {
  console.log("Usage: node sig_fich.js <command> [<args>]")
  rl.close()
}
