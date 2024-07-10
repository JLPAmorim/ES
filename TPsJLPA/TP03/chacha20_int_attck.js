const fs = require("fs")

function xorBuffers(buf1, buf2) {
  let result = Buffer.alloc(buf1.length)
  for (let i = 0; i < buf1.length; i++) {
    result[i] = buf1[i] ^ buf2[i]
  }
  return result
}

function chacha20IntAttck(fctxt, pos, ptxtAtPos, newPtxtAtPos) {
  // Lê o conteúdo do ficheiro
  const content = fs.readFileSync(`./pbenc_chacha20_poly1305/${fctxt}`)

  // Converte as strings de texto claro para buffers
  const ptxtAtPosBuffer = Buffer.from(ptxtAtPos)
  const newPtxtAtPosBuffer = Buffer.from(newPtxtAtPos)

  // Extrai o IV e os dados cifrados
  const iv = content.subarray(0, 16)
  const encryptedData = content.subarray(16)

  // Calcula a parte do fluxo de chave usada para cifrar o fragmento conhecido
  const knownCiphertextFragment = encryptedData.subarray(pos, pos + ptxtAtPosBuffer.length)
  const keyStreamFragment = xorBuffers(knownCiphertextFragment, ptxtAtPosBuffer)

  // Usa o fragmento do fluxo de chave para cifrar o novo fragmento
  const newCiphertextFragment = xorBuffers(newPtxtAtPosBuffer, keyStreamFragment)

  // Substitui o fragmento no criptograma
  const manipulatedCiphertext = Buffer.concat([encryptedData.subarray(0, pos), newCiphertextFragment, encryptedData.subarray(pos + ptxtAtPosBuffer.length)])

  // Guarda o criptograma manipulado em um novo arquivo
  fs.writeFileSync(`./pbenc_chacha20_poly1305/${fctxt}.attck`, Buffer.concat([iv, manipulatedCiphertext]))
}

// Processamento dos argumentos da linha de comando
const args = process.argv.slice(2)

if (args.length !== 4) {
  console.log("------   Commands to Use   ------")
  console.log()
  console.log("node chacha20_int_attck.js <fctxt> <pos> <ptxtAtPos> <newPtxtAtPos>")
  process.exit(1)
}

const [fctxt, pos, ptxtAtPos, newPtxtAtPos] = args
chacha20IntAttck(fctxt, parseInt(pos, 10), ptxtAtPos, newPtxtAtPos)
