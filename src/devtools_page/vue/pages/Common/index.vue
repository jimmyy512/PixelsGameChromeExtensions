<template>
  <div id="CommonPage">
    <!-- <el-row class="CloudSaveBlock">
      <el-col :span="6">
        <div class="topBlock">雲端存檔時間</div>
        <div class="bottomBlock">
          {{ cloudTimestampDisplay }}
        </div>
      </el-col>
      <el-col :span="6">
        <el-button
          type="success"
          size="small"
          @click="SaveStorage.uploadSaveAllDataToCloudStorage"
          :icon="Upload"
        >
          上傳存檔
        </el-button>
      </el-col>

      <el-col :span="6">
        <el-button
          type="warning"
          size="small"
          @click="SaveStorage.downloadSaveAllDataFromCloudStorage"
          :icon="Download"
        >
          讀取存檔
        </el-button>
      </el-col>
    </el-row> -->

    <!-- 自動製作 -->
    <el-row>
      <el-col :span="12">
        <el-button
          type="primary"
          v-if="!IsAutoMake"
          @click="
            goMake();
            IsAutoMake = true;
          "
        >
          開始自動製作
        </el-button>
        <el-button type="warning" v-if="IsAutoMake" @click="IsAutoMake = false">
          停止自動製作
        </el-button>
      </el-col>
    </el-row>
    <!-- 基本快速採集 -->
    <template v-for="(item, key) in TimeCountState" :key="key">
      <el-row align="middle">
        <!-- {{ CountCONF[key].name }} -->
        <el-col :span="8">
          <div class="RowTitle">{{ CountCONF[key].name }}採集</div>
          <div class="resetBlock">
            <span class="resetBlockBtn" @click="resetTime(key)">
              計時重置
              <el-icon><Refresh /></el-icon>
            </span>
          </div>
        </el-col>

        <!-- <el-col :span="6"> </el-col> -->

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
              @click="
                TimeCountState[key].IsTriggerStart = false;
                saveData();
              "
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
              剩餘時間: <span>{{ item.DisplayLabel_CountDown }}</span>
              <span>-</span>
              <span class="FormatCountDown">
                ( {{ item.DisplayLabel_FormatCountDown }} )</span
              >
            </div>
          </template>
        </el-col>
      </el-row>
    </template>

    <!-- 自定義計時器 -->

    <template v-for="(item, key) in customizeData" :key="key">
      <el-row>
        <el-col :span="12"> {{ item }}</el-col>
      </el-row>
    </template>

    <el-row>
      <el-col :span="24" class="AddCountDowBlock">
        <el-input
          class="inputBlock"
          v-model="customizeInputData.name"
          placeholder="輸入備註"
        />
        <el-input
          class="inputBlock"
          v-model="customizeInputData.min"
          placeholder="輸入分鐘"
          type="number"
        />
        <el-button type="primary" @click="addToCustomizeData">
          添加計時器
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
  Ref,
  watchEffect,
  initCustomFormatter,
} from 'vue';
import { Upload, Download } from '@element-plus/icons-vue';
import { useConf } from '@/store';
import { ElMessage } from 'element-plus';
import { Refresh, Message } from '@element-plus/icons-vue';
import { inspectWindowEval } from '@/utils/utils';
import { CountCONF, CountConfKey } from '@/conf/index';
import SaveStorage from '@/utils/SaveStorage';

interface CountData {
  EndTimeStamp: number;
  DisplayLabel_CountDown: string;
  DisplayLabel_FormatCountDown: string;
  DiffSeconds: number; // 剩餘秒數
  IsTriggerStart: boolean; // true時 會卡黃色按鈕狀態
}

interface CustomizeCountData extends CountData {
  CustomizeName: string;
  CustomizeMin: number;
}

interface CustomizeInputData {
  name: string | null;
  min: number | null;
}

let customizeData: Ref<CustomizeCountData[]> = ref([]);

let IsAutoMake = ref(false);
const nowTimestamp = ref(Date.now());

const customizeInputData = reactive<CustomizeInputData>({
  name: null,
  min: null,
});

