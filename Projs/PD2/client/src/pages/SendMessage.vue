<template>
    <v-card>
        <v-layout>
            <Header></Header>

            <v-main style="height: 855px;">
                <v-row>
                    <v-col cols="1" />
                    <h3 class="mt-15 mb-10 corh3" color="#00302e">Send New Message</h3>
                </v-row>
                <v-row>
                    <v-col cols="1" />
                    <v-combobox v-model="receivers" :items="items" chips label="To" multiple></v-combobox>
                    <!--<v-text-field v-model="receiver" label="To"></v-text-field>-->
                    <v-col cols="1" />

                </v-row>
                <v-row>
                    <v-col cols="1" />
                    <v-text-field v-model="subject" label="Subject"></v-text-field>
                    <v-col cols="1" />
                </v-row>
                <v-row>
                    <v-col cols="1" />
                    <v-textarea v-model="message" prepend-inner-icon="mdi-comment" label="Message Content" counter
                        clear-icon="mdi-close-circle" clearable></v-textarea>
                    <v-col cols="1" />
                </v-row>
                <v-row>
                    <v-col cols="10" />
                    <v-btn class="ml-12 mt-2" color="#00302e" @click="sendMessage">
                        Enviar
                    </v-btn>
                </v-row>

            </v-main>

        </v-layout>

    </v-card>
    <Footer></Footer>

</template>

<script>
import axiosInstance from '@/plugins/http';

export default {
    data: () => ({
        user: "",
        token: "",
        drawer: true,
        receivers: [],
        subject: "",
        message: "",
        sender: "",
        token: ""
    }),
    async created() {
        this.token = localStorage.getItem('token');
        if (!this.token) {
            console.log("Token is not available");
            this.$router.push('/login');
        } else {
            console.log("Token:", this.token);
            try {
                const response = await axiosInstance.get('/user', {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
                this.sender = response.data.user.email;
                console.log("User data retrieved:", this.sender);
            } catch (error) {
                console.error("Failed to retrieve user:", error);
                if (error.response && error.response.status === 401) {
                    this.$router.push('/login');
                }
            }
        }
    },
    methods: {
        async getPublicKey(email) {
            try {
                const response = await axiosInstance.get(`/getPublicKey/${email}`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
                console.log("Chave pública obtida com sucesso:", response.data);
                return response.data.publicKey; // assumindo que a chave está neste campo
            } catch (error) {
                console.error("Erro ao obter a chave pública:", error);
                return null;
            }
        },

        async encryptMessage(message, publicKey) {
            const encoder = new TextEncoder();
            const encodedMessage = encoder.encode(message);

            // Convertendo a chave pública de PEM/Texto para o formato CryptoKey
            const cryptoKey = await window.crypto.subtle.importKey(
                "spki",
                this.base64ToArrayBuffer(publicKey),
                {
                    name: "RSA-OAEP",
                    hash: { name: "SHA-256" },
                },
                true,
                ["encrypt"]
            );

            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: "RSA-OAEP",
                },
                cryptoKey,
                encodedMessage
            );

            console.log("Mensagem criptografada:", encrypted);
            return window.btoa(String.fromCharCode(...new Uint8Array(encrypted)));
        },

        base64ToArrayBuffer(base64) {
            var binary_string = window.atob(base64);
            var len = binary_string.length;
            var bytes = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i);
            }
            return bytes.buffer;
        },
        async sendMessage() {
            const newMessage = {
                sender: this.sender,
                receivers: this.receivers,
                subject: this.subject,
                content: this.message,
                oldContent: this.message
            };

            console.log(newMessage);

            try {
                // Obter a chave pública do destinatário
                const publicKey = await this.getPublicKey(this.receivers[0]); // Assumindo um único destinatário para simplificação
                console.log("Fetch da publicKey com sucesso: " + publicKey)
                if (!publicKey) {
                    throw new Error("Falha ao obter a chave pública do destinatário");
                }

                // Encriptar a mensage
                const encryptedMessage = await this.encryptMessage(this.message, publicKey);
                console.log("Mensagem Encriptada: " + encryptedMessage)
                newMessage.content = encryptedMessage;

                console.log("Mensagem: " + newMessage)

                const response = await axiosInstance.post('/sendmessage', newMessage, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
                console.log("Mensagem enviada e criptografada com sucesso:", response);
            } catch (error) {
                console.log("Erro ao enviar mensagem:", error);
            }
        },

        /*async sendMessage() {
            const newMessage = {
                sender: this.sender,
                receivers: this.receivers,
                subject: this.subject,
                content: this.message
            };

            console.log(newMessage);

            try {
                const response = await axiosInstance.post('/sendmessage', newMessage, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
                console.log(response);
            } catch (error) {
                console.log(error);
            }
        }*/
    },

    computed: {
        isLoggedIn() {
            return authStore().isLoggedIn;
        },
        userEmail() {
            return authStore().userData?.email;
        },
        userToken() {
            return authStore().token;
        }
    }


}
</script>

<style scoped>
.corh3 {
    color: #00302e;
}
</style>