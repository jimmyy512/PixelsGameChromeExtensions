export const inspectWindowEval = (order: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(order, (result, exceptionInfo) => {
      if (exceptionInfo) {
        reject(exceptionInfo);
      } else {
        resolve(result);
      }
    });
  });
};

export const getChromeLocalSync = (
  keys: string | string[]
): {
  [key: string]: any;
} => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, result => {
      if (result) {
        resolve(result);
      } else {
        reject('getChromeLocalSync error');
      }
    });
  });
};

export const prettierJSON = (data: any) => {
  var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/gm;
  var replacer = function (
    match: any,
    pIndent: any,
    pKey: any,
    pVal: any,
    pEnd: any
  ) {
    var key = '<span class="json-key" style="color: brown">',
      val = '<span class="json-value" style="color: navy">',
      str = '<span class="json-string" style="color: olive">',
      r = pIndent || '';
    if (pKey) r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
    if (pVal) r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
    return r + (pEnd || '');
  };

  return JSON.stringify(data, null, 3)
    .replace(/&/g, '&amp;')
    .replace(/\\"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(jsonLine, replacer);
};

export const isScrolledToBottom = (element: HTMLElement) => {
  return (
    Math.abs(element.scrollTop + element.clientHeight - element.scrollHeight) <=
    2
  );
};

export const compareVersion = (currentVersion: string, newVersion: string) => {
  const v1 = currentVersion.split('.').map(Number);
  const v2 = newVersion.split('.').map(Number);

  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;

    if (num1 < num2) return true; // version2 is greater if any corresponding part is greater
    if (num1 > num2) return false; // version1 is greater if any corresponding part is greater
  }

  return false; // versions are equal
};

export const itemPriceToNumber = (btnTextContent: string) => {
  const matchResult = btnTextContent.match(/@ (\d+)/);
  if (matchResult) {
    return +matchResult[1];
  } else {
    // 處理沒有匹配到的情況，例如返回 0 或者拋出錯誤
    return 0;
  }
};