const addToCustomizeData = () => {
  if (customizeInputData.name && customizeInputData.min) {
    let time = Date.now();
    let EndTimeStamp = time + customizeInputData.min * 60 * 1000;
    customizeData.value.push({
      CustomizeName: customizeInputData.name,
      CustomizeMin: Number(customizeInputData.min),
      DiffSeconds: -1,
      DisplayLabel_CountDown: '',
      DisplayLabel_FormatCountDown: '',
      EndTimeStamp: EndTimeStamp,
      IsTriggerStart: false,
    });

    customizeInputData.min = null;
    customizeInputData.name = null;
  }
};

let cloudSaveTime = ref(-1);
const cloudTimestampDisplay = computed(() => {
  console.warn(
    'cloudSaveTime:',
    cloudSaveTime.value,
    cloudSaveTime.value === -1
  );
  if (cloudSaveTime.value === -1) {
    return '尚無讀取過雲端';
  } else {
    // 創建一個新的日期對象
    const date = new Date(cloudSaveTime.value);

    // 獲取月份、日期、小時和分鐘，並將其格式化（注意月份從0開始，所以要+1）
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${month}/${day} ${hours}:${minutes}`;
  }
});

const intervalEvent = setInterval(() => {
  nowTimestamp.value = Date.now();
}, 1000);

const intervalEvent2 = setInterval(() => {
  if (IsAutoMake.value) {
    goMake();
  }
}, 5000);

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
      console.warn('key as CountConfKey:', key as CountConfKey);
      state[key as CountConfKey] = {
        EndTimeStamp: -1,
        DisplayLabel_CountDown: '',
        DisplayLabel_FormatCountDown: '',
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
  SaveStorage.saveLocalStorage(
    SaveStorage.LocalStorageKey.Fast_Count_State,
    TimeCountState
  );
};

const resetTime = (resetKey: CountConfKey) => {
  TimeCountState[resetKey].EndTimeStamp = -1;
  TimeCountState[resetKey].IsTriggerStart = false;
};

let TimeCountState: Record<CountConfKey, CountData> = reactive(
  {} as Record<CountConfKey, CountData>
);
onMounted(() => {
  SaveStorage.loadLocalStorage(
    SaveStorage.LocalStorageKey.Fast_Count_State
  ).then((result: any) => {
    const newState = result ? result : createTimeCountState();
    for (const key in newState) {
      if (newState.hasOwnProperty(key)) {
        TimeCountState[key as CountConfKey] = newState[key];
      }
    }

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

          // 將結束時間點（EndTimeStamp）轉換成本地時間格式
          let endTime = new Date(item.EndTimeStamp);
          item.DisplayLabel_FormatCountDown = endTime.toLocaleTimeString(
            'zh-TW',
            {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }
          );
          item.DisplayLabel_CountDown = `${hours
            .toString()
            .padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')} `;
        }
      }
    });

    init();
  });
});

onBeforeUnmount(() => {
  clearInterval(intervalEvent);
  clearInterval(intervalEvent2);
});

const init = () => {
  SaveStorage.loadLocalStorage(
    SaveStorage.LocalStorageKey.Cloud_Save_Time_Stamp
  ).then((result: any) => {
    if (result) {
      cloudSaveTime.value = result;
    }
  });
};
</script>

<style scoped lang="scss">
#CommonPage {
  $MainTextColor: rgb(66, 185, 131);
  .RowTitle {
    font-size: 20px;
    font-weight: bold;
    display: flex;
    align-items: center;
  }
  .RowContent {
    font-size: 16px;
    color: white;
    .FormatCountDown {
      color: $MainTextColor;
    }
  }
  .el-row {
    margin-bottom: 20px;
  }

  .resetBlock {
    display: flex;
    align-items: center;
    .resetBlockBtn {
      cursor: pointer;
      &:hover {
        color: white;
      }
    }
  }

  .AddCountDowBlock {
    .inputBlock {
      width: 100px;
      margin-right: 10px;
    }
  }

  .CloudSaveBlock {
    display: flex;
    align-items: center;
    .topBlock {
      font-weight: bold;
    }
    .bottomBlock {
    }
  }
}
</style>
