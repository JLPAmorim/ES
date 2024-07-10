<template>
  <v-app>
    <v-row justify="center" no-gutters>
      <v-col cols="6" md="6">
        <!--Image on left side-->
        <v-card color="transparent" height="100vh" tile>
          <v-img src="../assets/register.jpg" width="50vw" height="100vh" cover>
          </v-img>
        </v-card>
      </v-col>
      <v-col cols="6" md="6">
        <!--Actual sign in part-->
        <v-card color="white" height="100vh" tile>
          <v-card-text class="text-center align-center title-prop mt-15">Bem-vindo!
            <v-card-text class="text-center" style="color: #00302e; font-size: 17px; opacity: 0.7;">
              Registar uma conta nova
            </v-card-text>
          </v-card-text>

          <v-card class="form-prop px-auto mb-10" flat>
            <v-form ref="form">
              <v-text-field v-model="firstName" label="Nome Próprio" type="text" color="#00302e" outlined
                :rules="rules.required" />
              <v-text-field v-model="lastName" label="Apelido" type="text" color="#00302e" outlined
                :rules="rules.required" />
              <v-text-field v-model="email" label="Email" type="text" color="#00302e"
                :rules="[...rules.email, ...rules.required]" />
              <v-text-field v-model="password" :type="showPassword1 ? 'text' : 'password'" label="Password"
                append-icon="mdi-eye" @click:append="togglePassword1" :rules="rules.password" />
              <v-text-field v-model="repeatPassword" :type="showPassword2 ? 'text' : 'password'"
                label="Confirmar Password" append-icon="mdi-eye" @click:append="togglePassword2"
                :rules="[rules.password, rules.equalsTo]" />
            </v-form></v-card>

          <v-btn type="submit" class="aut-btn text-none" @click="register" depressed>Registar
          </v-btn>

          <v-btn class="sign-in-prop text-none" text plain :to="'/login'">
            Já tem uma conta? Efetue o Login
          </v-btn>
          <v-btn @click="retrievePrivateKeyFromIndexedDB">Teste</v-btn>
        </v-card>
      </v-col>
    </v-row>

  </v-app>
</template>

<script>
import axiosInstance from '@/plugins/http';

