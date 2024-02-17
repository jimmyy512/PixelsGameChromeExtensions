import {
  getDomainStorage,
  getTokenFromStorage,
} from '@/pages/Backstage/BackstageStorage';

export const goToBackstageWebsite = async () => {
  let backstageDomain = '';

  await getDomainStorage().then((domain: string) => {
    backstageDomain = domain;
  });

  getTokenFromStorage((retrievedToken: string) => {
    chrome.tabs.create({ url: backstageDomain + '/plogin' }, tab => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          setTimeout(() => {
            chrome.scripting.executeScript(
              {
                target: { tabId: tab.id as any },
                func: (token: string) => {
                  document.cookie = 'Cloud-Token=' + token;

                  var popup = document.createElement('div');
                  popup.style.position = 'fixed';
                  popup.style.left = '50%';
                  popup.style.top = '50%';
                  popup.style.transform = 'translate(-50%, -50%)';
                  popup.style.padding = '100px';
                  popup.style.background = 'white';
                  popup.style.border = '1px solid black';
                  popup.style.zIndex = '999999999'; // 確保它在最上層

                  // 添加文本
                  var text = document.createTextNode('自動跳轉登入中');
                  popup.appendChild(text);

                  // 添加到頁面中
                  document.body.appendChild(popup);

                  location.reload();
                },
                args: [retrievedToken],
              },
              () => {
                if (chrome.runtime.lastError) {
                  console.error(
                    'Script execution error:',
                    chrome.runtime.lastError
                  );
                  return;
                }
                console.log('Token已篩入。', retrievedToken);
              }
            );
          }, 500);

          chrome.tabs.onUpdated.removeListener(listener);
        }
      });
    });
  });
};
