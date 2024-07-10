import sys
import os
import cryptography.hazmat.primitives.asymmetric as asymmetric
import cryptography.hazmat.primitives.serialization as serialization
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

def derive_aes_key(shared_key):
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=16,
        salt=None,
        info=b'AES key derivation',
        backend=default_backend()
    )
    return hkdf.derive(shared_key)

def mkpair(x, y):
    len_x = len(x)
    len_x_bytes = len_x.to_bytes(2, 'little')
    return len_x_bytes + x + y

def unpair(xy):
    len_x = int.from_bytes(xy[:2], 'little')
    x = xy[2:len_x+2]
    y = xy[len_x+2:]
    return x, y

def setup(user):
    p = 0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFFFFFFFFFF
    g = 2
    dh_parameters = asymmetric.dh.DHParameterNumbers(p, g).parameters(default_backend())
    private_key = dh_parameters.generate_private_key()
    public_key = private_key.public_key()
    private_key_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    public_key_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    with open(user + '.sk', 'wb') as sk_file:
        sk_file.write(private_key_bytes)
    with open(user + '.pk', 'wb') as pk_file:
        pk_file.write(public_key_bytes)
    print(f"Setup complete. Public key saved to {user}.pk and private key saved to {user}.sk")

def encrypt(user, filename):
    with open(user + '.pk', 'rb') as pk_file:
        public_key_bytes = pk_file.read()
        public_key = serialization.load_pem_public_key(public_key_bytes, backend=default_backend())
    private_key = serialization.load_pem_private_key(open('bob.sk', 'rb').read(), password=None, backend=default_backend()) # Load Bob's private key
    shared_key = private_key.exchange(public_key)
    aes_key = derive_aes_key(shared_key)
    nonce = os.urandom(16)
    with open(filename, 'rb') as f:
        plaintext = f.read()
    cipher = Cipher(algorithms.AES(aes_key), modes.CTR(nonce), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(plaintext) + encryptor.finalize()
    filename = os.path.splitext(filename)[0]
    with open(filename + '.enc', 'wb') as f:
        f.write(mkpair(public_key_bytes, nonce + ciphertext))
    print(f"Encryption complete. Encrypted file saved to {filename}.enc")

def decrypt(user, filename):
    with open(user + '.sk', 'rb') as sk_file:
        private_key_bytes = sk_file.read()
        private_key = serialization.load_pem_private_key(private_key_bytes, password=None, backend=default_backend())
    with open(filename, 'rb') as f:
        data = f.read()
    public_key_bytes, nonce_and_ciphertext = unpair(data)
    nonce = nonce_and_ciphertext[:16]
    ciphertext = nonce_and_ciphertext[16:]
    public_key = serialization.load_pem_public_key(public_key_bytes, backend=default_backend())
    shared_key = private_key.exchange(public_key)
    aes_key = derive_aes_key(shared_key)
    cipher = Cipher(algorithms.AES(aes_key), modes.CTR(nonce), backend=default_backend())
    decryptor = cipher.decryptor()
    plaintext = decryptor.update(ciphertext) + decryptor.finalize()
    filename = os.path.splitext(filename)[0]
    with open(filename + '.dec', 'wb') as f:
        f.write(plaintext)
    print(f"Decryption complete. Decrypted file saved to {filename[:-4]}.dec")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: cfich_nike.py <operation> <user> [<filename>]")
        sys.exit(1)
    operation = sys.argv[1]
    user = sys.argv[2]
    if operation == "setup":
        setup(user)
    elif operation == "enc":
        filename = sys.argv[3]
        encrypt(user, filename)
    elif operation == "dec":
        filename = sys.argv[3]
        decrypt(user, filename)
    else:
        print("Invalid operation")
