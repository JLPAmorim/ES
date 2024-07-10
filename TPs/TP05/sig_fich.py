import sys
import os
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
import getpass
from cryptography.hazmat.primitives.asymmetric import rsa, utils
from cryptography.hazmat.primitives.serialization import load_pem_private_key, load_pem_public_key


def sign_file(username, filename):
    # Verificar se o arquivo e a chave privada existem
    if not os.path.isfile(f'{username}.key'):
        print(f'Erro: A chave privada para {username} não encontrada.')
        return
    
    if not os.path.isfile(filename):
        print(f'Erro: O arquivo {filename} não encontrado.')
        return
    
    # Solicitar a senha para descriptografar a chave privada
    password = getpass.getpass(prompt=f'Informe a senha para {username}.key: ')

    # Carregar a chave privada do arquivo .key
    with open(f'{username}.key', 'rb') as key_file:
        private_key = load_pem_private_key(
            key_file.read(),
            password=password.encode('utf-8'),  # Convert password to bytes
            backend=default_backend()
        )

    # Ler o conteúdo do arquivo
    with open(filename, 'rb') as file:
        file_data = file.read()

    # Assinar o conteúdo do arquivo
    signature = private_key.sign(
        file_data,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )

    # Criar o arquivo .sig contendo a assinatura e o certificado do assinante
    with open(f'fich1.sig', 'wb') as sig_file:
        sig_file.write(signature)
        sig_file.write(private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ))


if __name__ == "__main__":
    if len(sys.argv) == 4 and sys.argv[1] == 'sign':
        username = sys.argv[2]
        filename = sys.argv[3]
        sign_file(username, filename)
    else:
        print('Uso: python sig_fich.py sign <user> <fich> OU python sig_fich.py verify')