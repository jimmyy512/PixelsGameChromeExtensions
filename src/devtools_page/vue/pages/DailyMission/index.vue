<template>
  <div id="DailyMission">
    this is dasd
    {{ dailyImg }}
    <el-button type="primary" @click="btnClick">Primary</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
let dailyImg = ref('');

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.from === 'content_script') {
    dailyImg.value = request.message;
    console.log('Received message from content_script:', request.message);
  }
});

const tabId = chrome.devtools.inspectedWindow.tabId;
const btnClick = () => {
  chrome.runtime.sendMessage({
    from: 'devtools',
    action: 'CaptureDailyMission',
    tabId,
  });
};
</script>

<style lang="scss" scoped></style>
