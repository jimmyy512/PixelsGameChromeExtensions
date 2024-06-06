<template>
  <div id="BuyBotPage">
    <el-row>
      <div class="ParamRow">
        <div class="RowTitle">購買商品列表中第幾個商品:</div>
        <el-input class="RowInput" v-model="buyBotParam.TargetItemIndex" placeholder="(從 1 開始)" type="number" />
      </div>
    </el-row>

    <el-row>
      <div class="ParamRow">
        <div class="RowTitle">目標可接受價格( 含以下 ):</div>
        <el-input class="RowInput" v-model="buyBotParam.TargetPrice" placeholder="" type="number" min="1" />
      </div>
    </el-row>

    <el-row>
      <div class="ParamRow">
        <div class="RowTitle">購買總數( 買到的話此值會動態遞減 ):</div>
        <el-input class="RowInput" v-model="buyBotParam.TargetItemAmount" placeholder="(從1開始)" type="number" min="1" />
      </div>
    </el-row>

    <!-- <el-row>
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
    </el-row> -->

    <el-row>
      <el-button type="primary" @click="preStartSendInsertDivEvent" v-if="!isStartBot">
        開始下單
      </el-button>
    </el-row>

    <div v-if="isStartBot" class="StopBotBlock" @click="isStartBot = false">
      點我後停止下單
    </div>

    <el-divider />

    <el-row>
      <div class="ParamRow" style="margin-bottom: 0px">
        <div class="RowTitle">多少分鐘後關閉料理:</div>
        <el-input style="width: 60px; margin-right: 20px" class="RowInput" v-model="cookIntervalCloseTime"
          placeholder="" type="number" min="1" @change="cookAutoCloseChangeEvent(isStartCookAutoClose)" />
        <el-switch v-model="isStartCookAutoClose" class="ml-2"
          style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" @change="cookAutoCloseChangeEvent" />
      </div>
    </el-row>

    <el-divider />

    <el-row>
      <div class="ParamRow" style="margin-right: 20px">
        <div class="RowTitle">點擊X軸:</div>
        <el-input class="RowInput" v-model="clickBotParam.ClickX" placeholder="(從 1 開始)" type="number" />
      </div>
      <div class="ParamRow">
        <div class="RowTitle">點擊Y軸:</div>
        <el-input class="RowInput" v-model="clickBotParam.ClickY" placeholder="(從 1 開始)" type="number" />
      </div>
    </el-row>

    <el-row>
      <div class="ParamRow" style="margin-right: 20px">
        <div class="RowTitle">點擊間距( 毫秒 ):</div>
        <el-input class="RowInput" v-model="clickBotParam.ClickInterval" placeholder="(從 1 開始)" type="number" />
      </div>
      <div class="ParamRow">
        <div class="RowTitle">間距亂數( 毫秒 ):</div>
        <el-input class="RowInput" v-model="clickBotParam.RandomClickOffset" placeholder="(從 1 開始)" type="number" />
      </div>
    </el-row>
    <el-row style="margin-bottom: 15px">
      <el-button type="primary" @click="startClickBot">
        開始自動點擊
      </el-button>
      <el-button type="primary" @click="clearClickBot">
        關閉自動點擊
      </el-button>
    </el-row>
    <el-row>
      <div class="ParamRow">
        <div class="RowTitle">
          當前鼠標座標: (建議先打開瀏覽器偵錯,否則高度會有差異)
        </div>
        <div class="RowXYInfo">
          X: <span>{{ mouseInfo.x }}</span> &nbsp; Y:
          <span>{{ mouseInfo.y }}</span>
        </div>
      </div>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import { inspectWindowEval, itemPriceToNumber } from '@/utils/utils';
import { ElMessage } from 'element-plus';
import SaveStorage from '@/utils/SaveStorage';

enum BuyBotStatus {
  Ready,
  OpenItemDetail,
  SelectPriceUntilDone,
  OpenItemDetailPriceClick,
  SelectPriceAmountInputFill,
}

let isStartBot = ref(false);
let cookIntervalCloseTime = ref(1);
let isStartCookAutoClose = ref(false);
let retryGapSec = 5;
let buyBotParam = reactive({
  TargetItemIndex: 1,
  TargetPrice: 1,
  TargetItemAmount: 1,
});

let clickBotParam = reactive({
  ClickX: localStorage.getItem('ClickX')
    ? Number(localStorage.getItem('ClickX'))
    : 600,
  ClickY: localStorage.getItem('ClickY')
    ? Number(localStorage.getItem('ClickY'))
    : 550,
  ClickInterval: 500,
  RandomClickOffset: 20,
});

