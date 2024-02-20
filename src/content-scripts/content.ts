function injectScript(file: any, node: any) {
  var th = document.getElementsByTagName(node)[0];
  var s = document.createElement('script');
  s.setAttribute('type', 'text/javascript');
  s.setAttribute('src', file);
  th.appendChild(s);
}
injectScript(chrome.runtime.getURL('inject.js'), 'body');
injectScript(chrome.runtime.getURL('html2canvas.js'), 'body');

console.warn('content start');

// 监听来自background.js的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.warn('content message:', request);
  if (request.from === 'devtools') {
    console.log('Message from DevTools:', request.message);
    // 可以在这里处理消息，或者发送消息到页面上下文
  }
});

// 发送消息到background.js
function sendMessageToBackground(message: any) {
  chrome.runtime.sendMessage({ from: 'content_script', message: message });
}

setTimeout(() => {
  console.warn('asd post');
  chrome.runtime.sendMessage({
    from: 'content_script',
    message: 'asdasdasdas',
  });
}, 5000);
