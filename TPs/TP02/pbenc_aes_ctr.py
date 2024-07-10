import sys
import os
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

def derive_key(salt, password):
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    password = password.encode('utf-8')
    return kdf.derive(password)

def encrypt(password, input_file='fich.txt', output_file='fich.enc'):
    # Gera um salt aleatório
    salt = os.urandom(16)

    # Deriva a chave a partir da senha e do salt
    key = derive_key(salt, password)

    # cria um nonce aleatório
    nonce = os.urandom(16)

    # lê o ficheiro para cifrar
    with open(input_file, 'rb') as f:
        plaintext = f.read()

    # adiciona padding para o texto
    padder = padding.PKCS7(algorithms.AES.block_size).padder()
    padded_plaintext = padder.update(plaintext) + padder.finalize()

    # Usa a chave e o nonce para cifrar o ficheiro pretendido
    cipher = Cipher(algorithms.AES(key), modes.CTR(nonce), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded_plaintext) + encryptor.finalize()

    # Escreve o salt, o nonce e o criptograma para o ficheiro
    with open(output_file, 'wb') as f:
        f.write(salt)
        f.write(nonce)
        f.write(ciphertext)

    print(f"Encrypted {input_file} and saved to {output_file}")

def decrypt(password, input_file='fich.enc', output_file='fich.dec'):
    # Lê o salt, nonce e criptograma do ficheiro
    with open(input_file, 'rb') as f:
        salt = f.read(16)
        nonce = f.read(16)
        ciphertext = f.read()

    # Deriva a chave a partir da senha e do salt
    key = derive_key(salt, password)

    # Decifra o criptograma usando a chave e o nonce
    cipher = Cipher(algorithms.AES(key), modes.CTR(nonce), backend=default_backend())
    decryptor = cipher.decryptor()
    decrypted_text = decryptor.update(ciphertext) + decryptor.finalize()

    # remove o padding do texto desencriptado
    unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
    plaintext = unpadder.update(decrypted_text) + unpadder.finalize()

    # Escreve o texto decifrado para o ficheiro
    with open(output_file, 'wb') as f:
        f.write(plaintext)

    print(f"Decrypted {input_file} and saved to {output_file}")

operacao = sys.argv[1]

if operacao == "encrypt":
    password = input("Enter password: ")
    encrypt(password)
elif operacao == "decrypt":
    password = input("Enter password: ")
    decrypt(password)
else:
    print("Invalid argument")
