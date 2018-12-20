<template>
  <div id="app" class="has-background-white-ter">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App',
  mounted() {
    this.$store.commit('INIT');
  }
}
</script>
