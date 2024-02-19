<template>
  <div id="Market">
    <iframe class="market-iframe" :src="ProjectConfig.MarketIframeURL" />
  </div>
</template>

<script setup lang="ts">
import ProjectConfig from '@/conf/ProjectConfig.json';
</script>

<style lang="scss" scoped>
#Market {
  .market-iframe {
    width: 100%;
    height: 100%;
    border: 0px;
  }
}
</style>
