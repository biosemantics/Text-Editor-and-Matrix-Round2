<template>
  <div id="app" class="has-background-white-ter">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App',
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
}
.denav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 30px;
}
a, a:hover, a:visited, a:active, a:focus {
  text-decoration: none;
  color: black;
}
</style>
