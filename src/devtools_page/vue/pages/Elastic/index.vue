<template>
  <div class="environment-select">
    <div v-for="env in environments" :key="env.value">
      <input type="radio" :value="env.value" v-model="selectedEnv" :id="env.value" name="environment" @change="handleEnvChange" />
      <label :for="env.value">{{ env.label }}</label>
    </div>
  </div>
  <iframe class="elastic-iframe" :src="elasticSrc" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { devUrl, selectedEnv, environments } from './conf'

const elasticSrc = ref(devUrl)

function handleEnvChange() {
  const env = environments.find(e => e.value === selectedEnv.value);
  if (env && env.domain) {
    elasticSrc.value = env.domain
  } else {
  }
}

</script>

<style scoped lang="scss">
.environment-select {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  font-size: 18px;
  label {
    color: #409eff;
    cursor: pointer;
  }

  input[type="radio"] {
    margin-right: 5px;
  }
}

.elastic-iframe {
  width: 100%;
  height: 100%;
  border: 0px;
}
</style>