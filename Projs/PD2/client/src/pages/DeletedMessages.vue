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

                            <v-data-table item-value="_id" :headers="headers" :items="filteredMessages" :search="search"
                                :items-per-page="8" class="elevation-3" :sort-asc="[true]">


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

export default {
    data() {
        return {
            showUnreadOnly: false,
            dialog: false,
            search: '',
            headers: [
                {
                    align: 'start',
                    key: 'sender',
                    sortable: true,
                    title: 'Sender',
                },
                { key: 'subject', title: 'Subject' },
                { key: 'time', title: 'Time' },
            ],
            deletedMessages: [],
            user: ""

        }

    },

    async created() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log("Token is not available");
            this.$router.push('/login');
        } else {
            console.log("Token:", token);
            try {
                const res = await axiosInstance.get('/user', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                this.user = res.data.user.email;
                this.deletedMessages = res.data.user.deletedMessages;
            } catch (error) {
                console.error("Failed to retrieve user:", error);
                if (error.response && error.response.status === 401) {
                    this.$router.push('/login');
                }
            }
        }
    },

    methods: {
        openDialog(item) {
            this.selectedMessage = item;
            this.dialog = true;
        }

    },
    computed: {
        filteredMessages() {
            if (this.showUnreadOnly) {

                return this.deletedMessages.filter(item => item.read === 'false');
            }
            return [...this.deletedMessages].reverse()
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