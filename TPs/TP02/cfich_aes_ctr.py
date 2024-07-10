import sys
import os
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding

def setup(fkey='fkey'):
    # Gera uma chave aleatória
    key = os.urandom(32)

    # Coloca a chave no ficheiro fkey
    with open(fkey, "wb") as key_file:
        key_file.write(key)

    print("Generated key and saved to", fkey)

def encrypt(input='fich.txt', fkey='fkey', output='fich.enc'):
    # lê a chave do ficheiro fkey
    with open(fkey, 'rb') as key_file:
        key = key_file.read()

    # cria um nonce aleatório
    nonce = os.urandom(16)

    # lê o ficheiro para encriptar
    with open(input, 'rb') as input_file:
        plaintext = input_file.read()

    # adiciona padding para o texto
    padder = padding.PKCS7(algorithms.AES.block_size).padder()
    padded_plaintext = padder.update(plaintext) + padder.finalize()

    # Usa a chave e o nonce para encriptar o ficheiro pretendido
    cipher = Cipher(algorithms.AES(key), modes.CTR(nonce), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded_plaintext) + encryptor.finalize()

    # Escreve o nonce e o criptograma para o ficheiro fich.enc
    with open(output, 'wb') as output_file:
        output_file.write(nonce)
        output_file.write(ciphertext)

    print(f"Encrypted {input} and saved to {output}")

def decrypt(input='fich.enc', fkey='fkey', output='fich.dec'):
    # lê a chave do ficheiro fkey
    with open(fkey, 'rb') as key_file:
        key = key_file.read()

    # Determina o tamanho do nonce
    nonce_length = 16

    # Lê o ficheiro para decifrar
    with open(input, 'rb') as input_file:
        nonce = input_file.read(nonce_length)
        ciphertext = input_file.read()

    # Decifra o criptograma usando a chave e o nonce
    cipher = Cipher(algorithms.AES(key), modes.CTR(nonce), backend=default_backend())
    decryptor = cipher.decryptor()
    decrypted_text = decryptor.update(ciphertext) + decryptor.finalize()

    # remove o padding do texto desencriptado
    unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
    plaintext = unpadder.update(decrypted_text) + unpadder.finalize()

    # Escreve o texto desencriptado para o ficheiro fich.dec
    with open(output, 'wb') as output_file:
        output_file.write(plaintext)

    print(f"Decrypted {input} and saved to {output}")

operacao = sys.argv[1]

if operacao == "setup":
    setup()
elif operacao == "encrypt":
    encrypt()
elif operacao == "decrypt":
    decrypt()
else:
    print("Argumento inválido")
