<template>
    <v-card>
        <v-layout>
            <Header></Header>
            <v-main style="height: 855px;">
                <v-row>
                    <v-col cols="1" />
                    <v-col cols="10">
                        <v-card title="My Messages" flat class="cardd mt-5" tile>
                            <v-card-title class="d-flex align-center pe-2">
                                <v-checkbox v-model="showUnreadOnly" class="ml-15">Show Unread Only</v-checkbox>

                                <v-spacer></v-spacer>

                                <v-text-field v-model="search" label="Search" prepend-inner-icon="mdi-magnify"
                                    variant="outlined" hide-details single-line width="600"
                                    density="compact"></v-text-field>
                            </v-card-title>

                            <v-data-table v-model="selected" item-value="_id" :headers="headers"
                                :items="filteredMessages" :search="search" show-select :items-per-page="8"
                                class="elevation-3">

                                <template v-slot:item.sender="{ item }">
                                    <span :style="{ fontWeight: item.read === 'true' ? 'normal' : 'bold' }"
                                        @click="openDialog(item)">{{
                                            item.sender }}</span>
                                </template>
                                <template v-slot:item.subject="{ item }">
                                    <span :style="{ fontWeight: item.read === 'true' ? 'normal' : 'bold' }"
                                        @click="openDialog(item)">{{
                                            item.subject }}</span>
                                </template>
                                <template v-slot:item.time="{ item }">
                                    <span :style="{ fontWeight: item.read === 'true' ? 'normal' : 'bold' }"
                                        @click="openDialog(item)">{{ item.time
                                        }}</span>
                                </template>
                                <template v-slot:item.actions="{ item }">
                                    <v-tooltip bottom>
                                        <template v-slot:activator="{ props }">
                                            <v-icon class="me-2" size="small" @click="deleteItem(item)" v-bind="props">
                                                mdi-delete
                                            </v-icon>
                                        </template>
                                        <span>Delete Message</span>
                                    </v-tooltip>

                                    <v-tooltip bottom>
                                        <template v-slot:activator="{ props }">
                                            <v-icon size="small" @click="readItem(item)"
                                                :disabled="item.read === 'true'" v-bind="props">
                                                mdi-email-check-outline
                                            </v-icon>
                                        </template>
                                        <span>Mark as Read</span>
                                    </v-tooltip>
                                </template>
                            </v-data-table>
                            <v-btn color="#00302e" class="mr-5 mt-5" @click="deleteMultiple">Delete Selected</v-btn>
                            <v-btn color="#00302e" class="mr-5 mt-5" @click="markMultiple">Mark as Read Selected</v-btn>
                        </v-card>
                    </v-col>
                </v-row>
            </v-main>
        </v-layout>

    </v-card>
    <Footer></Footer>
    <v-dialog v-model="dialogDelete" max-width="500px">
        <v-card>
            <v-card-title class="dialogcard text-h5">Are you sure you want to delete this item?</v-card-title>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="#00302e" class="mr-5" @click="closeDelete">Cancel</v-btn>
                <v-btn color="#00302e" class="mr-5" variant="text" @click="deleteItemConfirm">OK</v-btn>
                <v-spacer></v-spacer>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-dialog v-model="dialogRead" max-width="500px">
        <v-card>
            <v-card-title class="dialogcard text-h5">Are you sure you want to mark this message as read?</v-card-title>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="#00302e" class="mr-5" @click="closeRead">Cancel</v-btn>
                <v-btn color="#00302e" class="mr-5" variant="text" @click="readItemConfirm">OK</v-btn>
                <v-spacer></v-spacer>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-dialog v-model="dialog" max-width="600px">
        <v-card>
            <v-card-title class="text-h5">Message Details</v-card-title>
            <v-card-text>
                <p><strong>From:</strong> {{ selectedMessage.sender }}</p>
                <p><strong>Subject:</strong> {{ selectedMessage.subject }}</p>
                <p><strong>Time:</strong> {{ selectedMessage.time }}</p>
                <p><strong>Content:</strong> {{ selectedMessage.content }}</p>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="dialog = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

