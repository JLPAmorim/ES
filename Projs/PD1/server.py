import socket
import json
import ssl
import hashlib
import os
import logging
import threading
from datetime import datetime

# Dicionário para armazenar os usuários e suas filas de mensagens
users = {
    "1": {"name": "João", "queue": []},
    "2": {"name": "Maria", "queue": []}
}

test_users = {}

def handle_client_connection(client_socket):

    authenticated = False
    command_username = None

    logging.info(f"Nova conexão estabelecida")
    peer_cert = client_socket.getpeercert()
    if not peer_cert:
        raise ssl.SSLError("Falha na autenticação do cliente: certificado não fornecido.")
    else:
        print("Certificado do Cliente Autenticado com sucesso")
        logging.info("Certificado do Cliente Autenticado com sucesso")

    while True:
        try:
            
        
            # Receber dados do cliente
            data = client_socket.recv(1024)
            logging.info(f"Recebido: {data.decode()}")
            #if not data:
                #break

            # Decodificar e analisar o comando recebido
            command = json.loads(data.decode())

            if command["type"] == "registo" and not authenticated:
                response = register_user(command["username"], command["password"])
                client_socket.send(json.dumps(response).encode())
            elif command["type"] == "login" and not authenticated:
                username = command["username"]
                password = command["password"]
                response = login_user(username, password)
                authenticated, command_username = response
                client_socket.send(json.dumps(response).encode())

            elif authenticated:
                print("Entrei 4")
                print(command_username)
                response = process_command(command, command_username)
                client_socket.send(json.dumps(response).encode())
            else:
                client_socket.send(json.dumps({"error": "authentication required"}).encode())
        
        except Exception as e:
            print(f"Erro ao processar comando: {str(e)}")
            logging.error(f"Erro ao processar comando: {str(e)}")
            break  
    client_socket.close()

def client_thread(client_socket, address):
    handle_client_connection(client_socket)
    print(f"Conexão encerrada com {address}")


def hash_password(password, salt=None):
    if salt is None:
        salt = os.urandom(16)  # Generate a new salt
    else:
        salt = bytes.fromhex(salt)  # Convert salt from hex string to bytes
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    print(f"Hashing: password={password}, salt={salt.hex()}, hash={password_hash.hex()}")
    return password_hash.hex(), salt.hex()

def hash_password(password, salt=None):
    if salt is None:
        salt = os.urandom(16)  # Generate a new salt
    else:
        salt = bytes.fromhex(salt)  # Convert salt from hex string to bytes
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return password_hash.hex(), salt.hex()

def register_user(username, password):
    if username in test_users:
        return False, "Utilizador já existe."

    # Gera o hash da senha e o salt
    password_hash, salt = hash_password(password)
    # Adiciona o usuário ao dicionário de test_users
    test_users[username] = {"password_hash": password_hash, "salt": salt, "queue": []}
    print(f"Registering: username={username}, salt={salt}, hash={password_hash}")
    return True, "Utilizador registado com sucesso."

def login_user(username, password):
    user = test_users.get(username)
    if user:
        password_hash, _ = hash_password(password, user["salt"])  # Usando o salt armazenado
        print(f"Logging in: username={username}, stored_hash={user['password_hash']}, computed_hash={password_hash}")
        if user["password_hash"] == password_hash:
            logging.info("Utilizador logado com sucesso")
            return True, username  # Authenticated
    return False, None


def process_command(command, username):
    cmd_type = command.get("type")

    if cmd_type == "send":
        receiver = command.get("username")
        subject = command.get("subject")
        content = command.get("content")
        return send_message(username, receiver, subject, content)

    elif cmd_type == "askqueue":
        return get_unread_messages(username)

    elif cmd_type == "getmsg":

        msg_num = command.get("msg_num")
        return get_message(username, msg_num)
    
    elif cmd_type == "help":
        return {"instructions": "Enviar mensagem: send <uid> <subject> <content>\n"
                                "Ver mensagens não lidas: askqueue <uid>\n"
                                 "Ler mensagem específica: getmsg <uid> <msg_num>\n"
                                 "Sair: exit"}

    else:
        return {"error": "Comando inválido"}

