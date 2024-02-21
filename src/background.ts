chrome.alarms.create({
  periodInMinutes: 1 / 60,
});

chrome.alarms.onAlarm.addListener(alarm => {
  // console.log('update');
});

chrome.runtime.onMessage.addListener(function (
  request,
  sender: chrome.runtime.MessageSender,
  sendResponse
) {
  // 如果消息来自devtools_page
  if (request.from === 'devtools' && request?.tabId) {
    // 转发消息到content_script
    chrome.tabs.sendMessage(request.tabId, request);
  }
  // 如果消息来自content_script
  else if (request.from === 'content_script') {
    // 转发消息到devtools_page
    chrome.runtime.sendMessage(request);
  }
});