let mouseInfo = reactive({
  x: 0,
  y: 0,
});

let buyBotStatus = BuyBotStatus.Ready;
let waitBuyingResultInterval: NodeJS.Timeout;
let comboClickInterval: NodeJS.Timeout;
let injectMouseEventInterval: NodeJS.Timeout;
let updateMouseEventInterval: NodeJS.Timeout;
let cookCloseEventInterval: NodeJS.Timeout;
let saveEventInterval: NodeJS.Timeout;
let SelectPriceUntilDoneTime = 0;
const MAX_SELECT_PRICE_TRY = 50;
const tabId = chrome.devtools.inspectedWindow.tabId;
const BuyItemListClass = 'MarketplaceItemListings_buyListing__jYwuF';

chrome.runtime.onMessage.addListener(function (request: any, sender: any) {
  if (request.from === 'content_script' && sender?.url.startsWith('https')) {
    if (request.action === 'ChromeAction_END_FocusDivClick') {
      console.log('Received message from content_script:', request?.data);
      startBot();
    }
  }
});

const startClickBot = () => {
  const tabId = chrome.devtools.inspectedWindow.tabId;
  chrome.debugger.attach({ tabId: tabId }, '1.3', () => {
    // 检查是否有错误
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
    }

    clearClickBot();
    comboClickInterval = setInterval(() => {
      closePlayerProfile();
      setTimeout(() => {
        botClick();
      }, 10);
    }, Number(clickBotParam.ClickInterval) + Math.floor(Math.random() * Number(clickBotParam.RandomClickOffset)));
  });
};

const clearClickBot = () => {
  clearInterval(comboClickInterval);
};

const closePlayerProfile = () => {
  inspectWindowEval(`
    document.querySelector('.Profile_closeButton__1n0Um')?.click();
  `);
};

const botClick = () => {
  const clickEvent = {
    type: 'mousePressed',
    button: 'left',
    clickCount: 1,
    x: Number(clickBotParam.ClickX), // 需要替換為元素的 x 座標
    y: Number(clickBotParam.ClickY), // 需要替換為元素的 y 座標
  };

  const releaseEvent = {
    ...clickEvent,
    type: 'mouseReleased',
  };

  chrome.debugger.sendCommand(
    { tabId: tabId },
    'Input.dispatchMouseEvent',
    clickEvent,
    () => {
      if (chrome.runtime.lastError) {
        console.error('Mouse Click Error:', chrome.runtime.lastError.message);
      } else {
        chrome.debugger.sendCommand(
          { tabId: tabId },
          'Input.dispatchMouseEvent',
          releaseEvent,
          () => {
            if (chrome.runtime.lastError) {
              console.error(
                'Mouse Release Error:',
                chrome.runtime.lastError.message
              );
            }
          }
        );
      }
    }
  );
};

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
    document.querySelectorAll(".Marketplace_item__l__LM")[${buyBotParam.TargetItemIndex - 1
    }].querySelector(".Marketplace_viewListings__q_KfD")?.click();
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

