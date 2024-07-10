import sys
import os
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms

def setup(fkey = 'fkey'):
    # Gera uma chave aleatória 
    key = os.urandom(32)
    
    # Coloca a chave no ficheiro fkey
    with open(fkey, "wb") as key_file:
        key_file.write(key)

    print("Generated key and saved to", fkey)


def encrypt(input = 'fich.txt', fkey ='fkey', output='fich.enc'):
    # lê a chave do ficheiro fkey
    with open(fkey, 'rb') as key_file:
        key = key_file.read()
    
    # cria um nounce aleatório
    nonce = os.urandom(16)

    # lê o ficheiro para encriptar
    with open(input, 'rb') as input_file:
        plaintext = input_file.read()

    # Usa a chave e o nounce para encriptar o ficheiro pretendido
    cipher = Cipher(algorithms.ChaCha20(key, nonce), mode=None, backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(plaintext) + encryptor.finalize()

    # Escreve o nounce e o criptograma para o ficheiro fich.enc
    with open(output, 'wb') as output_file:
        output_file.write(ciphertext)
        output_file.write(nonce)

    print(f"Encrypted {input} and saved to {output}")

# fich.attck
def decrypt(input='fich.attck', fkey='fkey', output='fich.dec'):
    # lê a chave do ficheiro fkey
    with open(fkey, 'rb') as key_file:
        key = key_file.read()

    # Determina o tamanho do nonce
    nonce_length = 16

    # Lê o ficheiro para decifrar
    with open(input, 'rb') as input_file:
        ciphertext = input_file.read()

    # Extrai o nounce do final do texto
    nonce = ciphertext[-nonce_length:]
    ciphertext = ciphertext[:-nonce_length]

    # Decifra o criptograma usando a chave e o nounce
    cipher = Cipher(algorithms.ChaCha20(key, nonce), mode=None, backend=default_backend())
    decryptor = cipher.decryptor()
    decrypted_text = decryptor.update(ciphertext) + decryptor.finalize()

    # Escreve o texto desencriptado para o ficheiro fich.dec
    with open(output, 'wb') as output_file:
        output_file.write(decrypted_text)

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
