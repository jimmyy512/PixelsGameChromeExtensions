<template>
  <div id="AboutUs">
    <el-row justify="start" align="middle">
      <el-col :span="5">
        <div class="RowTitle">
          當前版本號: <span class="VersionCode">{{ version }}</span>
        </div>
      </el-col>
    </el-row>

    <el-row justify="start" align="middle">
      <el-col :span="5">
        <div class="RowTitle" :style="isNeedUpdate ? 'color:orange;' : ''">
          線上版本號:
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
import { computed } from 'vue';
// @ts-ignore
const version = __Admine_VERSION__;

const ShowOnlineVersion = computed(() => {
  return useConf().onlineVersion;
});

const isNeedUpdate = computed(() => {
  return useConf().isNeedUpdate;
});

const updateBtnClick = () => {
  window.open(
    'https://mgbilibili.atlassian.net/wiki/spaces/FT/pages/82674135/Chrome'
  );
};
</script>

<style scoped lang="scss">
#AboutUs {
  font-size: 18px;
  .el-row {
    margin-bottom: 20px;
  }
  .info {
    color: orange;
  }

  .VersionCode {
    // color: skyblue;
  }
}
</style>