const buyItemDetail = async (index: any) => {
  inspectWindowEval(`
      document.querySelectorAll(".${BuyItemListClass}")[${index}].textContent
      `).then(btnTextContent => {
    if (btnTextContent) {
      let itemPrice = itemPriceToNumber(btnTextContent);
      if (itemPrice <= buyBotParam.TargetPrice) {
        //符合目標價位 開始購買
        // 點開價位
        inspectWindowEval(
          `
                document.querySelectorAll(".${BuyItemListClass}")[${index}].click();
              `
        );
        forceInputFocus();
        setTimeout(() => {
          // 購買送出
          inspectWindowEval(
            `
                  document.querySelectorAll(".${BuyItemListClass}")[${index}].click();
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
};

const SelectPriceUntilDone = async () => {
  buyBotStatus = BuyBotStatus.SelectPriceUntilDone;
  console.warn('SelectPriceUntilDoneTime:', SelectPriceUntilDoneTime);
  SelectPriceUntilDoneTime++;
  inspectWindowEval(
    `
        window.Chrome_listLength = document.querySelectorAll(".${BuyItemListClass}").length;
    `
  ).then(async Chrome_listLength => {
    // 價格列表已經出現
    if (Chrome_listLength > 0) {
      buyBotStatus = BuyBotStatus.OpenItemDetailPriceClick;
      SelectPriceUntilDoneTime = 0;

      let secondItemTextContent = await inspectWindowEval(`
      document.querySelectorAll(".${BuyItemListClass}")[1].textContent
      `);

      let isSecondItemButtonDisabled = await inspectWindowEval(`
      document.querySelectorAll(".MarketplaceItemListings_buyListing__jYwuF")[1].disabled
      `);

      let secondItemTextContentPrice = itemPriceToNumber(secondItemTextContent);

      console.warn(
        'secondItemTextContentPrice:',
        secondItemTextContentPrice,
        isSecondItemButtonDisabled
      );

      // 第二個選項商品價格小於目標價格,並且不是disabled
      // 就買第二個商品,否則買第一個商品
      if (
        secondItemTextContentPrice <= buyBotParam.TargetPrice &&
        !isSecondItemButtonDisabled
      ) {
        buyItemDetail(1);
      } else {
        buyItemDetail(0);
      }
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
      console.warn('WaitBuyingResult1 res:', res);
      if (res != 'NotBuyYet') {
        clearInterval(waitBuyingResultInterval);
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
      console.warn('WaitBuyingResult2 res:', res);
      if (
        res === 'marketplace-purchase-failed' ||
        res === 'cannot-afford' ||
        res === 'marketplace-already-sold' ||
        res === 'marketplace-cooldown'
      ) {
        clearInterval(waitBuyingResultInterval);
        //重新流程
        reStart();
        return;
      } else {
        console.warn('Notifications_text__ak1FH else 可以來補判斷:', res);
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

const injectMouseEventInit = () => {
  inspectWindowEval(
    `
      document.removeEventListener('mousemove', window.Chrome_handleMouseMove);
      window.Chrome_handleMouseMove = (event)=> {
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        window.Chrome_mouseInfo = {x: mouseX, y: mouseY};
      }
      document.addEventListener('mousemove', window.Chrome_handleMouseMove);
    `
  );
};

const startCookAutoInterval = () => {
  clearInterval(cookCloseEventInterval);
  console.warn('start');
  cookCloseEventInterval = setInterval(() => {
    // 關閉料理按鈕點擊
    inspectWindowEval(
      `
        document.querySelector('.Crafting_craftingCloseButton__ZbHQF')?.click();
      `
    );
  }, cookIntervalCloseTime.value * 60 * 1000);
};

const cookAutoCloseChangeEvent = (state: boolean) => {
  if (state) {
    startCookAutoInterval();
  } else {
    clearInterval(cookCloseEventInterval);
  }
};

const saveData = () => {
  SaveStorage.saveLocalStorage(
    SaveStorage.LocalStorageKey.BuyBot_Index,
    buyBotParam.TargetItemIndex
  );

  SaveStorage.saveLocalStorage(
    SaveStorage.LocalStorageKey.BuyBot_Price,
    buyBotParam.TargetPrice
  );

  SaveStorage.saveLocalStorage(
    SaveStorage.LocalStorageKey.BuyBot_Summary,
    buyBotParam.TargetItemAmount
  );
};

onMounted(async () => {
  // 監聽 ClickX 和 ClickY 的變動，並將它們寫入 localStorage
  watch(
    () => clickBotParam.ClickX,
    newValue => {
      localStorage.setItem('ClickX', newValue.toString());
    }
  );

  watch(
    () => clickBotParam.ClickY,
    newValue => {
      localStorage.setItem('ClickY', newValue.toString());
    }
  );
  buyBotParam.TargetItemIndex =
    Number(
      await SaveStorage.loadLocalStorage(
        SaveStorage.LocalStorageKey.BuyBot_Index
      )
    ) || 1;

  buyBotParam.TargetPrice =
    Number(
      await SaveStorage.loadLocalStorage(
        SaveStorage.LocalStorageKey.BuyBot_Price
      )
    ) || 1;

  buyBotParam.TargetItemAmount =
    Number(
      await SaveStorage.loadLocalStorage(
        SaveStorage.LocalStorageKey.BuyBot_Summary
      )
    ) || 1;

  // 3秒注入一次鼠標監測初始化
  injectMouseEventInterval = setInterval(() => {
    injectMouseEventInit();
  }, 3000);

  saveEventInterval = setInterval(() => {
    saveData();
  }, 3000);

  updateMouseEventInterval = setInterval(() => {
    inspectWindowEval(`
      window.Chrome_mouseInfo
    `).then(res => {
      mouseInfo.x = res.x;
      mouseInfo.y = res.y;
    });
  }, 300);
});

onUnmounted(() => {
  clearInterval(injectMouseEventInterval);
  clearInterval(updateMouseEventInterval);
  clearInterval(waitBuyingResultInterval);
  clearInterval(comboClickInterval);
  clearInterval(cookCloseEventInterval);
});
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

    .RowXYInfo {
      font-size: 16px;
      font-weight: bold;

      // color: white;
      span {
        color: skyblue;
      }
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