export default {
  data() {
    return {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      repeatPassword: "",
      publicKey: [],
      showPassword1: false,
      showPassword2: false,
      valid: false,
      rules: {
        required: [(v) => !!v || "Campo obrigatório"],
        email: [v => !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || 'E-mail must be valid'],
        password: [
          v => !!v || 'Campo obrigatório',
          v => v.length >= 8 || 'A senha deve ter pelo menos 8 caracteres',
          v => /[A-Z]/.test(v) || 'A senha deve conter pelo menos uma letra maiúscula',
          v => /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'A senha deve conter pelo menos um símbolo'
        ],
        equalsTo: () => {
          return this.password === this.repeatPassword || 'Passwords devem ser exatamente iguais';
        }
      }
    };
  },
  methods: {

    async generateKeyPair() {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: { name: "SHA-256" },
        },
        true,
        ["encrypt", "decrypt"]
      );

      const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
      console.log(publicKey)
      const publicKeyBase64 = this.arrayBufferToBase64(publicKey);
      console.log("Public Key é: " + publicKeyBase64);
      await this.storePrivateKeyInIndexedDB(this.email, keyPair.privateKey);
      this.publicKey = publicKeyBase64;

      console.log("Chave privada armazenada com segurança no cliente e chave pública enviada ao servidor.");
      return { publicKey: publicKeyBase64, privateKey: keyPair.privateKey }; // Retorna os pares de chave para fins de depuração ou verificação
    },

    arrayBufferToBase64(buffer) {
      var binary = '';
      var bytes = new Uint8Array(buffer);
      var len = bytes.byteLength;
      for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    },

    async storePrivateKeyInIndexedDB(email, privateKey) {
      console.log(`Iniciando o armazenamento da chave privada para o usuário: ${email}`);
      try {
        const db = await this.openDB('cryptoKeys', 1, {
          upgrade(db) {
            console.log("Checando se a object store 'privateKeys' precisa ser criada.");
            if (!db.objectStoreNames.contains('privateKeys')) {
              console.log("Criando a object store 'privateKeys'.");
              db.createObjectStore('privateKeys', { keyPath: 'id' });
            }
          },
        });

        const tx = db.transaction('privateKeys', 'readwrite');
        const store = tx.objectStore('privateKeys');
        await store.put({ id: email, key: privateKey });
        console.log("Chave privada armazenada com sucesso no IndexedDB.");
        await tx.complete;
        db.close();
      } catch (error) {
        console.error("Erro ao armazenar a chave privada no IndexedDB:", error);
      }
    },

    openDB(name, version, { upgrade }) {
      return new Promise((resolve, reject) => {
        console.log(`Tentando abrir o banco de dados: ${name} com versão: ${version}`);
        const request = indexedDB.open(name, version);

        request.onerror = () => {
          console.error("Erro ao abrir o banco de dados:", request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log("Banco de dados aberto com sucesso.");
          resolve(request.result);
        };

        request.onupgradeneeded = event => {
          console.log("Evento onupgradeneeded disparado para atualização ou criação do banco de dados.");
          upgrade(request.result, event);
        };
      });
    },

    async register() {
      const { valid } = await this.$refs.form.validate();
      const keyPair = await this.generateKeyPair();
      console.log(keyPair)
      console.log(this.publicKey)
      if (valid) {
        let newUser = {
          firstName: this.firstName,
          lastName: this.lastName,
          email: this.email,
          password: this.password,
          publicKey: this.publicKey
        };

        try {
          const response = await axiosInstance.post(`/user`, newUser);
          console.log(response);

          // Após registrar com sucesso, gerar o par de chaves


          this.$router.push('/login');
        } catch (error) {
          console.log("Failed to register user:", error);
          if (error.response) {
            console.error('HTTP error:', error.response.status, error.response.data);
          } else {
            console.error('Network or unknown error occurred:', error);
          }
        }
      } else {
        console.log("Invalid input");
      }

    },

    async retrievePrivateKeyFromIndexedDB() {
      const email = "testuser2@gmail.com"
      console.log(`Iniciando a recuperação da chave privada para o e-mail: ${email}`);
      try {
        const db = await this.openDB('cryptoKeys', 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains('privateKeys')) {
              console.log("Criando object store 'privateKeys' com 'id' como keyPath.");
              db.createObjectStore('privateKeys', { keyPath: 'id' });
            }
          },
        });
        console.log("Banco de dados aberto com sucesso para leitura.");
        const tx = db.transaction('privateKeys', 'readonly');
        const store = tx.objectStore('privateKeys');

        const request = store.get(email);
        request.onsuccess = () => {
          if (request.result) {
            console.log("Chave privada recuperada com sucesso.");
            console.log("Chave:", request.result.key); // Log da chave CryptoKey
          } else {
            console.log("Nenhuma chave privada encontrada para este e-mail.");
          }
        };

        request.onerror = () => {
          console.error("Erro ao recuperar chave privada:", request.error);
        };

        await tx.complete;
        db.close();
        console.log("Conexão com o banco de dados fechada após a recuperação.");
        return request.result ? request.result.key : null;  // Retornar a chave privada armazenada ou null se não encontrada
      } catch (error) {
        console.error("Erro ao recuperar a chave privada do IndexedDB:", error);
        return null;  // Em caso de erro, retorna nulo
      }
    },



    togglePassword1() {
      this.showPassword1 = !this.showPassword1;
    },
    togglePassword2() {
      this.showPassword2 = !this.showPassword2;
    },

    equalPasswords() {
      if (this.password === this.repeatPassword) {
        return true;
      } else {
        return 'Password does not match.';
      }
    }
  }
};

</script>

<style scoped>
#app {
  background-color: #00302e;
  height: auto;
  min-height: 100vh;
}

.title-prop {
  color: #00302e !important;
  font-size: 5vh;
  font-weight: 600;
  top: 10%;
}

.form-prop {
  position: absolute;
  top: 45%;
  width: 30vw;
  left: 50%;
  transform: translate(-50%, -50%);
}

.aut-btn {
  background-color: #00302e !important;
  color: #dfdcd7 !important;
  position: absolute;
  top: 74%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3vh;
  height: 7vh !important;
  width: 30vw;
}

.sign-in-prop {
  color: #00302e !important;
  background-color: #eeeeee;
  position: absolute;
  top: 80.5%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.7vh;
  width: 30vw;
}
</style>