</template>

<script>
import axiosInstance from '@/plugins/http';
import { de } from 'vuetify/locale';
export default {
    data() {
        return {
            selected: [],
            showUnreadOnly: false,
            dialogRead: false,
            dialogDelete: false,
            dialog: false,
            search: '',
            token: '',
            headers: [
                {
                    align: 'start',
                    key: 'sender',
                    sortable: true,
                    title: 'Sender',
                },
                { key: 'subject', title: 'Subject' },
                { key: 'time', title: 'Time' },
                { key: 'read', title: 'Read' },

                { title: 'Actions', key: 'actions', sortable: false },
            ],
            messages: [],
            user: ""

        }

    },

    async created() {
        this.token = localStorage.getItem('token');
        if (!this.token) {
            console.log("Token is not available");
            this.$router.push('/login');
        } else {
            try {
                console.log("Token:", this.token);
                const response = await axiosInstance.get('/user', {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
                this.user = response.data.user.email;
                this.messages = response.data.user.mensagens;
                console.log("Messages loaded:", this.messages.map(m => m._id));
                const privateKey = await this.retrievePrivateKeyFromIndexedDB(this.user);
                if (!privateKey) {
                    throw new Error("Não foi possível recuperar a chave privada");
                }

                // Descriptografar mensagens
                for (let message of this.messages) {
                    message.content = await this.decryptMessage(message.content, privateKey);
                }
            } catch (error) {
                console.error("Failed to retrieve user:", error);
                if (error.response && error.response.status === 401) {
                    // Redirecionar para o login se o token for inválido ou expirado
                    this.$router.push('/login');
                }
            }
        }
    },

    watch: {
        dialogRead(val) {
            val || this.closeRead()
        },
        dialogDelete(val) {
            val || this.closeDelete()
        },

    },
    methods: {
        openDB(name, version, upgradeCallback) {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(name, version);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
                request.onupgradeneeded = (event) => {
                    upgradeCallback(event.target.result);
                };
            });
        },

        retrievePrivateKeyFromIndexedDB() {
            return new Promise(async (resolve, reject) => {
                try {
                    const email = this.user; // Asegure-se que this.user está definido e é o email correto
                    const db = await this.openDB('cryptoKeys', 1, (db) => {
                        if (!db.objectStoreNames.contains('privateKeys')) {
                            db.createObjectStore('privateKeys', { keyPath: 'id' });
                        }
                    });
                    const transaction = db.transaction(['privateKeys'], 'readonly');
                    const store = transaction.objectStore('privateKeys');
                    const request = store.get(email);
                    request.onsuccess = () => {
                        if (request.result) {
                            console.log("Chave privada recuperada com sucesso:", request.result.key);
                            resolve(request.result.key);
                        } else {
                            console.log("Nenhuma chave privada encontrada para este email.");
                            resolve(null);
                        }
                    };
                    request.onerror = () => {
                        console.error("Erro ao recuperar a chave privada:", request.error);
                        reject(request.error);
                    };
                } catch (error) {
                    console.error("Erro ao abrir o banco de dados IndexedDB:", error);
                    reject(error);
                }
            });
        },

        isValidBase64(str) {
            const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
            return base64Regex.test(str);
        },

        async decryptMessage(encryptedData, privateKey) {
            if (!this.isValidBase64(encryptedData)) {
                console.error("A mensagem para descriptografar não está codificada corretamente em base64.");
                return null;  // ou manipule de outra forma adequada
            } else {
                console.log("É válido")
            }

            const decodedData = window.atob(encryptedData); // Decodifica de Base64
            const arrayBuffer = new Uint8Array(decodedData.split("").map(char => char.charCodeAt(0))).buffer;
            console.log("Decoded Data: " + decodedData)

            try {
                const decrypted = await window.crypto.subtle.decrypt(
                    {
                        name: "RSA-OAEP"
                    },
                    privateKey,
                    arrayBuffer
                );
                const decoder = new TextDecoder();
                return decoder.decode(decrypted);
            } catch (error) {
                console.error("Falha ao descriptografar a mensagem:", error);
                return null;
            }
        },






        async deleteMultiple() {
            console.log(this.selected)

            try {
                const response = await axiosInstance.post('/deletemessages', {
                    ids: this.selected,
                    userEmail: this.user
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });

                if (response.status === 200) {
                    this.messages = this.messages.filter(item => !this.selected.includes(item._id));
                    this.selected = [];
                    console.log('Messages deleted successfully');
                } else {
                    console.warn('Failed to delete messages:', response.data.message);
                }
            } catch (error) {
                console.error('Error deleting messages:', error);

                if (error.response) {
                    if (error.response.status === 401 || error.response.status === 403) {
                        console.error('Authentication error:', error.response.statusText);
                    } else {
                        console.error('HTTP error:', error.response.statusText);
                    }
                } else {
                    console.error('Network or unknown error occurred:', error);
                }
            }
        },
        async markMultiple() {
            try {
                const response = await axiosInstance.put('/markmessages', {
                    ids: this.selected,
                    userEmail: this.user,
                    read: 'true'
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });

                if (response.status === 200) {
                    this.messages.forEach(item => {
                        if (this.selected.includes(item._id)) {
                            item.read = 'true';
                        }
                    });
                    this.selected = [];
                    console.log('Messages marked as read successfully');
                } else {
                    console.warn('Failed to mark messages as read:', response.data.message);
                }
            } catch (error) {
                console.error('Error marking messages as read:', error);
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    console.error('Authentication error:', error.response.statusText);
                } else if (error.response) {
                    console.error('HTTP error:', error.response.statusText);
                } else {
                    console.error('Network or unknown error occurred:', error);
                }
            }
        },
        deleteItem(item) {
            this.editedIndex = this.messages.indexOf(item)
            this.editedItem = Object.assign({}, item)
            this.dialogDelete = true
        },

        async deleteItemConfirm() {
            try {
                await axiosInstance.delete(`/messages/${this.editedItem._id}`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    },
                    data: {
                        userEmail: this.user
                    }
                });
                this.messages.splice(this.editedIndex, 1);
                this.closeDelete();
            } catch (error) {
                console.error("Message deletion error:", error);
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    console.error('Authentication error:', error.response.statusText);
                } else if (error.response) {
                    console.error('HTTP error:', error.response.statusText);
                } else {
                    console.error('Network or unknown error occurred:', error);
                }
            }
        },
        closeDelete() {
            this.dialogDelete = false
        },
        readItem(item) {
            this.editedIndex = this.messages.indexOf(item)
            this.editedItem = Object.assign({}, item)
            this.dialogRead = true
        },

        async readItemConfirm() {
            try {
                const response = await axiosInstance.put(`/messages/${this.editedItem._id}`, {
                    userEmail: this.user,
                    read: true
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });

                if (response.status === 200) {
                    const message = this.messages.find(m => m._id === this.editedItem._id);
                    if (message) {
                        message.read = "true";
                    }
                    this.dialogRead = false;
                }
                this.closeDelete();
            } catch (error) {
                console.error("Error updating message read status:", error);
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    console.error('Authentication error:', error.response.statusText);
                } else if (error.response) {
                    console.error('HTTP error:', error.response.statusText);
                } else {
                    console.error('Network or unknown error occurred:', error);
                }
            }
        },
        closeRead() {
            this.dialogRead = false
        },
        openDialog(item) {
            this.selectedMessage = item;
            this.dialog = true;
        }

    },
    computed: {
        filteredMessages() {
            if (this.showUnreadOnly) {
                return this.messages.filter(item => item.read === 'false');
            }
            return [...this.messages].reverse()
        }
    }
}
</script>

<style>
.cardd {
    background-color: #00302e;
}

.btn {
    background-color: #00302e;
}

.dialogcard {
    color: white;
    background-color: #00302e;
}
</style>