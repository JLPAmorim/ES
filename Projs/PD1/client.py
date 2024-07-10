import socket
import sys
import json
import ssl
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes
from cryptography import x509
from cryptography.hazmat.backends import default_backend

p12_filename = 'CLI1.p12'

def get_public_key(cert_data):
    cert = x509.load_der_x509_certificate(cert_data, default_backend())
    public_key = cert.public_key()
    return public_key

def encrypt_content(content, public_key):
    encrypted_content = public_key.encrypt(
        content.encode(),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return encrypted_content

def decrypt_content(encrypted_content, private_key):
    decrypted_content = private_key.decrypt(
        encrypted_content,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return decrypted_content.decode()

def load_user_data(p12_filename, password=None):
    with open(p12_filename, "rb") as f:
        p12_data = f.read()
    client_key, client_cert, additional_certs = pkcs12.load_key_and_certificates(p12_data, password.encode() if password else None)
    client_cert = client_cert.public_bytes(serialization.Encoding.DER)
    return client_key, client_cert, additional_certs

def load_tsl_and_certificates():
    context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH, cafile='./certs/CA.crt')
    context.load_cert_chain(certfile=f"./certs/user_cert.crt", keyfile="./certs/user_key.key")
    context.minimum_version = ssl.TLSVersion.TLSv1_2  # Forçar TLS 1.2 ou superior
    context.maximum_version = ssl.TLSVersion.TLSv1_3  # Forçar TLS 1.3

    return context

def send_command(command):
        
        client_key, client_cert, _ = load_user_data(f"./certs/{p12_filename}")

        if command["type"] == "send":
            # Encrypt the content before sending
            public_key = get_public_key(client_cert)
            encrypted_content = encrypt_content(command["content"], public_key)
            command["content"] = encrypted_content.hex()

        # Send the command to the server
        conn.send(json.dumps(command).encode())

        # Receber e decodificar a resposta do servidor
        response = conn.recv(1024)
        response_data = json.loads(response.decode())
        if command["type"] == "getmsg":
            # If the response contains encrypted content, decrypt it
            if "message" in response_data and "content" in response_data["message"]:
                encrypted_content = bytes.fromhex(response_data["message"]["content"])
                response_data["message"]["content"] = decrypt_content(encrypted_content, client_key)
                print("Decrypted content:", response_data["message"]["content"])
                
        print(response_data)
        return response_data


def print_help():
    print("Enviar mensagem: send <username> <subject> <content>")
    print("Ver mensagens não lidas: askqueue")
    print("Ler mensagem específica: getmsg <msg_num>")
    print("Sair: exit")

if __name__ == "__main__":
    host = "127.0.0.1"
    port = 12345

    context = load_tsl_and_certificates()

    try:
        s = socket.create_connection((host, port))
        conn = context.wrap_socket(s, server_side=False, server_hostname='Message Service Server')

        #print("SSL established. Peer: {}".format(conn.getpeercert()))
        print("Server Authenticated Successfully")

        while True:
            print("-------- Registo/Login de Utilizador --------\n")
            print("Registo - Para registar novo utilizador")
            print("Login - Se já possuí conta de utilizador\n")
            option = input("Efetuar Registo ou Login: ")

            if option.lower() == "registo":
                print("\nIntroduza o Username e Password com que pretende registar a conta.\n")

                username = input("Digite o username: ")
                password = input("Digite a password: ")

                register_command = {
                    "type": "registo",
                    "username": username,
                    "password": password
                }
            
                response = send_command(register_command)

                if response[0]:  # Checa se o primeiro elemento da lista é True
                    print(response[1])  # Imprime a mensagem de sucesso do servidor
                    # Prossiga para a próxima etapa, como iniciar sessão ou qualquer coisa.
                    continue
                else:
                    print(f"Erro no registo: {response[1]}")  # Imprime a mensagem de erro do servidor
                    continue  # Opcional: permite ao usuário tentar novamente.

            elif option.lower() == "login":
                print("\nIntroduza o Username e Password para efetuar o Login.\n")

                username = input("Digite o username: ")
                password = input("Digite a password: ")
            
                login_command = {
                    "type": "login",
                    "username": username,
                    "password": password
                }

                response = send_command(login_command)

                if response[0]:  # Checa se o primeiro elemento da lista é True
                    print(response[1])  # Imprime a mensagem de sucesso do servidor
                    break
                else:
                    print(f"Erro no login: {response[1]}")  # Imprime a mensagem de erro do servidor
                    continue  # Opcional: permite ao usuário tentar novamente.

            else:
                print("\nPor favor, introduza uma das opções fornecidas!\n")
            
            

        while True:
            user_input = input("\nDigite o comando: ")

            if user_input.lower() == "exit":
                break

            # Analisar o comando inserido pelo usuário
            parts = user_input.split()
            if len(parts) < 1:  # Verificar se há pelo menos um argumento
                sys.stderr.write("\nMSG SERVICE: command error!\n\n")
                print_help()
                continue

            cmd_type = parts[0]
            command = {"type": cmd_type}

            if cmd_type == "help":
                print_help()
                continue  # Continuar para o próximo loop, sem enviar o comando para o servidor


            if cmd_type == "send":
                if len(parts) < 4:
                    sys.stderr.write("\nMSG SERVICE: command error!\n\n")
                    print_help()
                    continue
                command["username"] = parts[1]
                command["subject"] = parts[2]
                command["content"] = " ".join(parts[3:])
                byte_content = command["content"].encode('utf-8')  # Codificar em UTF-8 para obter os bytes

                # Se o conteúdo for maior que 1000 bytes, informar o utilizador do tamanho da mensagem
                if len(byte_content) > 1000:
                    # Determinar o número máximo de caracteres que não excedem 1000 bytes
                    max_chars = len(command["content"].encode('utf-8')[:1000].decode('utf-8', 'ignore'))
                    # Calcular o número de caracteres da mensagem original
                    num_chars = len(command["content"])
                    sys.stderr.write(f"MSG SERVICE: Message is too long! ({num_chars} characters)\nPlease write a message with a maximum of {max_chars} characters.\n")
                    continue
        
            elif cmd_type == "askqueue":
                if len(parts) != 1:  # Verificar se há exatamente dois argumentos para askqueue
                    sys.stderr.write("\nMSG SERVICE: command error!\n\n")
                    print_help()
                    continue

            elif cmd_type == "getmsg":
                if len(parts) != 2:  # Verificar se há exatamente três argumentos para getmsg
                    sys.stderr.write("\nMSG SERVICE: command error!\n\n")
                    print_help()
                    continue
                command["msg_num"] = parts[1]
            else:
                print("Comando inválido.")
                continue

            # Enviar o comando para o servidor
            send_command(command)

    except Exception as e:
        print(f"Erro ao conectar ao servidor: {str(e)}")
    
    finally:
        print("Closing connection")
        conn.close()

    print("Cliente encerrado.")
