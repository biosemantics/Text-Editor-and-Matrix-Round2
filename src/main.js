// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import * as firebase from 'firebase'

import Vue from 'vue'
import App from './App'
import router from './router'
import Buefy from 'buefy'
import VueResource from "vue-resource"
import LiquorTree from 'liquor-tree'
import VTooltip from 'v-tooltip'
window.$ = window.jQuery = require('jquery')

import {store} from '@/store/store'

import 'buefy/dist/buefy.css'
import './styles/style.scss'

Vue.use(Buefy);
Vue.use(VueResource);
Vue.use(LiquorTree);
Vue.use(VTooltip)

Vue.config.productionTip = false
let app = '';

firebase.initializeApp({
  apiKey: "AIzaSyAvOjVb9-SwCFiWGDr1L9_PGz1Ei-1FVDc",
  authDomain: "author2018-53022.firebaseapp.com",
  databaseURL: "https://author2018-53022.firebaseio.com",
  projectId: "author2018-53022",
  storageBucket: "author2018-53022.appspot.com",
  messagingSenderId: "515142910133"
});

firebase.auth().onAuthStateChanged(() => {
  if (!app) {
    app = new Vue({
      el: '#app',
      router,
      store,
      components: { App },
      template: '<App/>'
    });
  }
});
