<script lang="ts" setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  reactive,
  watch,
} from 'vue';
import {
  inspectWindowEval,
  prettierJSON,
  isScrolledToBottom,
} from '@/utils/utils';
import { useSocketHook } from './SocketHook';
import { Delete } from '@element-plus/icons-vue';
import { useConf } from '@/store';
import {
  SocketMessageMonitor,
  SocketMessageMonitorMessage,
  SocketMessageMonitorMessageRender,
} from '@/types';
import { WINDOW_GLOBAL } from '@/conf';
import socketTreeList from './socketTreeList.vue';

// 訊息存取相關
const socketMessages = ref<Array<SocketMessageMonitorMessage>>([]);
let selectRowID = ref('-1');
const isSetScrollTopZero = ref(true);
const ref_elTable = ref<HTMLElement>();
const ref_scrollableLog = ref<HTMLElement>();
const selectRowData = ref<SocketMessageMonitorMessageRender | null>();
const selectEventList = ref('請選擇左半邊事件名稱');
let isAutoScroll = false;

// 週期相關
let socketMessageTimer: NodeJS.Timeout;
const getSocketMessages = async () => {
  const { messages } = await inspectWindowEval(
    `${WINDOW_GLOBAL}.SocketMessageMonitor`
  );
  let newData = null;
  if (messages.length > 1000) {
    newData = messages.slice(messages.length - 1000);
  } else {
    newData = messages;
  }

  socketMessages.value = newData;
};

const filters = reactive({
  fuzzy: true,
  included: true,
  name: '',
});

const socketMessageData = computed(() => {
  let mappedSocketMessages = socketMessages.value.map((item, index) => ({
    ...item,
    index,
    arrow: item.from === 'ping' ? '&uarr;' : '&darr;',
    arrowColor: item.from === 'ping' ? 'color: green;' : 'color: red;',
    focused: item.id === selectRowID.value,
  }));

  if (filters.name) {
    const filterStrings = filters.name.split(',');

    if (filters.fuzzy) {
      const isContained = (name: string) =>
        filterStrings.some(
          val => !!val && name.toLowerCase().includes(val.toLowerCase())
        );
      mappedSocketMessages = mappedSocketMessages.filter(({ name }) =>
        filters.included ? isContained(name) : !isContained(name)
      );
    } else {
      mappedSocketMessages = mappedSocketMessages.filter(({ name }) =>
        filters.included
          ? filterStrings.includes(name)
          : !filterStrings.includes(name)
      );
    }
  }

  return mappedSocketMessages;
});

const filterNameAccuracyOptions = [
  {
    label: '模糊',
    value: true,
  },
  {
    label: '精準',
    value: false,
  },
];

const filterNameIncludedOptions = [
  {
    label: '包含',
    value: true,
  },
  {
    label: '不包含',
    value: false,
  },
];

const handleFocusedRow = (rowId: string) => {
  selectRowID.value = rowId;
};

const handleScroll = () => {
  const scrollElement = (ref_elTable.value as any).$el.querySelector(
    '.el-scrollbar__wrap'
  );

  // 判断是否滚动到底部
  if (isScrolledToBottom(scrollElement)) {
    isAutoScroll = true;
  }
  if (isAutoScroll) {
    isAutoScroll = false; // 重置标志位
    isSetScrollTopZero.value = true;
  } else {
    isSetScrollTopZero.value = false;
  }
};

const scrollUpdateInterval: NodeJS.Timeout = setInterval(() => {
  if (!ref_elTable.value || !isSetScrollTopZero.value) return;

  isAutoScroll = true;
  (ref_elTable.value as any).$el.querySelector(
    '.el-scrollbar__wrap'
  ).scrollTop = 999999;
}, 200);

const eventRowClick = async (row: SocketMessageMonitorMessageRender) => {
  handleFocusedRow(row.id);
  selectRowData.value = row;
  let selectResult = await useSocketHook().selectEventRow(selectRowData.value);
  selectEventList.value = prettierJSON(selectResult);
  // 選擇事件後,事件列表取消自動至底
  isSetScrollTopZero.value = false;
  // 選擇事件後右半邊自動置頂
  (ref_scrollableLog.value as any).scrollTop = 0;
};

const clearEventListClickHandler = () => {
  selectRowData.value = null;
  useSocketHook().clearMonitorMessage();
  selectEventList.value = '請選擇左半邊事件名稱';
};

const tableRowClassName = ({
  row,
}: {
  row: SocketMessageMonitorMessageRender;
}) => {
  if (row.focused) return 'focused-row';
  else return row.from === 'ping' ? 'ping-row' : 'pong-row';
};

const init = async () => {
  console.warn('call init');
  if (useConf().isPC) {
    console.warn('PC版不支援初始化');
    return;
  }
  await inspectWindowEval(`${WINDOW_GLOBAL}.SocketMessageMonitor.messages`)
    .then(res => {
      console.error('已經初始化過:', res);
    })
    .catch(err => {
      console.error('err:', err);
      //有錯誤代表取不到 SocketMessageMonitor ,因此需要初始化
      useSocketHook().initWebsocketMessageHandler((res: any) => {
        clearInterval(socketMessageTimer);
        socketMessageTimer = setInterval(getSocketMessages, 1000);
      });
    });
};

// isPC狀態如果切換也要重新初始化
watch(
  () => useConf().isPC,
  (newVal, oldVal) => {
    // 在isPC的值發生變化時執行callback
    init();
  }
);

watch(filters, (pre, curr) => {
  if (!socketMessageData.value.some(item => item.focused)) {
    selectRowData.value = null;
  }
});

