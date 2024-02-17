export function saveTokenToStorage(token: string) {
  chrome.storage.sync.set({ userToken: token }, function () {
    if (chrome.runtime.lastError) {
      console.error('存儲時發生錯誤:', chrome.runtime.lastError);
    } else {
      console.log('Token已保存到存儲。', token);
    }
  });
}

export function getTokenFromStorage(callback: Function) {
  chrome.storage.sync.get(['userToken'], function (result) {
    callback(result.userToken);
  });
}

export function removeTokenFromStorage() {
  chrome.storage.sync.remove('userToken', function () {
    if (chrome.runtime.lastError) {
      console.error('清除存儲時發生錯誤:', chrome.runtime.lastError);
    } else {
      console.log('Token已從存儲中移除。');
    }
  });
}

export function saveDomainStorage(token: string) {
  chrome.storage.sync.set({ domain: token }, function () {
    if (chrome.runtime.lastError) {
      console.error('存儲時發生錯誤:', chrome.runtime.lastError);
    } else {
      console.log('Domain已保存到存儲。', token);
    }
  });
}

export function getDomainStorage() {
  return new Promise<string>((resolve, reject) => {
    chrome.storage.sync.get('domain', result => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.domain);
      }
    });
  });
}

export function removeDomainStorage() {
  chrome.storage.sync.remove('domain', function () {
    if (chrome.runtime.lastError) {
      console.error('清除存儲時發生錯誤:', chrome.runtime.lastError);
    } else {
      console.log('Domain已從存儲中移除。');
    }
  });
}