def send_message(username, receiver, subject, content):
    print(test_users)
    print("Entrei 1")
    print(receiver)
    if receiver in test_users:
        user = test_users[receiver]
        print("Entrei 2")
        user["queue"].append({
            "sender":  username,
            "time": str(datetime.now()),
            "subject": subject,
            "content": content,
            "read": False
        })
        print(user)
        logging.info("Mensagem enviada")
        return {"status": "Mensagem enviada com sucesso"}
    
    else:
        logging.error("Usuário não encontrado ao enviar mensagem")
        return {"error": "Usuário não encontrado"}

def get_unread_messages(username):
    if username in test_users:
        user = test_users[username]
        queue = user["queue"]
        unread_msgs = []

        for idx, msg in enumerate(queue):
            if not msg["read"]:
                msg_info = {
                    "num": idx + 1,
                    "sender": msg["sender"],
                    "time": msg["time"],
                    "subject": msg["subject"]
                }
                unread_msgs.append(msg_info)
        logging.info("Visualização de mensagens")
        return {"unread_messages": unread_msgs}
    else:
        logging.error("Usuário não encontrado ao ver fila de mensagens")
        return {"error": "Usuário não encontrado"}

def get_message(uid, msg_num):
    if uid in test_users:
        user = test_users[uid]
        queue = user["queue"]

        try:
            msg_idx = int(msg_num) - 1
            if 0 <= msg_idx < len(queue):
                if not queue[msg_idx]["read"]:
                    # Marcar mensagem como lida apenas se não foi lida antes
                    queue[msg_idx]["read"] = True
                return {"message": queue[msg_idx]}
            else:
                logging.error("Número de mensagem inválido")
                return {"error": "Número de mensagem inválido"}
        except ValueError:
            logging.error("Número de mensagem inválido")
            return {"error": "Número de mensagem inválido"}
    else:
        logging.error("Usuário não encontrado ao obter mensagem")
        return {"error": "Usuário não encontrado"}


def start_server(host, port):
    logging.basicConfig(filename='server.log', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    logging.info(f"Iniciando o Servidor em {host}:{port}")
    print(f"A inicia o Servidor em {host}:{port}")

    context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    try:
        context.load_cert_chain(certfile='./certs/server_cert.crt', keyfile='./certs/server_key.key')
        context.load_verify_locations('./certs/CA.crt')
        context.verify_mode = ssl.CERT_REQUIRED

        context.minimum_version = ssl.TLSVersion.TLSv1_3
        context.maximum_version = ssl.TLSVersion.TLSv1_3
        print("Configurações SSL carregadas com sucesso.")
        logging.info("Configurações SSL carregadas com sucesso.")

    except Exception as e:
        print(f"Erro ao carregar configurações SSL: {e}")
        logging.error(f"Erro ao carregar configurações SSL: {e}")
        return

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server_sock:
        server_sock.bind((host, port))
        server_sock.listen(5)
        logging.info(f"Servidor à escuta em {host}:{port}")
        print(f"Servidor à escuta em {host}:{port}")

        with context.wrap_socket(server_sock, server_side=True) as ssock:
            logging.info("Aguardando conexões...")
            while True:
                try:
                    client_socket, address = ssock.accept()
                    logging.info(f"Conexão estabelecida com {address}")
                    print(f"Conexão estabelecida com {address}")
                    client_handling_thread = threading.Thread(target=client_thread, args=(client_socket, address))
                    client_handling_thread.start()
                except ssl.SSLError as e:
                    logging.error(f"Erro SSL: {address}: {e}")
                    print(f"Erro SSL: {address}: {e}")
                except Exception as e:
                    logging.error(f"Erro ao estabelecer conexão com {address}: {e}")
                    print(f"Erro ao estabelecer conexão com {address}: {e}")


if __name__ == "__main__":
    # Iniciar o servidor na porta 12345
    start_server("127.0.0.1", 12345)