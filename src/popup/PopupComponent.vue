<template>
  <a href="https://play.pixels.xyz/" target="_blank">
    <img src="./../assets/vitaly.png" class="logo" />
  </a>
  <h1>{{ getHello('Pixel') }}</h1>
  <a :href="getExtensionUrl('src/options/index.html')" target="_blank">
    Open options page 123
  </a>
</template>
<script setup lang="ts">
function getExtensionUrl(path: string) {
  return chrome.runtime.getURL(path);
}
function getHello(name: string) {
  return `Hello ${name}!`;
}
</script>

<style scoped>
@import '../common.css';
</style>
