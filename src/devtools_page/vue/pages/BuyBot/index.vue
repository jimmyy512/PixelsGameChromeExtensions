<template>
  <div id="BuyBotPage">
    <el-row>
      <div class="ParamRow">
        <div class="RowTitle">購買商品列表中第幾個商品:</div>
        <el-input
          class="RowInput"
          v-model="buyBotParam.TargetItemIndex"
          placeholder="(從0開始)"
          type="number"
        />
      </div>
    </el-row>

    <el-row>
      <div class="ParamRow">
        <div class="RowTitle">目標可接受價格:</div>
        <el-input
          class="RowInput"
          v-model="buyBotParam.TargetItemIndex"
          placeholder=""
          type="number"
          min="1"
        />
      </div>
    </el-row>

    <el-row>
      <div class="ParamRow">
        <div class="RowTitle">一次下單數量:</div>
        <el-input
          class="RowInput"
          v-model="buyBotParam.TargetItemAmount"
          placeholder="(從1開始)"
          type="number"
          min="1"
        />
      </div>
    </el-row>

    <el-row>
      <el-button type="primary" @click="test">測試</el-button>
      <el-button type="primary" @click="sendInsertDivEvent">測試3</el-button>

      <!--         
      <el-button type="primary" @click="startBot">開始下單</el-button>
      <el-button type="warning" @click="stopBot">停止下單</el-button> -->
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { inspectWindowEval } from '@/utils/utils';

let isStartBot = false;
let buyBotParam = reactive({
  TargetItemIndex: 1,
  TargetPrice: 1,
  TargetItemAmount: 1,
});

enum BuyBotStatus {
  Ready,
  OpenItemDetail,
  SelectPriceUntilDone,
  OpenItemDetailPriceClick,
  SelectPriceAmountInputFill,
}

let buyBotStatus = BuyBotStatus.Ready;
// let SelectPriceUntilDoneInterval: NodeJS.Timer;
let SelectPriceUntilDoneTime = 0;
const MAX_SELECT_PRICE_TRY = 50;
const tabId = chrome.devtools.inspectedWindow.tabId;

chrome.runtime.onMessage.addListener(function (request: any, sender: any) {
  if (request.from === 'content_script' && sender?.url.startsWith('https')) {
    if (request.action === 'ChromeAction_END_FocusDivClick') {
      console.log('Received message from content_script:', request?.data);
      startBot();
    }
  }
});

const test = () => {
  preStartSendInsertDivEvent();
};

const preStartSendInsertDivEvent = () => {
  const tabId = chrome.devtools.inspectedWindow.tabId;
  chrome.runtime.sendMessage({
    from: 'devtools',
    action: 'InsertDivToFocus',
    tabId,
  });
};

const startBot = () => {
  isStartBot = true;
  OpenItemDetail();
};

const stopBot = () => {
  CloseDetailWindow();
};

const OpenItemDetail = () => {
  buyBotStatus = BuyBotStatus.OpenItemDetail;
  inspectWindowEval(
    `
    document.querySelectorAll(".Marketplace_item__l__LM")[${buyBotParam.TargetItemIndex}].querySelector(".Marketplace_viewListings__q_KfD").click();
    `
  ).then(res => {
    console.warn('OpenItemDetail res:', res);
    SelectPriceUntilDone();
  });
};

const resetAll = () => {
  console.warn('last resetAll:', buyBotStatus);
  SelectPriceUntilDoneTime = 0;
  // clearInterval(SelectPriceUntilDoneInterval);
  buyBotStatus = BuyBotStatus.Ready;
};

const SelectPriceUntilDone = () => {
  buyBotStatus = BuyBotStatus.SelectPriceUntilDone;
  SelectPriceUntilDoneTime++;
  inspectWindowEval(
    `
        window.Chrome_listLength = document.querySelectorAll(".MarketplaceItemListings_buyListing__jYwuF").length;
    `
  ).then(async Chrome_listLength => {
    // 價格列表已經出現
    if (Chrome_listLength > 0) {
      buyBotStatus = BuyBotStatus.OpenItemDetailPriceClick;
      SelectPriceUntilDoneTime = 0;
      await inspectWindowEval(
        `
          document.querySelectorAll(".MarketplaceItemListings_buyListing__jYwuF")[0].click();
        `
      );
      forceInputFocus();
    } else {
      // 價格列表還沒出現 並且超過最大嘗試次數
      if (SelectPriceUntilDoneTime >= MAX_SELECT_PRICE_TRY) {
        resetAll();
      }
      setTimeout(() => {
        SelectPriceUntilDone();
      }, 100);
    }
  });
};

const forceInputFocus = () => {
  const tabId = chrome.devtools.inspectedWindow.tabId;
  chrome.debugger.attach({ tabId: tabId }, '1.3', () => {
    // 检查是否有错误
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
    }

    inspectWindowEval(
      `document.querySelector(".MarketplaceItemListings_amount__IyJRp").querySelector("input").focus();`
    ).then(res => {
      startAutoInputAmount();
    });
  });
};

const startAutoInputAmount = () => {
  // Step 1: 模拟 Ctrl + A 全选文本
  const ctrlDownEvent = {
    type: 'keyDown',
    modifiers: 2, // 256 for Meta (Cmd) on Mac, 2 for Ctrl otherwise
    windowsVirtualKeyCode: 65,
    nativeVirtualKeyCode: 65,
    macCharCode: 0,
    key: 'a',
  };

  const ctrlUpEvent = { ...ctrlDownEvent, type: 'keyUp' };

  chrome.debugger.sendCommand(
    { tabId: tabId },
    'Input.dispatchKeyEvent',
    ctrlDownEvent,
    () => {
      chrome.debugger.sendCommand(
        { tabId: tabId },
        'Input.dispatchKeyEvent',
        ctrlUpEvent,
        () => {
          chrome.debugger.sendCommand(
            { tabId: tabId },
            'Input.insertText',
            { text: buyBotParam.TargetItemAmount.toString() },
            () => {
              if (chrome.runtime.lastError) {
                console.error(
                  'Insert Text Error:',
                  chrome.runtime.lastError.message
                );
              }
            }
          );
        }
      );
    }
  );
};

const CloseDetailWindow = () => {
  inspectWindowEval(
    `
    document.querySelector(".MarketplaceItemListings_container__Ta40D").querySelector(".commons_closeBtn__UobaL").click();
    `
  ).then(res => {
    console.warn('res:', res);
  });
};

onMounted(() => {});
</script>

<style lang="scss" scoped>
#BuyBotPage {
  .ParamRow {
    margin-bottom: 20px;
    .RowTitle {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 7px;
    }
    .RowInput {
      width: 100px;
    }
  }
}
</style>
