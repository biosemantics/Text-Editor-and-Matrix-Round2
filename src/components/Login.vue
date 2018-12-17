<template>
    <section class="container login-wrapper">
        <div class="login-form">
            <b-field label="Email">
                <b-input type="email" v-model="email"
                    maxlength="30">
                </b-input>
            </b-field>

            <b-field label="Password">
                <b-input type="password" v-model="password"
                    password-reveal>
                </b-input>
            </b-field>
            <button class="button is-dark is-rounded" @click="login">Login</button>
            <button class="button is-dark is-rounded" @click="signup">Signup</button>
        </div>
    </section>
</template>

<script>
import firebase from 'firebase';
import API from '@/network/api';
import { mapMutations } from 'vuex';

export default {
    name: 'Login',
    data() {
        return {
            email: '',
            password: ''
        }
    },
    methods: {
        ...mapMutations([
            'SET_USER'
        ]),
        login() {
            firebase.auth().signInWithEmailAndPassword(this.email, this.password)
            .then(resp => {
                // API.loginLog(this, resp.user);
                this.SET_USER(resp.user);
                this.$router.replace('/home');
            })
            .catch( error => {
                alert(error.message);
                return;
            });
        },
        signup() {
            firebase.auth().createUserWithEmailAndPassword(this.email, this.password)
            .then(user => {
                this.$router.replace('/home');
            })
            .catch( error => {
                alert(error.message);
                return;
            });
        },
    }
}
</script>