<template>
  <div class="root" :class="useConf().isLoading ? '' : 'entryBG'">
    <!-- 初始化動畫 -->
    <template v-if="useConf().isLoading">
      <img class="loading" src="@/resources/loading.gif" alt="" />
    </template>
    <template v-else>
      <!-- 進入開發面板 -->
      <template v-if="useConf().isAccess">
        <el-tabs v-model="activeName" style="height: 100%">
          <el-tab-pane
            style="height: 100%"
            v-for="(tab, index) in tabs"
            :key="index"
            :name="tab.name"
          >
            <template #label>
              <div class="redDotBlock">
                {{ tab.label }}
                <span
                  class="red-dot"
                  v-if="tab.name === 'AboutUs' && useConf().isNeedUpdate"
                ></span>
              </div>
            </template>

            <component
              :is="tab.component"
              :key="tab.name"
              style="height: 100%"
            />
          </el-tab-pane>
        </el-tabs>
      </template>

      <!-- 登入面板 -->
      <template v-else>
        <LoginPopUp></LoginPopUp>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, onBeforeUnmount } from 'vue';
import { useConf } from '@/store';
import LoginPopUp from '@/components/LoginPopUp.vue';
import Common from '@/pages/Common/index.vue';
import Market from '@/pages/Market/index.vue';
import DailyMission from '@/pages/DailyMission/index.vue';
import AboutUs from '@/pages/AboutUs/index.vue';

import Note from '@/pages/Note/index.vue';

const activeName = ref('Common');

useConf().init();

onBeforeUnmount(() => {});

const tabs = [
  {
    label: '基本資訊',
    name: 'Common',
    component: Common,
  },
  {
    label: '市場',
    name: 'Market',
    component: Market,
  },
  {
    label: '每日任務',
    name: 'DailyMission',
    component: DailyMission,
  },
  {
    label: '關於版本',
    name: 'AboutUs',
    component: AboutUs,
  },
];
</script>

<style lang="scss">
.el-tabs__content {
  // 40px 是tab高度
  // 15px 是margin-bottom高度
  height: calc(100% - 40px - 15px) !important;
  padding-bottom: 20px;
  overflow-y: auto !important;
}
</style>
<style scoped lang="scss">
.root {
  width: 100%;
  height: 100%;
  background-color: #060a0c;
  padding: 0px 20px;
}
.loading {
  width: 100%;
  max-width: 550px;
  display: block;
  margin: 0 auto;
}
.entryBG {
  background-color: #1a2b3c !important;
}

.redDotBlock {
  position: relative;
  .red-dot {
    width: 10px;
    height: 10px;
    background-color: red;
    border-radius: 50%;
    position: absolute;
    right: -15px;
    top: 50%;
    transform: translateY(-50%);
    animation: pulse 2.5s infinite;
  }
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
}
</style>
