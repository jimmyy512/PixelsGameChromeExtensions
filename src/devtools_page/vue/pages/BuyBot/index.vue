<template>
  <div id="BuyBotPage">
    <el-row>
      <div class="ParamRow">
        <div class="RowTitle">購買商品列表中第幾個商品:</div>
        <el-input
          class="RowInput"
          v-model="buyBotParam.TargetItemIndex"
          placeholder="(從 1 開始)"
          type="number"
        />
      </div>
    </el-row>

    <el-row>
      <div class="ParamRow">
        <div class="RowTitle">目標可接受價格( 含以下 ):</div>
        <el-input
          class="RowInput"
          v-model="buyBotParam.TargetPrice"
          placeholder=""
          type="number"
          min="1"
        />
      </div>
    </el-row>

    <el-row>
      <div class="ParamRow">
        <div class="RowTitle">購買總數( 買到的話此值會動態遞減 ):</div>
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
      <div class="ParamRow">
        <div class="RowTitle">多少秒後自動重試( 非必要不用調整 ):</div>
        <el-input
          class="RowInput"
          v-model="retryGapSec"
          placeholder=""
          type="number"
          min="1"
        />
      </div>
    </el-row>

    <el-row>
      <el-button
        type="primary"
        @click="preStartSendInsertDivEvent"
        v-if="!isStartBot"
      >
        開始下單
      </el-button>
    </el-row>

    <div v-if="isStartBot" class="StopBotBlock" @click="isStartBot = false">
      點我後停止下單
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { inspectWindowEval } from '@/utils/utils';
import { ElMessage } from 'element-plus';

let isStartBot = ref(false);
let retryGapSec = 3;
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
let waitBuyingResultInterval: NodeJS.Timeout;
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

const preStartSendInsertDivEvent = () => {
  resetAll();
  const tabId = chrome.devtools.inspectedWindow.tabId;
  chrome.runtime.sendMessage({
    from: 'devtools',
    action: 'InsertDivToFocus',
    tabId,
  });
};

const resetAll = () => {
  console.warn('last resetAll:', buyBotStatus);
  SelectPriceUntilDoneTime = 0;
  clearInterval(waitBuyingResultInterval);
  buyBotStatus = BuyBotStatus.Ready;
};

const startBot = () => {
  if (buyBotParam.TargetItemAmount <= 0) {
    ElMessage.success('目標數量已買完，請重新設定目標數量');
    stopBot();
  } else {
    isStartBot.value = true;
    OpenItemDetail();
  }
};

const stopBot = () => {
  isStartBot.value = false;
};

const reStart = () => {
  resetAll();
  CloseDetailWindow();
  setTimeout(() => {
    if (isStartBot.value) {
      startBot();
    } else {
      resetAll();
    }
  }, retryGapSec * 1000 + Math.floor(Math.random() * 201));
};

const OpenItemDetail = () => {
  buyBotStatus = BuyBotStatus.OpenItemDetail;
  inspectWindowEval(
    `
    document.querySelectorAll(".Marketplace_item__l__LM")[${
      buyBotParam.TargetItemIndex - 1
    }].querySelector(".Marketplace_viewListings__q_KfD").click();
    `
  )
    .then(res => {
      console.warn('OpenItemDetail res:', res);
      SelectPriceUntilDone();
    })
    .catch(err => {
      ElMessage.error('找不到商品，請重新設定商品是第幾個');
    });
};

const SelectPriceUntilDone = () => {
  buyBotStatus = BuyBotStatus.SelectPriceUntilDone;
  console.warn('SelectPriceUntilDoneTime:', SelectPriceUntilDoneTime);
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
      await inspectWindowEval(`
      document.querySelectorAll(".MarketplaceItemListings_buyListing__jYwuF")[0].textContent
      `).then(btnTextContent => {
        if (btnTextContent) {
          let itemPrice = +btnTextContent.match(/@ (\d+)/)[1];
          if (itemPrice <= buyBotParam.TargetPrice) {
            //符合目標價位 開始購買
            // 點開價位
            inspectWindowEval(
              `
                document.querySelectorAll(".MarketplaceItemListings_buyListing__jYwuF")[0].click();
              `
            );
            forceInputFocus();
            setTimeout(() => {
              // 購買送出
              inspectWindowEval(
                `
                  document.querySelectorAll(".MarketplaceItemListings_buyListing__jYwuF")[0].click();
                `
              );
              WaitBuyingResult();
            }, 300 + Math.floor(Math.random() * 101));
          } else {
            ElMessage.warning('沒有出現目標價位的商品，重新刷新中...');
            setTimeout(() => {
              reStart();
            }, 500);
          }
        }
      });
    } else {
      // 價格列表還沒出現 並且超過最大嘗試次數
      if (SelectPriceUntilDoneTime >= MAX_SELECT_PRICE_TRY) {
        reStart();
        return;
      }
      setTimeout(() => {
        SelectPriceUntilDone();
      }, 100);
    }
  });
};

const WaitBuyingResult = () => {
  console.warn('start waitBuy');
  let buySuccessAmount = 0;
  clearInterval(waitBuyingResultInterval);
  waitBuyingResultInterval = setInterval(() => {
    inspectWindowEval(`
      window.Chrome_BuySuccessDomList = document.querySelectorAll('.Marketplace_prop__fTsfy');
      if(window.Chrome_BuySuccessDomList.length>0){
        window.Chrome_BuySuccessDomList[1].querySelector('span:nth-child(2)')?.textContent;
      }
      else{
        "NotBuyYet"
      }
    `).then(res => {
      if (res != 'NotBuyYet') {
        clearInterval(waitBuyingResultInterval);
        console.warn('res:', res);
        buySuccessAmount = parseInt(res);
        buyBotParam.TargetItemAmount -= buySuccessAmount;

        // 關閉購買成功視窗
        inspectWindowEval(`
        document.querySelector(".Marketplace_button__x_SGP").click();
        `);
        //重新流程
        reStart();
        return;
      } else {
        console.warn('NotBuyYet');
      }
    });

    inspectWindowEval(`
      document.querySelector('.Notifications_text__ak1FH')?.textContent
    `).then(res => {
      if (res === 'marketplace-purchase-failed') {
        clearInterval(waitBuyingResultInterval);
        //重新流程
        reStart();
        return;
      } else {
        console.warn('NotBuyYet');
      }
    });
  }, 500);
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
  );
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

  .StopBotBlock {
    z-index: 99;
    position: fixed;
    top: 0;
    left: 0;
    cursor: pointer;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
  }
}
</style>
