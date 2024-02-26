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
      <el-button type="primary" @click="test3">測試3</el-button>

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
let SelectPriceUntilDoneInterval: NodeJS.Timer | null = null;
let SelectPriceUntilDoneTime = 0;
const MAX_SELECT_PRICE_TRY = 50;
const tabId = chrome.devtools.inspectedWindow.tabId;

chrome.runtime.onMessage.addListener(function (request: any, sender: any) {
  if (request.from === 'content_script' && sender?.url.startsWith('https')) {
    if (request.action === 'ChromeAction_END_FocusDivClick') {
      console.log('Received message from content_script:', request?.data);
      test2();
    }
  }
});

const test = () => {
  console.warn('test');
  setTimeout(() => {
    console.warn('test2go');
    test2();
  }, 3000);
};

const test3 = () => {
  const tabId = chrome.devtools.inspectedWindow.tabId;
  chrome.runtime.sendMessage({
    from: 'devtools',
    action: 'InsertDivToFocus',
    tabId,
  });
};
const test2 = () => {
  const tabId = chrome.devtools.inspectedWindow.tabId;
  chrome.debugger.attach({ tabId: tabId }, '1.3', () => {
    // 检查是否有错误
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
    }

    inspectWindowEval(`document.querySelector(".html-ex input").focus();`).then(
      res => {
        console.warn('inspectWindowEval:', res);

        fakeInput();
      }
    );
  });
};

const fakeInput = () => {
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
          // Step 2 (optional): 删除选中的文本，可能不需要这一步

          // Step 3: 输入新文本
          chrome.debugger.sendCommand(
            { tabId: tabId },
            'Input.insertText',
            { text: '1' },
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

// // 附加调试器后，执行这个函数来聚焦并替换文本
// function focusAndReplaceTextInInput(tabId, newText) {
//   // 首先，聚焦到目标input元素
//   chrome.scripting.executeScript(
//     {
//       target: { tabId: tabId },
//       function: () => document.querySelector('.html-ex input').focus(),
//     },
//     () => {
//       if (chrome.runtime.lastError) {
//         console.error(
//           'Execute script failed: ',
//           chrome.runtime.lastError.message
//         );
//         return;
//       }

//       // 然后，模拟全选并插入新文本
//       selectAllAndInsertText(tabId, newText);
//     }
//   );
// }

// function selectAllAndInsertText(tabId, newText) {
//   // 模拟 Ctrl + A 全选文本
//   const ctrlDownEvent = {
//     type: 'keyDown',
//     modifiers: 2, // 2 代表 Ctrl 键
//     windowsVirtualKeyCode: 65,
//     nativeVirtualKeyCode: 65,
//     macCharCode: 0,
//     key: 'A',
//     code: 'KeyA',
//   };

//   const ctrlUpEvent = { ...ctrlDownEvent, type: 'keyUp' };

//   chrome.debugger.sendCommand(
//     { tabId: tabId },
//     'Input.dispatchKeyEvent',
//     ctrlDownEvent,
//     () => {
//       chrome.debugger.sendCommand(
//         { tabId: tabId },
//         'Input.dispatchKeyEvent',
//         ctrlUpEvent,
//         () => {
//           // 在全选后插入新文本
//           chrome.debugger.sendCommand(
//             { tabId: tabId },
//             'Input.insertText',
//             { text: newText },
//             () => {
//               if (chrome.runtime.lastError) {
//                 console.error(
//                   'Insert Text Error:',
//                   chrome.runtime.lastError.message
//                 );
//               }
//             }
//           );
//         }
//       );
//     }
//   );
// }

// const test = () => {
//   // 示例：调用这个函数来替换文本
//   focusAndReplaceTextInInput(tabId, '新的文本内容');
// };

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
  clearInterval(SelectPriceUntilDoneInterval);
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
      //   setTimeout(() => {
      SelectPriceAmountInputFill();
      //   await inspectWindowEval(
      //     `
      //         document.querySelectorAll(".MarketplaceItemListings_buyListing__jYwuF")[0].click();
      //     `
      //   );
      //   }, 2000);
      //   await SelectPriceAmountInputFill();
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

const SelectPriceAmountInputFill = () => {
  buyBotStatus = BuyBotStatus.SelectPriceAmountInputFill;
  return inspectWindowEval(
    `
        window.Chrome_AmountInput = document.querySelector(".MarketplaceItemListings_amount__IyJRp").querySelector("input")
        window.Chrome_AmountInput.value = ${buyBotParam.TargetItemAmount};
        window.Chrome_AmountInput.dispatchEvent(new Event('input'));
        window.Chrome_AmountInput.dispatchEvent(new Event('change'));
    `
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
