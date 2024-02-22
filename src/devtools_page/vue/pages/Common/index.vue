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
    <template v-for="(item, key, index) in TimeCountState" :key="key">
      <el-row align="middle">
        <el-col :span="8">
          <div class="RowTitle">{{ CountCONF[key].name }}採集</div>
          <div class="resetBlock">
            <span class="resetBlockBtn" @click="resetTime(item)">
              計時重置
              <el-icon><Refresh /></el-icon>
            </span>
          </div>
        </el-col>

        <el-col :span="12">
          <template v-if="item.EndTimeStamp === -1">
            <el-button
              type="success"
              @click="startCountDown(item, CountCONF[key].CountDown[0])"
              v-if="!item.IsTriggerStart"
            >
              開始計時
            </el-button>
            <el-button
              type="warning"
              @click="
                item.IsTriggerStart = false;
                saveData();
              "
              v-if="item.IsTriggerStart"
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
              <span>&nbsp;-&nbsp;</span>
              <span class="FormatCountDown">
                ( {{ item.DisplayLabel_FormatCountDown }} )</span
              >
            </div>
          </template>
        </el-col>
      </el-row>
    </template>

    <!-- 自定義計時器 -->
    <template v-for="(item, index) in customizeData" :key="index">
      <!-- 正常顯示 -->
      <template v-if="!item.IsEditMode">
        <el-row>
          <el-col :span="8">
            <div class="RowTitle">{{ item.CustomizeName }}</div>
            <div class="resetBlock">
              <span class="customBtn resetBlockBtn" @click="resetTime(item)">
                重置
                <el-icon><Refresh /></el-icon>
              </span>
              <span
                class="customBtn resetBlockBtn editBlockBtn"
                @click="
                  item.IsEditMode = true;
                  item.EditName = item.CustomizeName;
                  item.EditMin = item.CustomizeMin;
                  saveData();
                "
              >
                編輯
                <el-icon><Edit /></el-icon>
              </span>
              <span
                class="customBtn resetBlockBtn deleteBlockBtn"
                @click="
                  customizeData.splice(index, 1);
                  saveData();
                "
              >
                刪除
                <el-icon><Delete /></el-icon>
              </span>
            </div>
          </el-col>

          <el-col :span="12">
            <template v-if="item.EndTimeStamp === -1">
              <el-button
                type="success"
                @click="startCountDown(item, item.CustomizeMin * 60)"
                v-if="!item.IsTriggerStart"
              >
                開始計時
              </el-button>
              <el-button
                type="warning"
                @click="
                  item.IsTriggerStart = false;
                  saveData();
                "
                v-if="item.IsTriggerStart"
              >
                我知道了!
              </el-button>
            </template>
            <template v-else>
              <div
                class="CustomRowContent"
                :style="
                  item.DiffSeconds < 180 && item.DiffSeconds >= 0
                    ? 'color:#ec4747;'
                    : ''
                "
              >
                剩餘時間: <span>{{ item.DisplayLabel_CountDown }}</span>
                <span>&nbsp;-&nbsp;</span>
                <span class="FormatCountDown">
                  ( {{ item.DisplayLabel_FormatCountDown }} )</span
                >
              </div>
            </template>
          </el-col>
        </el-row>
      </template>

      <template v-if="item.IsEditMode">
        <el-row>
          <el-col :span="24" class="EditCountDownBlock">
            <el-input
              class="inputBlock"
              v-model="item.EditName"
              placeholder="編輯備註"
            />
            <el-input
              class="inputBlock"
              v-model="item.EditMin"
              placeholder="編輯分鐘"
              type="number"
            />
            <el-icon
              class="EditActionBtn"
              @click="
                item.CustomizeName = item.EditName;
                item.CustomizeMin = item.EditMin;
                item.IsEditMode = false;
                saveData();
              "
            >
              <Check />
            </el-icon>
            <el-icon
              class="EditActionBtn CloseActionBtn"
              @click="
                item.IsEditMode = false;
                saveData();
              "
            >
              <Close />
            </el-icon>
          </el-col>
        </el-row>
      </template>
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
import {
  Upload,
  Download,
  Delete,
  Edit,
  Check,
  Close,
} from '@element-plus/icons-vue';
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
  CustomizeMin: number | null;
  EditName: string; // 編輯名稱input
  EditMin: number | null; // 編輯分鐘input
  IsEditMode: boolean; // 是否為編輯模式
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

let cloudSaveTime = ref(-1);

const intervalEvent = setInterval(() => {
  nowTimestamp.value = Date.now();
}, 1000);

const intervalEvent2 = setInterval(() => {
  if (IsAutoMake.value) {
    goMake();
  }
}, 5000);

