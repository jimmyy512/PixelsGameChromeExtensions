// 注入方法1
function injectScript(file: any, node: any) {
  var th = document.getElementsByTagName(node)[0];
  var s = document.createElement('script');
  s.setAttribute('type', 'text/javascript');
  s.setAttribute('src', file);
  th.appendChild(s);
}
injectScript(chrome.runtime.getURL('inject.js'), 'body');

// 注入方法2
function injectCustomScript(scriptToInject: any) {
  const scriptElement = document.createElement('script');
  scriptElement.textContent = scriptToInject;
  (document.head || document.documentElement).appendChild(scriptElement);
}

const init = async () => {
  // 从文件注入
  // await fetch(chrome.runtime.getURL('html2canvas.js'))
  //   .then(response => response.text())
  //   .then(scriptContent => {
  //     injectCustomScript(scriptContent);
  //   });

  await fetch(chrome.runtime.getURL('CaptureDom.js'))
    .then(response => response.text())
    .then(scriptContent => {
      injectCustomScript(scriptContent);
    });
};

console.warn('content start');

// 监听来自background.js的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.warn('content message:', request);
  if (request.from === 'devtools') {
    if (request.action === 'CaptureDailyMission') {
      startCaptureDailyMission();
    }
  }
});

// 发送消息到background.js
function sendMessageToBackground(message: any) {
  chrome.runtime.sendMessage({ from: 'content_script', message: message });
}

const startCaptureDailyMission = () => {
  console.warn('go');
  // console.warn('zx123c:', html2canvas);
  console.warn(
    'asd:',
    document.querySelector('.Store_store-tabs-wrapper__OfH4C')
  );
  // html2canvas(document.querySelector('.Store_store-tabs-wrapper__OfH4C')).then(
  //   (canvas: any) => {
  //     var img = canvas.toDataURL('image/png');
  //     // 在这里你可以处理图片，例如显示、保存或发送到服务器
  //     console.log(img);
  //   }
  // );
};

var s = document.createElement('script');
s.src = chrome.runtime.getURL('html2canvas.min.js');
s.onload = function () {
  // 通知页面上下文，html2canvas已经加载完毕
  window.postMessage({ type: 'html2canvas_loaded' }, '*');
};
(document.head || document.documentElement).appendChild(s);

// setTimeout(() => {
//   console.warn('asd post');
//   chrome.runtime.sendMessage({
//     from: 'content_script',
//     message: 'asdasdasdas',
//   });
// }, 5000);

init();
