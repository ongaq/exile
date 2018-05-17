<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style lang="scss">
@import "../node_modules/bulma/bulma.sass";

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
body {
  margin: 0; padding: 0;
}
input:focus,
button:focus,
select:focus {
  outline: 0;
}
// .button {
//   -webkit-appearance: none;
//   appearance: none;
//   padding: 3px 8px;
//   background-color: #fff;
//   border: 1px solid #ccc;
//   border-radius: 3px;
// }
// .button--large {
//   display: block;
//   margin: 0 auto;
//   width: 170px;
//   height: 40px;
// }
</style>
