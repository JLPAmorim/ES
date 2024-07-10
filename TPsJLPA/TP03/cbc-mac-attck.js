const crypto = require("crypto")

function cbcmac_auth(m_bytes, k) {
  // CBC mode requires padding
  const padder = crypto.createCipheriv("aes-256-cbc", k, Buffer.alloc(16, 0))
  let padded_m = padder.update(m_bytes)
  padded_m = Buffer.concat([padded_m, padder.final()])
  const encryptor = crypto.createCipheriv("aes-256-cbc", k, Buffer.alloc(16, 0))
  let ct = encryptor.update(padded_m)
  ct = Buffer.concat([ct, encryptor.final()])
  const tag = ct.subarray(-16) // last block of ciphertext
  return tag
}

function cbcmac_verify(tag, m_bytes, k) {
  // CBC mode requires padding
  const padder = crypto.createCipheriv("aes-256-cbc", k, Buffer.alloc(16, 0))
  let padded_m = padder.update(m_bytes)
  padded_m = Buffer.concat([padded_m, padder.final()])
  const encryptor = crypto.createCipheriv("aes-256-cbc", k, Buffer.alloc(16, 0))
  let ct = encryptor.update(padded_m)
  ct = Buffer.concat([ct, encryptor.final()])
  const newtag = ct.subarray(-16)
  return tag.equals(newtag)
}

function xorNewMessage(m1, m2, tag1) {
  // Faz o XOR do primeiro bloco de m2 com tag1
  const firstBlockXORed = Buffer.alloc(16) // Inicializa um buffer de 16 bytes com zeros
  for (let i = 0; i < 16; i++) {
    firstBlockXORed[i] = m2[i] ^ tag1[i] // Realiza o XOR byte a byte
  }

  // Concatena m1 com o restante de m2 após o primeiro bloco
  console.log("First Block XORed: " + firstBlockXORed)
  const m2Modified = Buffer.concat([firstBlockXORed, m2.slice(16)])
  console.log("m2Modified: " + m2Modified)
  const m3 = Buffer.concat([m1, m2Modified])
  console.log("m3: " + m3)
  return m3
}

function cbcmac_lengthextension_example() {
  const m1 = Buffer.from("Mensagem curta")
  const m2 = Buffer.from("Esta é uma mensagem maior do que 16 bytes")
  const key = crypto.randomBytes(32)
  const tag1 = cbcmac_auth(m1, key)
  const tag2 = cbcmac_auth(m2, key)
  console.log(m1.toString("utf-8"), "; tag1 : ", tag1.toString("base64"))
  console.log(m2.toString("utf-8"), "; tag2 : ", tag2.toString("base64"))
  // check if tag1 verifies with m1, m2 / tag2 with m1, m2 :
  const r1 = cbcmac_verify(tag1, m1, key)
  const r2 = cbcmac_verify(tag1, m2, key)
  const r3 = cbcmac_verify(tag2, m1, key)
  const r4 = cbcmac_verify(tag2, m2, key)
  console.log("tag1 + m1: " + r1)
  console.log("tag1 + m2: " + r2)
  console.log("tag2 + m1: " + r3)
  console.log("tag2 + m2: " + r4)
  // create a m3 (based on m1 and m2 that verifies with tag2)
  const m3 = xorNewMessage(m1, m2, tag1)
  const r5 = cbcmac_verify(tag2, m3, key)
  console.log("tag2 + m3: " + r5)
}

cbcmac_lengthextension_example()
