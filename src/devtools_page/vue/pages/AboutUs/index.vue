<template>
  <div id="AboutUs">
    <el-row>
      <el-col :span="12">
        <div class="RowTitle">
          <div>存檔英文代號: &nbsp;</div>
          <el-input v-model="saveKeyInput" placeholder="存檔Key" @blur="" />
        </div>
      </el-col>
    </el-row>

    <el-row class="CloudSaveBlock">
      <el-col :span="12">
        <div class="topBlock">雲端存檔最後儲存時間:</div>
        <div class="bottomBlock">
          {{ cloudTimestampDisplay }}
        </div>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="5">
        <el-button
          type="success"
          size="small"
          @click="SaveStorage.uploadSaveAllDataToCloudStorage"
          :icon="Upload"
        >
          上傳存檔
        </el-button>
      </el-col>

      <el-col :span="5">
        <el-button
          type="warning"
          size="small"
          @click="SaveStorage.downloadSaveAllDataFromCloudStorage"
          :icon="Download"
        >
          讀取存檔
        </el-button>
      </el-col>
    </el-row>

    <el-row justify="start" align="middle">
      <el-col :span="12">
        <div class="RowTitle">
          當前版本號:&nbsp; <span class="VersionCode">{{ version }}</span>
        </div>
      </el-col>
    </el-row>

    <el-row justify="start" align="middle">
      <el-col :span="12">
        <div class="RowTitle" :style="isNeedUpdate ? 'color:orange;' : ''">
          線上版本號:&nbsp;
          <span class="VersionCode">{{ ShowOnlineVersion }}</span>
        </div>
      </el-col>
    </el-row>

    <el-row align="middle">
      <template v-if="isNeedUpdate">
        <div class="info" style="margin-right: 10px">已檢測到新版本</div>
        <el-button type="warning" @click="updateBtnClick"
          >點擊前往更新</el-button
        >
      </template>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { useConf } from '@/store';
import { computed, ref } from 'vue';
import ProjectConfig from '@/conf/ProjectConfig.json';
import SaveStorage, { Cloud_Save_Info } from '@/utils/SaveStorage';
import { Upload, Download } from '@element-plus/icons-vue';

// @ts-ignore
const version = __Admine_VERSION__;

let saveKeyInput = ref('');

const ShowOnlineVersion = computed(() => {
  return useConf().onlineVersion;
});

const isNeedUpdate = computed(() => {
  return useConf().isNeedUpdate;
});

const updateBtnClick = () => {
  window.open(ProjectConfig.UpdateDownloadURL);
};

const saveData = () => {
  SaveStorage.saveLocalStorage(SaveStorage.LocalStorageKey.Cloud_Save_Info, {});
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

SaveStorage.loadLocalStorage(SaveStorage.LocalStorageKey.Cloud_Save_Info).then(
  (result: any) => {
    if (result) {
      cloudSaveTime.value = result;
    }
  }
);
</script>

<style scoped lang="scss">
#AboutUs {
  font-size: 18px;
  .el-row {
    margin-bottom: 20px;
  }
  .RowTitle {
    font-weight: bold;
    display: flex;
    align-items: center;
    white-space: nowrap;
  }
  .info {
    color: orange;
  }

  .VersionCode {
    // color: skyblue;
  }

  .CloudSaveBlock {
    display: flex;
    align-items: center;
    .topBlock {
      font-weight: bold;
      margin-bottom: 10px;
    }
    .bottomBlock {
      font-size: 16px;
      color: rgb(64, 158, 255);
    }
  }
}
</style>
