import sys
import os
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives import hmac

MAC_KEY_SIZE_BYTES = 128

def derive_keys(salt, password):
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32 + MAC_KEY_SIZE_BYTES, 
        salt=salt,
        iterations=100000, 
        backend=default_backend()
    )
    password = password.encode('utf-8')
    derived_key_material = kdf.derive(password)
    aes_key = derived_key_material[:32]
    mac_key = derived_key_material[32:]
    return aes_key, mac_key

def encrypt(password, input_file='fich.txt', output_file='fich.enc'):
    salt = os.urandom(16)

    aes_key, mac_key = derive_keys(salt, password)

    nonce = os.urandom(16)

    with open(input_file, 'rb') as f:
        plaintext = f.read()

    padder = padding.PKCS7(algorithms.AES.block_size).padder()
    padded_plaintext = padder.update(plaintext) + padder.finalize()

    cipher = Cipher(algorithms.AES(aes_key), modes.CTR(nonce), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded_plaintext) + encryptor.finalize()

    h = hmac.HMAC(mac_key, hashes.SHA256(), backend=default_backend())
    h.update(ciphertext)
    mac_tag = h.finalize()

    with open(output_file, 'wb') as f:
        f.write(salt)
        f.write(nonce)
        f.write(ciphertext)
        f.write(mac_tag)

    print(f"Encrypted {input_file} and saved to {output_file}")

def decrypt(password, input_file='fich.enc', output_file='fich.dec'):
    with open(input_file, 'rb') as f:
        salt = f.read(16)
        nonce = f.read(16)
        ciphertext = f.read()[:-32]
        f.seek(-32, os.SEEK_END)  
        mac_tag = f.read()

    aes_key, mac_key = derive_keys(salt, password)

    h = hmac.HMAC(mac_key, hashes.SHA256(), backend=default_backend())
    h.update(ciphertext)
    calculated_mac_tag = h.finalize()

    if calculated_mac_tag != mac_tag:
        raise ValueError("MAC verification failed.")

    cipher = Cipher(algorithms.AES(aes_key), modes.CTR(nonce), backend=default_backend())
    decryptor = cipher.decryptor()
    decrypted_text = decryptor.update(ciphertext) + decryptor.finalize()

    unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
    plaintext = unpadder.update(decrypted_text) + unpadder.finalize()

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
