<template>
  <div id="CommonPage">
    <template v-for="(item, key) in TimeCountState" :key="key">
      <el-row align="middle">
        <el-col :span="6">
          <div class="RowTitle">{{ CountCONF[key].name }}採集</div>
        </el-col>

        <el-col :span="6">
          <div class="resetBlock" @click="resetTime(key)">
            計時重置
            <el-icon><Refresh /></el-icon>
          </div>
        </el-col>

        <el-col :span="12">
          <template v-if="TimeCountState[key].EndTimeStamp === -1">
            <el-button
              type="success"
              @click="startCountDown(key)"
              v-if="!TimeCountState[key].IsTriggerStart"
            >
              開始計時
            </el-button>
            <el-button
              type="warning"
              @click="TimeCountState[key].IsTriggerStart = false"
              v-if="TimeCountState[key].IsTriggerStart"
            >
              我知道了!
            </el-button>
          </template>
          <template v-else>
            <div
              class="RowContent"
              :style="
                item.DiffSeconds < 180 && item.DiffSeconds >= 0
                  ? 'color:#ec4747;'
                  : ''
              "
            >
              剩餘時間: {{ item.DisplayLabel }}
            </div>
          </template>
        </el-col>
      </el-row>
    </template>

    <el-row>
      <el-col :span="12">
        <el-button
          type="success"
          v-if="!IsAutoMake"
          @click="
            goMake();
            IsAutoMake = true;
          "
          >開始自動製作
        </el-button>
        <el-button type="warning" v-if="IsAutoMake" @click="IsAutoMake = false"
          >停止自動製作
        </el-button>
      </el-col>
    </el-row>
  </div>
</template>
<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  onBeforeUnmount,
  reactive,
  ref,
  watchEffect,
} from 'vue';

import { useConf } from '@/store';
import { ElMessage } from 'element-plus';
import { Refresh, Message } from '@element-plus/icons-vue';
import { inspectWindowEval } from '@/utils/utils';
import { CountCONF, CountConfKey } from '@/conf/index';

interface CountData {
  Stage: number;
  EndTimeStamp: number;
  DisplayLabel: string;
  DiffSeconds: number;
  IsTriggerStart: boolean;
}

const intervalEvent = setInterval(() => {
  nowTimestamp.value = Date.now();
}, 1000);

const intervalEvent2 = setInterval(() => {
  if (IsAutoMake.value) {
    goMake();
  }
}, 5000);

let IsAutoMake = ref(false);

const nowTimestamp = ref(Date.now());

const goMake = () => {
  inspectWindowEval(
    `
    window.goClick = () => {
      document.querySelector(".Crafting_craftingButton__Qd6Ke").click();
    };
    window.goClick();
    setTimeout(() => window.goClick(), 3000);
`
  );
};

const createTimeCountState = () => {
  const state = {} as Record<CountConfKey, CountData>;
  for (const key in CountCONF) {
    if (Object.prototype.hasOwnProperty.call(CountCONF, key)) {
      state[key as CountConfKey] = {
        Stage: 0,
        EndTimeStamp: -1,
        DisplayLabel: '',
        DiffSeconds: -1,
        IsTriggerStart: false,
      };
    }
  }
  return state;
};

const startCountDown = (typeKey: CountConfKey) => {
  let time = Date.now();
  let countDownTime = CountCONF[typeKey].CountDown[0];
  TimeCountState[typeKey].EndTimeStamp = time + countDownTime * 1000;
  TimeCountState[typeKey].IsTriggerStart = true;
  saveData();
};

const saveData = () => {
  chrome.storage.local.set({ NoteState: TimeCountState });
};

const resetTime = (resetKey: CountConfKey) => {
  TimeCountState[resetKey].EndTimeStamp = -1;
  TimeCountState[resetKey].IsTriggerStart = false;
};

let TimeCountState: Record<CountConfKey, CountData> = reactive(
  {} as Record<CountConfKey, CountData>
);
onMounted(() => {
  chrome.storage.local.get('NoteState', result => {
    const newState = result.NoteState
      ? result.NoteState
      : createTimeCountState();
    for (const key in newState) {
      if (newState.hasOwnProperty(key)) {
        TimeCountState[key as CountConfKey] = newState[key];
      }
    }

    console.warn('asd', JSON.stringify(result.NoteState));

    watchEffect(() => {
      for (const key in TimeCountState) {
        let item = TimeCountState[key as keyof typeof TimeCountState];
        let diffTime = item.EndTimeStamp - nowTimestamp.value;
        item.DiffSeconds = Math.floor(diffTime / 1000);
        if (diffTime < 0) {
          item.EndTimeStamp = -1;
        } else {
          const hours = Math.floor(diffTime / 1000 / 60 / 60);
          const minutes = Math.floor((diffTime / 1000 / 60) % 60);
          const seconds = Math.floor((diffTime / 1000) % 60);
          item.DisplayLabel = `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
      }
    });
  });
});

onBeforeUnmount(() => {
  clearInterval(intervalEvent);
  clearInterval(intervalEvent2);
});
</script>

<style scoped lang="scss">
#CommonPage {
  .RowTitle {
    font-size: 20px;
    font-weight: bold;
    display: flex;
    align-items: center;
  }
  .RowContent {
    font-size: 16px;
    color: white;
  }
  .el-row {
    margin-bottom: 20px;
  }

  .resetBlock {
    cursor: pointer;
    display: flex;
    align-items: center;
    &:hover {
      color: white;
    }
  }
}
</style>
