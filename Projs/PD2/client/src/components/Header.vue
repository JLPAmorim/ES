<template>
  <v-app-bar color="#00302e" prominent>
    <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>

    <v-toolbar-title>MailUM</v-toolbar-title>

    <v-spacer></v-spacer>

    <div class="text-center">
      <v-menu v-model="menu" :close-on-content-click="false">

        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" class="mr-10">
            <v-avatar>
              <v-img src="../assets/default.png" />
            </v-avatar>
          </v-btn>
        </template>


        <v-card min-width="300">
          <v-list>
            <v-list-item prepend-avatar="@/assets/default.png" :subtitle="email" :title="name">
            </v-list-item>
          </v-list>

          <v-divider></v-divider>

          <v-list>
            <v-list-item prepend-icon="mdi-email-edit-outline" title="New Message" value="send"
              to="sendmessage"></v-list-item>
            <v-list-item prepend-icon="mdi-mailbox-open-outline" title="My Messages" value="inbox"
              to="mymessages"></v-list-item>
            <v-list-item prepend-icon="mdi-arrow-right-bold-box-outline" title="Sent Messages" value="sent"
              to="sentmessages"></v-list-item>
            <v-list-item prepend-icon="mdi-trash-can-outline" title="Deleted Messages" value="deleted"
              to="deletedmessages"></v-list-item>
            <v-list-item prepend-icon="mdi-star-outline" title="Favourites" value="favourites"
              to="favourites"></v-list-item>
          </v-list>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn color="#00302e" variant="text" @click="logout()">
              Logout
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>
    </div>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" permanent>
    <v-list nav>
      <v-list-item prepend-icon="mdi-email-edit-outline" title="New Message" value="send"
        to="sendmessage"></v-list-item>
      <v-list-item prepend-icon="mdi-mailbox-open-outline" title="My Messages" value="inbox"
        to="mymessages"></v-list-item>
      <v-list-item prepend-icon="mdi-arrow-right-bold-box-outline" title="Sent Messages" value="sent"
        to="sentmessages"></v-list-item>
      <v-list-item prepend-icon="mdi-trash-can-outline" title="Deleted Messages" value="deleted"
        to="deletedmessages"></v-list-item>
      <v-list-item prepend-icon="mdi-star-outline" title="Favourites" value="favourites" to="favourites"></v-list-item>
    </v-list>
  </v-navigation-drawer>
  <v-dialog v-model="dialogLogout" max-width="500px">
    <v-card>
      <v-card-title class="dialogcard text-h5">Are you sure you want to Logout?</v-card-title>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="#00302e" class="mr-5" @click="closeLogout">Cancel</v-btn>
        <v-btn color="#00302e" class="mr-5" variant="text" @click="confirmLogout">OK</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import axiosInstance from '@/plugins/http';

export default {
  data: () => ({
    imagePath: '@/assets/default.png',
    drawer: true,
    menu: false,
    message: false,
    hints: true,
    dialogLogout: false,
    name: "",
    email: "",
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
        const firstName = response.data.user.firstName;
        const lastName = response.data.user.lastName;
        this.name = firstName + " " + lastName
        this.email = response.data.user.email;
      } catch (error) {
        console.error("Failed to retrieve user:", error);
        if (error.response && error.response.status === 401) {
          this.$router.push('/login');
        }
      }
    }
  },
  methods: {
    logout() {
      this.dialogLogout = true
    },
    confirmLogout() {
      // Limpa a token do localStorage
      localStorage.removeItem('token');

      // Redireciona para a rota de login
      this.$router.push('/login');
    },
    closeLogout() {
      this.dialogLogout = false
    },
  }




}
</script>

<style scoped>
.v-list-item {
  align-items: center;
  /* Centraliza verticalmente o ícone e o texto */
}

.v-list-item-icon {
  margin-right: 16px;
  /* Adiciona espaço entre o ícone e o texto */
}
</style>