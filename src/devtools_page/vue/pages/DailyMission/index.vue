<template>
  <div id="DailyMission">
    this is dasd
    {{ dailyImg }}

    <img class="DailyImg" :src="dailyImg" alt="" />
    <el-button type="primary" @click="btnClick">Primary</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
let dailyImg = ref('');

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.warn('devtool onMessage', request);
  if (request.from === 'content_script') {
    if (request.action === 'ChromeAction_END_CAPTURE') {
      dailyImg.value = request.data;
      console.log('Received message from content_script:', request.data);
    }
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

<style lang="scss" scoped>
#DailyMission {
  width: 100%;
  height: auto;
  .DailyImg {
    display: block;
    width: 100%;
    height: auto;
  }
}
</style>
