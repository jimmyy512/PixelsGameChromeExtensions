<template>
  <div id="CommonPage">
    <el-row align="middle" v-for="(item, index) in displayData" :key="index">
      <el-col :span="12">
        <div class="RowTitle">{{ item.title }}</div>
      </el-col>
      <el-col :span="12">
        <div class="RowContent">{{ item.content }}</div>
      </el-col>
    </el-row>
    <el-row align="middle">
      <el-col :span="12">
        <div class="RowTitle">PC API 解密</div>
      </el-col>
      <el-col :span="12">
        <el-button type="success" @click="decryptHandler">點擊解密</el-button>
      </el-col>
    </el-row>
    <!-- <el-row>
      <el-col :span="12">
        <el-button type="primary" @click="refresh">點擊刷新</el-button>
      </el-col>
    </el-row> -->
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue';
import { useConf } from '@/store';
import { ElMessage } from 'element-plus';
import { inspectWindowEval } from '@/utils/utils';

const { isPC, conf } = useConf();

const displayData = computed(() => [
  { title: '環境', content: conf.appEnvStr },
  { title: '版本號', content: conf.gameVer },
  { title: '渠道號(參考)', content: conf.channelID },
  { title: 'AgentID(參考)', content: conf.agentID },
  { title: '皮膚ID', content: conf.resId },
]);

const decryptHandler = () => {
  let decryptCommand: string;

  if (isPC) {
    decryptCommand = '救救我哆啦A夢.call_setIsSecret(false)';
  } else {
    decryptCommand = 'getApp().$conf.debug = true';
  }

  chrome.devtools.inspectedWindow.eval(
    decryptCommand,
    (result, isException) => {
      chrome.devtools.inspectedWindow.eval(
        'location.reload()',
        (result, isException) => {
          ElMessage({
            message: '解密成功,請查看 Network',
            type: 'success',
          });
        }
      );
    }
  );
};

const onSelectionChangedHandler = async () => {
  let host = await inspectWindowEval('location.hostname');

  // 只有 localhost 才能讀取vue檔案路徑
  if (host !== 'localhost') {
    return;
  }
  chrome.devtools.inspectedWindow.eval(
    'JSON.stringify(Object.keys(inspect($0).dataset))',
    function (result: any, isException) {
      if (!isException) {
        let resArr = JSON.parse(result);

        // 正则表达式模式，匹配"v"或"v-"
        const pattern = /^(v-|v)/;

        let filteredStrings = resArr.map(function (str: string) {
          return str.replace(pattern, '');
        });
        if (filteredStrings.length !== 0) {
          const dataSet = filteredStrings[0].toLowerCase();
          chrome.devtools.inspectedWindow.eval(
            `window.__VUE_HOT_MAP__['${dataSet}'].options.__file`,
            function (result, isException) {
              chrome.devtools.inspectedWindow.eval(
                `console.warn("Extension - vue component path:",'${result}')`,
                () => {}
              );
            }
          );
        }
      }
    }
  );
};

chrome.devtools.panels.elements.onSelectionChanged.addListener(
  onSelectionChangedHandler
);

onBeforeUnmount(() => {
  chrome.devtools.panels.elements.onSelectionChanged.removeListener(
    onSelectionChangedHandler
  );
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
}
</style>
