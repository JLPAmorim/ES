import sys
import os
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms

def realizar_ataque(posicao, conteudo_original, conteudo_alterado):

    arquivo_entrada = "fich.enc"
    arquivo_saida = "fich.attck"

    with open(arquivo_entrada, 'rb') as file:
        dados = bytearray(file.read())

    if posicao < 0 or posicao >= len(dados):
        print("Posição inválida.")
        return

    # Garantir que ambos tenham o mesmo comprimento
    min_length = min(len(conteudo_original), len(conteudo_alterado))

    for i in range(min_length):
        dados[posicao + i] ^= ord(conteudo_original[i]) ^ ord(conteudo_alterado[i])

    with open(arquivo_saida, 'wb') as file:
        file.write(dados)

    print(f"Ataque realizado com sucesso. Resultado salvo em {arquivo_saida}")


operacao = sys.argv[1]
posicao = int(sys.argv[2])
conteudo_original = sys.argv[3]
conteudo_alterado = sys.argv[4]

if(operacao == "ataque"):
    realizar_ataque(posicao, conteudo_original, conteudo_alterado)
else:
    print("operaçao invalida")

