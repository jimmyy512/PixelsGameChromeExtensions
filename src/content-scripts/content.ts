import html2canvas from 'html2canvas';
// 注入方法1
// function injectScript(file: any, node: any) {
//   var th = document.getElementsByTagName(node)[0];
//   var s = document.createElement('script');
//   s.setAttribute('type', 'text/javascript');
//   s.setAttribute('src', file);
//   th.appendChild(s);
// }
// injectScript(chrome.runtime.getURL('inject.js'), 'body');

// 監聽消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // console.warn('content message:', request);
  if (request.from === 'devtools') {
    if (request.action === 'CaptureDailyMission') {
      startCaptureDailyMission();
    } else if (request.action === 'InsertDivToFocus') {
      startInsertDivToFocus();
    }
  }
});

const startCaptureDailyMission = () => {
  const targetDomStr = '.Store_items-content__FtMRE';
  if (html2canvas && document.querySelector(targetDomStr)) {
    html2canvas(
      document.querySelector('.Store_items-content__FtMRE') as HTMLElement,
      {
        backgroundColor: '#222044',
        useCORS: true,
      }
    ).then((canvas: any) => {
      var imgURL = canvas.toDataURL('image/png');
      // 将数据发送到background script
      chrome.runtime.sendMessage({
        from: 'content_script',
        action: 'ChromeAction_END_CAPTURE',
        data: imgURL,
      });
    });
  } else {
    // console.log('Chrome DevTool: 尚未打開每日任務面板:', targetDomStr);
  }
};

const startInsertDivToFocus = () => {
  const overlayDiv = document.createElement('div');
  overlayDiv.style.position = 'fixed';
  overlayDiv.style.top = '0';
  overlayDiv.style.left = '0';
  overlayDiv.style.width = '100%';
  overlayDiv.style.height = '100%';
  overlayDiv.style.backgroundColor = 'rgba(0,0,0,0.8)'; // 背景颜色更深
  overlayDiv.style.zIndex = '10000';
  overlayDiv.style.cursor = 'pointer'; // 设置鼠标悬停时的指针样式
  overlayDiv.style.color = 'white'; // 文字颜色
  overlayDiv.style.display = 'flex';
  overlayDiv.style.flexDirection = 'column';
  overlayDiv.style.justifyContent = 'center';
  overlayDiv.style.alignItems = 'center';
  overlayDiv.style.fontSize = '24px'; // 字体大小
  overlayDiv.style.textAlign = 'center'; // 文本居中
  overlayDiv.style.lineHeight = '1.5'; // 行高
  overlayDiv.id = 'fullPageOverlay';

  // 添加文本内容
  const message = document.createElement('div');
  message.innerHTML = '請點我後開始自動買入<br>如要終止請點擊輔助面板上的按鈕';
  overlayDiv.appendChild(message);

  overlayDiv.addEventListener('click', function () {
    document.body.removeChild(overlayDiv);

    console.warn('div get click!!!!');

    chrome.runtime.sendMessage({
      from: 'content_script',
      action: 'ChromeAction_END_FocusDivClick',
    });
  });

  document.body.appendChild(overlayDiv);
};

// 发送消息到background.js
// function sendMessageToBackground(message: any) {
//   chrome.runtime.sendMessage({ from: 'content_script', message: message });
// }

// 監聽來自頁面的事件 Ex. CaptureDom.js
// window.addEventListener('message', event => {
//   // 验证消息来源
//   if (event.source == window && event.data?.from == 'CaptureDom') {
//     console.log('Content script received');
//     // 将数据发送到background script
//     chrome.runtime.sendMessage({
//       from: 'content_script',
//       action: 'ChromeAction_END_CAPTURE',
//       data: event.data.data,
//     });
//   }
// });

// const startCaptureDailyMission = () => {
// console.warn('content startCaptureDailyMission');
// window.postMessage(
//   {
//     action: 'START_CAPTURE',
//     from: 'content_script',
//   },
//   '*'
// );
// };
