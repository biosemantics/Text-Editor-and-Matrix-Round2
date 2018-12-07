// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import '@/network/firebase';

import Vue from 'vue'
import App from './App'
import router from './router'
import Buefy from 'buefy'
import VueResource from "vue-resource"
import VueFire from 'vuefire'

import {store} from '@/store/store'

import 'buefy/dist/buefy.css'
import './styles/style.css'

Vue.use(Buefy);
Vue.use(VueResource);
Vue.use(VueFire);

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>',
})