let TimeCountState: Record<CountConfKey, CountData> = reactive(
  {} as Record<CountConfKey, CountData>
);

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
      IsTriggerStart: true,
      EditName: '',
      EditMin: null,
      IsEditMode: false,
    });

    customizeInputData.min = null;
    customizeInputData.name = null;

    console.warn('wtf:', customizeData.value);

    saveData();
  } else {
    ElMessage.warning('檢查欄位是否都有正確填寫');
  }
};

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

const startCountDown = (item: CountData, countDownTime: number) => {
  let time = Date.now();
  item.EndTimeStamp = time + countDownTime * 1000;
  item.IsTriggerStart = true;
  saveData();
};

const saveData = () => {
  SaveStorage.saveLocalStorage(
    SaveStorage.LocalStorageKey.Fast_Count_State,
    TimeCountState
  );

  SaveStorage.saveLocalStorage(
    SaveStorage.LocalStorageKey.Customize_Count_State,
    JSON.stringify(customizeData.value)
  );
};

const resetTime = (countData: CountData) => {
  countData.EndTimeStamp = -1;
  countData.IsTriggerStart = false;
  saveData();
};

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

const countStateCalculate = (countData: CountData) => {
  let diffTime = countData.EndTimeStamp - nowTimestamp.value;
  countData.DiffSeconds = Math.floor(diffTime / 1000);
  if (diffTime < 0) {
    countData.EndTimeStamp = -1;
  } else {
    const hours = Math.floor(diffTime / 1000 / 60 / 60);
    const minutes = Math.floor((diffTime / 1000 / 60) % 60);
    const seconds = Math.floor((diffTime / 1000) % 60);

    // 將結束時間點（EndTimeStamp）轉換成本地時間格式
    let endTime = new Date(countData.EndTimeStamp);
    countData.DisplayLabel_FormatCountDown = endTime.toLocaleTimeString(
      'zh-TW',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }
    );
    countData.DisplayLabel_CountDown = `${hours
      .toString()
      .padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')} `;
  }
};

const init = () => {
  SaveStorage.loadLocalStorage(
    SaveStorage.LocalStorageKey.Cloud_Save_Time_Stamp
  ).then((result: any) => {
    if (result) {
      cloudSaveTime.value = result;
    }
  });
};

onMounted(() => {
  SaveStorage.loadLocalStorage(
    SaveStorage.LocalStorageKey.Fast_Count_State
  ).then((result: any) => {
    const newState = result ? result : createTimeCountState();
    for (const key in newState) {
      if (newState.hasOwnProperty(key)) {
        TimeCountState[key as CountConfKey] =
          newState[key as keyof typeof TimeCountState];
      }
    }

    SaveStorage.loadLocalStorage(
      SaveStorage.LocalStorageKey.Customize_Count_State
    ).then((result: any) => {
      if (result) {
        customizeData.value = JSON.parse(result);
      }
    });

    watchEffect(() => {
      for (const key in TimeCountState) {
        let item = TimeCountState[key as CountConfKey];
        countStateCalculate(item);
      }

      customizeData.value.forEach(item => {
        countStateCalculate(item);
      });
    });

    init();
  });
});

onBeforeUnmount(() => {
  clearInterval(intervalEvent);
  clearInterval(intervalEvent2);
});
</script>

<style scoped lang="scss">
$CloseColor: rgb(245, 108, 108);
$WarningColor: rgb(230, 162, 60);
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
    height: 100%;
    display: flex;
    align-items: center;
    .FormatCountDown {
      color: $MainTextColor;
    }
  }
  .CustomRowContent {
    @extend .RowContent;
  }

  .el-row {
    margin-bottom: 20px;
  }

  .resetBlock {
    display: flex;
    align-items: center;
    .resetBlockBtn {
      cursor: pointer;
      color: rgb(64, 158, 255);
      &:hover {
        color: white;
      }
    }
    .editBlockBtn {
      color: $WarningColor;
    }
    .deleteBlockBtn {
      color: $CloseColor;
    }
    .customBtn {
      margin-right: 12px;
      display: flex;
      align-items: center;
    }
  }

  .AddCountDowBlock {
    .inputBlock {
      width: 100px;
      margin-right: 10px;
    }
  }
  .EditCountDownBlock {
    @extend .AddCountDowBlock;
    display: flex;
    align-items: center;
    .EditActionBtn {
      cursor: pointer;
      margin-right: 10px;
      font-size: 20px;
      font-weight: bold;
      &:hover {
        color: white;
      }
    }
    .CloseActionBtn {
      color: $CloseColor;
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
