<template>
  <div id="ClickBotPage">
    <!-- 1. 座標組數設定 -->
    <el-row>
      <div class="ParamRow">
        <div class="RowTitle">座標組數:</div>
        <el-input
          class="RowInput"
          v-model.number="coordCount"
          type="number"
          min="1"
        />
      </div>
    </el-row>

    <!-- 2. 動態座標與延遲輸入 -->
    <el-row
      v-for="(coord, idx) in coords"
      :key="idx"
      style="margin-bottom: 10px"
    >
      <div class="ParamRow" style="margin-right: 20px">
        <div class="RowTitle">點擊X {{ idx + 1 }}:</div>
        <el-input
          class="RowInput"
          v-model.number="coord.x"
          type="number"
          min="1"
        />
      </div>
      <div class="ParamRow" style="margin-right: 20px">
        <div class="RowTitle">點擊Y {{ idx + 1 }}:</div>
        <el-input
          class="RowInput"
          v-model.number="coord.y"
          type="number"
          min="1"
        />
      </div>
      <div class="ParamRow" v-if="idx < coords.length - 1">
        <div class="RowTitle">延遲 → 下一點 (秒):</div>
        <el-input
          class="RowInput"
          v-model.number="coord.delaySec"
          type="number"
          min="0"
        />
      </div>
    </el-row>

    <!-- 3. 一輪間隔與亂數設定（秒） -->
    <el-row>
      <div class="ParamRow" style="margin-right: 20px">
        <div class="RowTitle">一輪間隔 (秒):</div>
        <el-input
          class="RowInput"
          v-model.number="clickSettings.intervalSec"
          type="number"
          min="0"
        />
      </div>
      <div class="ParamRow">
        <div class="RowTitle">間隔亂數 (秒):</div>
        <el-input
          class="RowInput"
          v-model.number="clickSettings.randomOffsetSec"
          type="number"
          min="0"
        />
      </div>
    </el-row>

    <!-- 4. 控制按鈕 -->
    <el-row style="margin-bottom: 15px">
      <el-button type="primary" @click="startClickBot" :disabled="isClicking"
        >開始自動點擊</el-button
      >
      <el-button type="primary" @click="stopClickBot" :disabled="!isClicking"
        >關閉自動點擊</el-button
      >
    </el-row>

    <!-- 5. 即時滑鼠座標 -->
    <el-row>
      <div class="ParamRow">
        <div class="RowTitle">當前鼠標座標:</div>
        <div class="RowXYInfo">
          X: <span>{{ mouseInfo.x }}</span> &nbsp; Y:
          <span>{{ mouseInfo.y }}</span>
        </div>
      </div>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue';
import { inspectWindowEval } from '@/utils/utils';
import { ElMessage } from 'element-plus';

/** ---------------- 全域設定 ---------------- */
const clickSettings = reactive({
  intervalSec: 0, // 一輪結束後的額外間隔（秒）
  randomOffsetSec: 0, // 隨機亂數偏移（秒）
});

/** ---------------- 座標設定 ---------------- */
interface Coord {
  x: number;
  y: number;
  /** 到下一座標前額外延遲 (秒) */
  delaySec: number;
}

const coordCount = ref(1);
const coords = reactive<Coord[]>([{ x: 0, y: 0, delaySec: 1 }]);

/** 動態增減座標組 */
watch(coordCount, newVal => {
  if (newVal < 1) coordCount.value = 1;
  const diff = newVal - coords.length;
  if (diff > 0) {
    for (let i = 0; i < diff; i++) coords.push({ x: 0, y: 0, delaySec: 1 });
  } else if (diff < 0) coords.splice(newVal);
});

/** ---------------- 滑鼠座標監聽 ---------------- */
const mouseInfo = reactive({ x: 0, y: 0 });
let mouseInjectTimer: NodeJS.Timeout | null = null;
let mouseUpdateTimer: NodeJS.Timeout | null = null;

/** ---------------- 自動點擊邏輯 ---------------- */
const isClicking = ref(false);
let clickTimeout: NodeJS.Timeout | null = null;
let currentCoordIdx = 0;
const tabId = chrome.devtools.inspectedWindow.tabId;

const startClickBot = () => {
  if (isClicking.value || !coords.length) return;
  chrome.debugger.attach({ tabId }, '1.3', () => {
    if (chrome.runtime.lastError) {
      ElMessage.error(chrome.runtime.lastError.message);
      return;
    }
    isClicking.value = true;
    nextClick();
  });
};

const stopClickBot = () => {
  clearTimeout(clickTimeout as NodeJS.Timeout);
  clickTimeout = null;
  if (isClicking.value) chrome.debugger.detach({ tabId });
  isClicking.value = false;
  currentCoordIdx = 0;
};

/** 依序點擊各座標，完成後依設定間隔再次循環 */
const nextClick = () => {
  const coord = coords[currentCoordIdx];
  dispatchClick(coord.x, coord.y);

  // 計算延遲時間（毫秒）
  const baseIntervalMs = clickSettings.intervalSec * 1000;
  const randomMs = Math.random() * clickSettings.randomOffsetSec * 1000;
  const extraDelayMs = coord.delaySec * 1000;
  const totalDelay = baseIntervalMs + randomMs + extraDelayMs;

  currentCoordIdx = (currentCoordIdx + 1) % coords.length;
  clickTimeout = setTimeout(() => {
    if (isClicking.value) nextClick();
  }, totalDelay);
};

const dispatchClick = (x: number, y: number) => {
  const downEvt = {
    type: 'mousePressed',
    button: 'left',
    clickCount: 1,
    x,
    y,
  } as const;
  const upEvt = { ...downEvt, type: 'mouseReleased' } as const;

  chrome.debugger.sendCommand(
    { tabId },
    'Input.dispatchMouseEvent',
    downEvt,
    () => {
      chrome.debugger.sendCommand(
        { tabId },
        'Input.dispatchMouseEvent',
        upEvt,
        () => {
          if (chrome.runtime.lastError) {
            console.error(
              'Mouse Click Error:',
              chrome.runtime.lastError.message,
            );
            stopClickBot();
          }
        },
      );
    },
  );
};

/** 注入滑鼠追蹤腳本 (避免頁面刷新後失效) */
const injectMouseTracker = () => {
  inspectWindowEval(`
    document.removeEventListener('mousemove', window.__CLICK_BOT_HANDLER__);
    window.__CLICK_BOT_HANDLER__ = e => { window.__CLICK_BOT_MOUSE_INFO__ = { x: e.clientX, y: e.clientY }; };
    document.addEventListener('mousemove', window.__CLICK_BOT_HANDLER__);
  `);
};

onMounted(() => {
  mouseInjectTimer = setInterval(injectMouseTracker, 3000);
  mouseUpdateTimer = setInterval(() => {
    inspectWindowEval('window.__CLICK_BOT_MOUSE_INFO__').then((info: any) => {
      if (info) {
        mouseInfo.x = info.x;
        mouseInfo.y = info.y;
      }
    });
  }, 300);
});

onUnmounted(() => {
  stopClickBot();
  clearInterval(mouseInjectTimer as NodeJS.Timeout);
  clearInterval(mouseUpdateTimer as NodeJS.Timeout);
});
</script>

<style scoped lang="scss">
#ClickBotPage {
  .ParamRow {
    margin-bottom: 20px;

    .RowTitle {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 7px;
    }

    .RowInput {
      width: 100px;
    }

    .RowXYInfo {
      font-size: 16px;
      font-weight: bold;

      span {
        color: skyblue;
      }
    }
  }
}
</style>
