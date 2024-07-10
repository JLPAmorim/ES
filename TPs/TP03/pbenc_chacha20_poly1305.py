import sys
import os
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305

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
    salt = os.urandom(16)
    key = derive_key(salt, password)
    chacha = ChaCha20Poly1305(key)
    nonce = os.urandom(12)
    with open(input_file, 'rb') as f:
        plaintext = f.read()
    ciphertext = chacha.encrypt(nonce, plaintext, None)
    with open(output_file, 'wb') as f:
        f.write(salt)
        f.write(nonce)
        f.write(ciphertext)
    print(f"Encrypted {input_file} and saved to {output_file}")

def decrypt(password, input_file='fich.enc', output_file='fich.dec'):
    with open(input_file, 'rb') as f:
        salt = f.read(16)
        nonce = f.read(12)
        ciphertext = f.read()
    key = derive_key(salt, password)
    chacha = ChaCha20Poly1305(key)
    plaintext = chacha.decrypt(nonce, ciphertext, None)
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
