<!-- 此專案用不到登入驗證模組 -->
<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import { useConf } from '@/store';
import { ElMessage } from 'element-plus';

let input = ref('');
const loginHandler = () => {
  if (input.value === useConf().onlineCorrectPWD) {
    useConf().setIsAccess(true);
    chrome.storage.local.set({ LoginPWD: input.value });
  } else {
    ElMessage({
      message: '密碼錯誤',
      type: 'error',
    });
  }
};

// @ts-ignore
const version = __Admine_VERSION__;
</script>

<template>
  <div id="Login-PopUp">
    <div class="CenterForm">
      <div class="logo">
        <img src="@/resources/icon.png" alt="" />
      </div>
      <div class="title">請輸入密碼</div>
      <div class="row">
        <el-input v-model="input" placeholder="" clearable />
      </div>
      <div class="row">
        <el-button class="loginBtn" type="success" @click="loginHandler">
          登入
        </el-button>
      </div>
      <div class="row">version: {{ version }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#Login-PopUp {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  .CenterForm {
    padding: 10px;
    background-color: rgba(0, 0, 0, 0.6);
    width: 300px;
    height: 250px;
    border-radius: 10px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    .logo {
      width: 100%;
      height: 60px;
      display: flex;
      justify-content: center;
    }
    .title {
      text-align: center;
      margin: 5px 0px;
      font-size: bold;
      font-size: 16px;
    }
    .row {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 80%;
      margin-bottom: 10px;
    }
  }
}
</style>
