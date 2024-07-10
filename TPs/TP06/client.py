import socket
import ssl

host_addr = '127.0.0.1'
host_port = 8443
server_sni_hostname = 'server'
server_cert = 'server.crt'
client_cert = 'client.crt'
client_key = 'client.key'

context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH, cafile=server_cert)
context.load_cert_chain(certfile=client_cert, keyfile=client_key)
context.options |= ssl.OP_NO_TLSv1 | ssl.OP_NO_TLSv1_1  # Desativar versões antigas do TLS
context.minimum_version = ssl.TLSVersion.TLSv1_2  # Forçar TLS 1.2 ou superior
context.maximum_version = ssl.TLSVersion.TLSv1_3  # Forçar TLS 1.3

s = socket.create_connection((host_addr, host_port))
conn = context.wrap_socket(s, server_side=False, server_hostname=server_sni_hostname)

print("SSL established. Peer: {}".format(conn.getpeercert()))

# Print cryptographic algorithms
print("Cipher suite:", conn.cipher())

try:
    while True:
        message = input("You: ").encode()
        conn.sendall(message)
        response = conn.recv(4096)
        print("Server says:", response.decode())
finally:
    print("Closing connection")
    conn.close()
