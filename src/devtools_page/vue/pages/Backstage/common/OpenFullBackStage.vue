<template>
  <div id="OpenFullBackStage">
    <el-button
      class="triggerOpenBtn"
      type="primary"
      @click="triggerOpenBtnClickHandler"
    >
      點擊打開
    </el-button>
    <div>
      若是彈出的後台出現
      <span class="importBoldText">" 登陆超时(10003) "</span>,
    </div>
    <div>
      請點擊當前插件畫面左下角的<span class="importBoldText"> "登出"</span>,
    </div>
    <div>重新登入後台插件獲取新的Token.</div>
  </div>
</template>

<script lang="ts" setup>
import { goToBackstageWebsite } from '@/pages/Backstage/GoToBackstageWebsite';
const triggerOpenBtnClickHandler = () => {
  goToBackstageWebsite();
};
</script>

<style lang="scss">
#OpenFullBackStage {
  font-size: 18px;
  div {
    margin: 10px 0;
  }
  .importBoldText {
    font-size: bold;
    color: orange;
  }
  .triggerOpenBtn {
    width: 200px;
    margin: 30px;
    background: #3d9cc4;
    border-color: #052937;
    &:hover {
      background: #50c7fa;
      border-color: #052937;
    }
  }
}
</style>
