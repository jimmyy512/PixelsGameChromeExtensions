// 注入方法1
function injectScript(file: any, node: any) {
  var th = document.getElementsByTagName(node)[0];
  var s = document.createElement('script');
  s.setAttribute('type', 'text/javascript');
  s.setAttribute('src', file);
  th.appendChild(s);
}
injectScript(chrome.runtime.getURL('inject.js'), 'body');

// 监听来自background.js的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // console.warn('content message:', request);
  if (request.from === 'devtools') {
    if (request.action === 'CaptureDailyMission') {
      startCaptureDailyMission();
    }
  }
});

const startCaptureDailyMission = () => {
  const targetDomStr = '.Store_items-content__FtMRE';
  if (document.querySelector(targetDomStr)) {
    html2canvas(document.querySelector('.Store_items-content__FtMRE'), {
      // html2canvas(document.querySelector('body'), {
      backgroundColor: '#222044',
      useCORS: true,
    }).then((canvas: any) => {
      var imgURL = canvas.toDataURL('image/png');
      console.warn('imgURL:', imgURL);
      // 将数据发送到background script
      chrome.runtime.sendMessage({
        from: 'content_script',
        action: 'ChromeAction_END_CAPTURE',
        data: imgURL,
      });
    });
  } else {
    console.log('Chrome DevTool: 尚未打開每日任務面板:', targetDomStr);
  }
};

// 发送消息到background.js
function sendMessageToBackground(message: any) {
  chrome.runtime.sendMessage({ from: 'content_script', message: message });
}

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
