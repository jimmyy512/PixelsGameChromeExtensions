<template>
  <div id="Note">
    <el-row align="middle" v-for="(item, index) in displayData" :key="index">
      <el-col :span="8">
        <div class="RowTitle">{{ item.title }}</div>
      </el-col>
      <el-col :span="12" justify="start">
        <el-button type="success" @click="clickHandler(item.content)"
          >前往</el-button
        >
      </el-col>
    </el-row>

    <el-row>
      <div class="info">任何廣告置入需求，請聯繫 Jim.</div>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const clickHandler = (href: string) => {
  window.open(href);
};
const displayData = ref([
  {
    title: '公司文件',
    content: 'https://mgbilibili.atlassian.net/wiki/spaces/FT/pages/28639454',
  },
  {
    title: '開發環境資訊',
    content: 'https://mgbilibili.atlassian.net/wiki/spaces/FT/pages/27557979',
  },
  {
    title: '3344 && 皇冠 && 捕魚',
    content: 'https://mgbilibili.atlassian.net/wiki/spaces/FT/pages/30867497',
  },
]);
</script>

<style scoped lang="scss">
#Note {
  font-size: 16px;
  .el-row {
    margin-bottom: 20px;
    // border-bottom: 1px solid rgba(245, 245, 245, 0.373);
    padding-bottom: 10px;
    .RowTitle {
      font-size: 18px;
      font-weight: bold;
    }
  }
  .info {
    color: orange;
  }
}
</style>