// 監聽瀏覽器網頁完成事件
const onCompletedHandler = () => {
  init();
};
chrome.webNavigation.onCompleted.addListener(onCompletedHandler);

onMounted(() => {
  const tableBodyWrapper = (ref_elTable.value as any).$el.querySelector(
    '.el-scrollbar__wrap'
  );
  if (tableBodyWrapper) {
    tableBodyWrapper.addEventListener('scroll', handleScroll);
  }
});

onBeforeUnmount(() => {
  clearInterval(socketMessageTimer);
  clearInterval(scrollUpdateInterval);
  chrome.webNavigation.onCompleted.removeListener(onCompletedHandler);

  const tableBodyWrapper = (ref_elTable.value as any).$el.querySelector(
    '.el-scrollbar__wrap'
  );
  if (tableBodyWrapper) {
    tableBodyWrapper.removeEventListener('scroll', handleScroll);
  }
});
</script>

<template>
  <div id="WebsocketMonitor">
    <template v-if="useConf().isPC">
      <h2>PC版目前不支援Socket監聽,請等待未來版本</h2>
    </template>
    <template v-else>
      <el-card shadow="never" class="elCard">
        <div class="row">
          <el-input
            v-model="filters.name"
            placeholder="請以,間隔多個事件名稱"
            clearable
            class="input-with-select"
          >
            <template #prepend>
              <el-select v-model="filters.fuzzy">
                <el-option
                  :key="`filterNameAccuracyOptions${value}`"
                  v-for="{ label, value } in filterNameAccuracyOptions"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </template>
            <template #append>
              <el-select v-model="filters.included">
                <el-option
                  :key="`filterNameIncludedOptions${value}`"
                  v-for="{ label, value } in filterNameIncludedOptions"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </template>
          </el-input>
          <div class="row auto-scroll">
            <div class="description">自動置底</div>
            <el-switch
              v-model="isSetScrollTopZero"
              active-text="是"
              inactive-text="否"
              inline-prompt
              size="large"
              style="
                --el-switch-on-color: #13ce66;
                --el-switch-off-color: #ff4949;
              "
            />
          </div>
          <el-button
            :icon="Delete"
            type="danger"
            @click="clearEventListClickHandler"
          >
            清空列表
          </el-button>
        </div>
      </el-card>

      <div class="smallTip">若未出現事件，請重新整理遊戲畫面</div>

      <div class="monitorLayout">
        <el-table
          class="elTable"
          height="100%"
          ref="ref_elTable"
          :data="socketMessageData"
          :row-class-name="tableRowClassName"
          :scrollbar-always-on="true"
          @row-click="eventRowClick"
        >
          <el-table-column label="方向" align="center" width="60">
            <template #default="scope">
              <span v-html="scope.row.arrow" :style="scope.row.arrowColor" />
            </template>
          </el-table-column>
          <el-table-column prop="name" min-width="150" label="事件名稱" />
        </el-table>

        <!-- <div class="logBlock">
          <socketTreeList :selectRowData="selectRowData"></socketTreeList>
        </div> -->
        <div class="logBlock">
          <pre
            class="scrollable-log"
            ref="ref_scrollableLog"
          ><code v-html="selectEventList" /></pre>
        </div>
      </div>
    </template>
  </div>
</template>

<!-- override element plus -->
<style lang="scss">
#WebsocketMonitor {
  .el-space,
  .el-space__item {
    width: 100%;
  }

  .el-card {
    margin-bottom: 8px;

    &__body {
      padding: 12px;
    }
  }

  .el-alert {
    margin-bottom: 8px;
  }

  .el-table--enable-row-hover .el-table__body tr:hover > td {
    background-color: rgba(255, 255, 255, 0.4) !important;
  }

  .ping-row {
    --el-table-tr-bg-color: var(--el-color-success-light-9) !important;
  }

  .pong-row {
    --el-table-tr-bg-color: var(--el-color-danger-light-9) !important;
  }

  .focused-row {
    --el-table-tr-bg-color: var(--el-color-primary-light-3) !important;
  }

  .el-card__body {
    padding-bottom: 0px;
  }
}
</style>

<!-- component style -->
<style lang="scss" scoped>
#WebsocketMonitor {
  height: 100%;
  padding-bottom: 16px;

  :deep(.el-table__row) {
    cursor: pointer !important;
  }
  .elCard {
    background-color: #2d3c4f00;
    border-color: #2d3c4f00;
    margin-bottom: 0px;
    padding-bottom: 0px;

    .row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;

      .input-with-select {
        width: 480px;
        margin-right: 16px;

        .el-select {
          width: 96px;
        }
      }

      &.auto-scroll {
        margin-right: 16px;
      }

      .description {
        font-size: 14px;
        color: rgb(66, 185, 131);
        margin-right: 8px;
      }
    }
  }

  .smallTip {
    font-size: 16px;
    margin: 5px 0px 10px 15px;
    font-weight: bold;
  }

  .monitorLayout {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: calc(100% - 70px);
    .elTable {
      width: 35%;
    }
    .logBlock {
      width: 65%;
      height: 100%;
      .scrollable-log {
        margin: 0 auto;
        // max-height: 300px; /* 设置最大高度 */
        // min-height: 300px;
        height: 100%;
        overflow-y: auto; /* 添加垂直滚动条 */
        border: 1px solid #ccc; /* 可选：添加边框 */
        background-color: ghostwhite;
        border: 1px solid silver;
        padding: 10px 20px;
      }
    }
  }
}
</style>
