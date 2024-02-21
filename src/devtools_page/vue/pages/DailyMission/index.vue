<template>
  <div id="DailyMission">
    <div class="tip">只要打開每日任務頁面，就會自動截圖到此處</div>

    <img class="DailyImg" :src="dailyImg" alt="" />
    <!-- <el-button type="primary" @click="startCapture">Primary</el-button> -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
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

const interval = setInterval(() => {
  startCapture();
}, 1000);

onUnmounted(() => {
  clearInterval(interval);
});

const startCapture = () => {
  const tabId = chrome.devtools.inspectedWindow.tabId;
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
  .tip {
    margin-bottom: 20px;
  }
}
</style>
