// @ts-nocheck
import { WINDOW_GLOBAL } from '@/conf';
import { SocketSelectData, SocketMessageMonitorMessageRender } from '@/types';
import { inspectWindowEval } from '@/utils/utils';

// proto 描述對應表
let protoMap = {};

// 這隻檔案主要是用來和 Chrome Console 交互, 因此語法只能是 JS.
export function useSocketHook() {
  // 檢查 proto function 是否有子 proto
  const _checkChild = (funcStr: string, funcName) => {
    if (!funcStr) return;
    funcStr = funcStr.toString();
    let regex = /proto\.protogw\.(\w+)/;
    let match = funcStr.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  };

  // 蒐集所有 proto 的 原始對應表
  const _initOriginProtoMap = () => {
    const tmpProtoList = {};
    for (let protoName in proto.protogw) {
      let protoEvent = proto.protogw[protoName];
      if (typeof protoEvent === 'function') {
        // 只蒐集 get 開頭的 function
        let getProtoTypeList = Object.keys(protoEvent.prototype).filter(key =>
          key.startsWith('get')
        );
        getProtoTypeList = Object.fromEntries(
          getProtoTypeList.map(funcName => {
            let checkChildRes = window[_DevtoolVariableName]['CheckChild'](
              protoEvent.prototype[funcName],
              funcName
            );

            if (checkChildRes) {
              return [funcName, checkChildRes];
            } else {
              return [funcName, null];
            }
          })
        );
        tmpProtoList[protoName] = getProtoTypeList;
      }
    }
    return tmpProtoList;
  };

  const _initProtoMapNestedData = () => {
    const OriginMap = window[_DevtoolVariableName].OriginProtoMap;
    let NestedMap = {};
    const recurve = (protoRootKey, obj, append = []) => {
      // 確保傳入的obj是一個物件
      if (typeof obj !== 'object' || obj === null) return obj;

      let res = {};
      for (let key in obj) {
        // 檢查物件的自有屬性
        if (obj.hasOwnProperty(key)) {
          // 如果值是null或者OriginMap中沒有對應的key
          if (obj[key] === null || !OriginMap[obj[key]]) {
            res[key] = obj[key];
          } else {
            // 進行遞迴調用
            res[key] = recurve(
              protoRootKey,
              OriginMap[obj[key]],
              // TODO append 可以拿掉只是為了測試 方便查看深度層級
              append.concat([key])
            );
          }
        }
      }
      return res;
    };
    for (let protoRootKey in OriginMap) {
      NestedMap[protoRootKey] = recurve(
        protoRootKey,
        OriginMap[protoRootKey],
        []
      );
    }

    return NestedMap;
  };

  const RecursiveProtoMap = (map, instance) => {
    let result = {};
    if (Array.isArray(instance)) {
      result = [];
      for (let i = 0; i < instance.length; i++) {
        if (map === null) {
          result.push(instance[i]);
        } else {
          result.push(
            window[_DevtoolVariableName].RecursiveProtoMap(map, instance[i])
          );
        }
      }
    } else {
      for (const key in map) {
        if (map[key] === null) {
          result[key] = instance[key]();
        } else if (typeof instance[key] === 'function') {
          // 如果是 function 就繼續遞迴
          result[key] = window[_DevtoolVariableName].RecursiveProtoMap(
            map[key],
            instance[key]()
          );
        } else {
          // instance本身就已經是數值時,就已經是取得最終結果了
          result = instance;
          return result;
        }
      }
    }
    return result;
  };

  // 根據已選擇的資料，執行對應的 function
  const _selectDataFunctionRunResult = () => {
    const selectIndex = window[_DevtoolVariableName].SelectData.selectIndex;
    // console.warn('selectIndex:', selectIndex);
    const protoInstance =
      window[_DevtoolVariableName].SocketMessageMonitor.messages[selectIndex]
        .protoInstance;
    const protoMap =
      window[_DevtoolVariableName].NestedProtoMap[
        window[_DevtoolVariableName].SelectData.selectProtoRootName
      ];

    const combinedData = window[_DevtoolVariableName].RecursiveProtoMap(
      protoMap,
      protoInstance
    );
    return combinedData;
  };

  // 攔截接收訊息後的額外操作
  const getMessage = (data: any, from: string) => {
    data = new Uint8Array(data, 0, data.byteLength);

    let baseMsg = proto.protogw.BaseMessage.deserializeBinary(data);
    let firstNum = baseMsg.getFirstnum();
    let secondNum = baseMsg.getSecondnum();
    let uniNum = getApp().$tsNet.messageUniNum(firstNum, secondNum);
    let handler = getApp().$tsNet.getMessageHandler(uniNum);

    const messageData = {
      name: '',
      from,
      protoInstance: null,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    };
    if (handler?.msgNum?.obj) {
      messageData.name = handler.msgNum.name;
      messageData.protoInstance = handler.msgNum.obj.deserializeBinary(
        baseMsg.getDatas_asU8()
      );
    }
    return messageData;
  };

  const sendMessage = (data: any, from: string) => {
    const messageData = {
      name: data[0],
      from,
      protoInstance: data[1],
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    };
    return messageData;
  };

  // 清除事件記錄
  const clearMonitorMessage = () => {
    chrome.devtools.inspectedWindow.eval(
      `${WINDOW_GLOBAL}.SocketMessageMonitor.messages.length = 0;`
    );
  };

  // 選擇某一個事件
  const selectEventRow = async (
    selectRowData: SocketMessageMonitorMessageRender | null
  ) => {
    const proto = protoMap[selectRowData.name];
    // let returnData: SocketSelectData[] = [];
    let selectFunctionNameList = Object.keys(proto);
    let selectIndex = selectRowData.index;
    let selectData = {
      selectFunctionNameList,
      selectProtoRootName: selectRowData.name,
      selectIndex,
    };

    await inspectWindowEval(
      `
       ${WINDOW_GLOBAL}.SelectData = ${JSON.stringify(selectData)};
       ${WINDOW_GLOBAL}.RecursiveProtoMap = ${RecursiveProtoMap.toString()};
       ${WINDOW_GLOBAL}.SelectDataResult = (${_selectDataFunctionRunResult.toString()})();
      `
    );

    let SelectDataResult = await inspectWindowEval(
      `${WINDOW_GLOBAL}.SelectDataResult`
    );

    return SelectDataResult;
  };

  // 初始化 proto 計算
  const initWebsocketMessageHandler = async (initDoneCallback: any) => {
    await inspectWindowEval(
      `
        window._DevtoolVariableName = '${WINDOW_GLOBAL.split(
          '.'
        )[1].toString()}';
        ${WINDOW_GLOBAL} = {};
        ${WINDOW_GLOBAL}.CheckChild = (${_checkChild.toString()});
        ${WINDOW_GLOBAL}.OriginProtoMap = (${_initOriginProtoMap.toString()})();
        ${WINDOW_GLOBAL}.NestedProtoMap = (${_initProtoMapNestedData.toString()})();
      `
    );

    // 取得 proto 初始化結果
    protoMap = await inspectWindowEval(
      `
        ${WINDOW_GLOBAL}.OriginProtoMap;
      `
    );

    chrome.devtools.inspectedWindow.eval(
      `
        ${WINDOW_GLOBAL}.SocketMessageMonitor = {
          messages: [],
          maxLength: 1000,
        }
  
        originalParseMessage = getApp().$tsAppNet.GatewayClient.parseMessage;
        getApp().$tsAppNet.GatewayClient.parseMessage = function(...args) {
          originalParseMessage.apply(this, args);
          const messageData = (${getMessage.toString()})(args[0], 'pong');
          ${WINDOW_GLOBAL}.SocketMessageMonitor.messages.push(messageData);
          if(${WINDOW_GLOBAL}.SocketMessageMonitor.messages.length > ${WINDOW_GLOBAL}.SocketMessageMonitor.maxLength) {
            ${WINDOW_GLOBAL}.SocketMessageMonitor.messages = ${WINDOW_GLOBAL}.SocketMessageMonitor.messages.slice(
              ${WINDOW_GLOBAL}.SocketMessageMonitor.messages.length - ${WINDOW_GLOBAL}.SocketMessageMonitor.maxLength
            )
          }
        };

        originalSendMessage = getApp().$tsAppNet.GatewayClient.sendMessage;
        getApp().$tsAppNet.GatewayClient.sendMessage = function(...args) {
          originalSendMessage.apply(this, args);
          const messageData = (${sendMessage.toString()})(args, 'ping');
          ${WINDOW_GLOBAL}.SocketMessageMonitor.messages.push(messageData);
          if(${WINDOW_GLOBAL}.SocketMessageMonitor.messages.length > ${WINDOW_GLOBAL}.SocketMessageMonitor.maxLength) {
            ${WINDOW_GLOBAL}.SocketMessageMonitor.messages = ${WINDOW_GLOBAL}.SocketMessageMonitor.messages.slice(
              ${WINDOW_GLOBAL}.SocketMessageMonitor.messages.length - ${WINDOW_GLOBAL}.SocketMessageMonitor.maxLength
            )
          }
        }

  
        console.warn("${WINDOW_GLOBAL}.SocketMessageMonitor init done")
      `,
      initDoneCallback
    );
  };

  return {
    initWebsocketMessageHandler,
    clearMonitorMessage,
    selectEventRow,
    protoMap,
  };
}
