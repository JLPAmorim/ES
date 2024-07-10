<template>
    <v-app>
        <v-row justify="center" no-gutters>
            <v-col cols="6" md="6">
                <!--Image on left side-->
                <v-card color="transparent" height="100vh" tile>
                    <v-img src="../assets/register.jpg" height="100vh" cover>
                        <v-overlay color="#E2B887" opacity=".4" absolute></v-overlay></v-img>
                </v-card>
            </v-col>
            <v-col cols="6" md="6">

                <!--Actual sign in part-->
                <v-card color="white" height="100vh" tile>
                    <v-card-text class="text-center my-auto title-prop mt-15">Bem vindo de volta!
                        <v-card-text class="text-center" style="color: #00302e; font-size: 17px; opacity: 0.7;">
                            Faça Login para aceder à sua conta
                        </v-card-text>
                    </v-card-text>
                    <v-card class="form-prop px-auto" flat>
                        <h4 class="red--text mb-5" v-if="showError">
                            Erro na submissão. Por favor corrija os erros e tente
                            novamente!
                        </h4>
                        <v-form ref="form" v-model="valid">
                            <v-text-field v-model="email" label="Email" type="text" color="#00302e" outlined
                                :rules="[...rules.email, ...rules.required]" />
                            <v-text-field v-model="password" :type="showPassword ? 'text' : 'password'" label="Password"
                                append-icon="mdi-eye" @click:append="togglePassword"
                                :rules="rules.required"></v-text-field>
                        </v-form>
                    </v-card>

                    <v-btn class="aut-btn text-none" @click="login" depressed>Login</v-btn>

                    <v-btn class="create-acc-prop text-none" text id="no-background-hover" plain to="/register">
                        Não possuí conta? Efetue o Registo
                    </v-btn>
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
            email: "",
            password: "",
            showPassword: false,
            showError: false,
            valid: false,

            rules: {
                required: [(v) => !!v || "Field is required"],
                email: [v => !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || 'E-mail must be valid'],
                min: v => v.length >= 8 || 'Min 8 characters'
            },
        };
    },
    created() {

    },

    methods: {
        async login() {
            const { valid } = await this.$refs.form.validate();

            if (valid) {
                let loginUser = {
                    email: this.email,
                    password: this.password,
                };

                try {
                    const response = await axiosInstance.post(`/login`, loginUser);
                    console.log(response);
                    localStorage.setItem('token', response.data.token);
                    console.log("Token no Login: " + localStorage.getItem('token'));
                    this.$router.push("/sendmessage");
                } catch (error) {
                    console.log(error);
                    this.showError = true;
                }
            } else {
                console.log("invalido");
            }
        },

        togglePassword() {
            this.showPassword = !this.showPassword;
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
    position: absolute;
    bottom: 65%;
    left: 27%
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
    top: 61%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 3vh;
    height: 7vh !important;
    width: 30vw;
}

.pass-prop {
    color: #00302e !important;
    position: absolute;
    top: 67%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.5vh;
    width: 30vw;
}

.create-acc-prop {
    color: #00302e !important;
    background-color: #eeeeee;
    position: absolute;
    top: 68%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.7vh;
    width: 30vw;
}
</style>