import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import { getChromeLocalSync, compareVersion } from '@/utils/utils';
import { ElMessage } from 'element-plus';

interface PCConfResult {
  env?: number;
  channelId?: string;
  publishVersion?: string;
  skinId?: number;
  agentId?: number;
}

interface UniAppConfResult {
  appEnv?: number;
  ChannelID?: string;
  gameVer?: string;
  resId?: number;
  AgentID?: number;
}

export interface ConfResult {
  appEnvStr: string;
  channelID: string;
  gameVer: string;
  resId: number;
  agentID: number;
}

const appEnvParam: { [key: number]: string } = {
  1: 'CQA',
  2: '預正式',
  3: '正式服',
  4: '研發服二',
};

// Local Storage 登入密碼
let localLoginPWD = '';

// @ts-ignore
const CurrentClientVersion = __Admine_VERSION__;

export const useConf = defineStore('confStore', {
  state: () => ({
    // conf api是否完成
    isLoading: true,
    // 登入是否成功
    isAccess: false,
    // 是否為PC
    isPC: false,
    // Google Excel上的 版本號
    onlineVersion: '',
    // Google Excel上的 登入密碼
    onlineCorrectPWD: '',
    // 遊戲的 conf
    conf: {
      appEnvStr: '',
      channelID: '',
      gameVer: '',
      resId: 0,
      agentID: 0,
    },
  }),
  getters: {
    isNeedUpdate: state => {
      return compareVersion(CurrentClientVersion, state.onlineVersion);
    },
  },
  actions: {
    setIsAccess(data: boolean) {
      this.isAccess = data;
    },
    async init() {
      this.isLoading = true;
      // 開發模式不用驗證密碼輸入 import.meta.env.MODE === 'development'
      if (import.meta.env.MODE === 'development') {
        this.isAccess = true;
        this.isLoading = false;
      } else {
        let localRes = await getChromeLocalSync(['LoginPWD']);
        if (localRes?.LoginPWD) {
          localLoginPWD = localRes.LoginPWD;
        }
      }
      this.getOnlineGoogleExcelConf().finally(() => {
        this.isLoading = false;
      });
    },
    refreshConf() {
      chrome.devtools.inspectedWindow.eval(
        'getApp().$conf',
        (result, isException) => {
          if (!result) {
            this.isPC = true;
            this.getPCConf();
          } else {
            this.isPC = false;
            this.getUniAppConf();
          }
        }
      );
    },
    getPCConf() {
      chrome.devtools.inspectedWindow.eval(
        'window.CONF',
        (result: PCConfResult) => {
          if (result) {
            this.conf.channelID = result.channelId || '';
            this.conf.gameVer = result.publishVersion || '';
            this.conf.agentID = result.agentId || 0;
            this.conf.resId = result.skinId || 0;
            this.conf.appEnvStr = result.env
              ? appEnvParam[result.env] || '研發服'
              : '';
          }
        }
      );
    },
    getUniAppConf() {
      chrome.devtools.inspectedWindow.eval(
        'getApp().$conf',
        (result: UniAppConfResult) => {
          if (result) {
            this.conf.channelID = result.ChannelID || '';
            this.conf.gameVer = result.gameVer || '';
            this.conf.agentID = result.AgentID || 0;
            this.conf.resId = result.resId || 0;
            this.conf.appEnvStr = result.appEnv
              ? appEnvParam[result.appEnv] || '研發服'
              : '';
          }
        }
      );
    },
    getOnlineGoogleExcelConf() {
      return axios
        .get(
          'https://docs.google.com/spreadsheets/d/1uuFUDU7DMiGMR4Wr2CdHocGyrIG2aTPIagyysjCQ264/edit#gid=0',
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        .then(res => {
          if (res?.data) {
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(res.data, 'text/html');

            (window as any).gg = htmlDoc;
            // 選擇具有指定屬性的 meta 元素
            const metaElement = htmlDoc.querySelector(
              'meta[property="og:description"][content]'
            );

            if (metaElement) {
              // 獲取 meta 元素的 content 屬性值
              let contentValue = metaElement.getAttribute('content');

              // 將字符串分割成行
              const lines = contentValue?.split('\n');

              // 如果有至少一行，選擇最後一行（索引為 lines.length - 1），並去除首尾空格
              if (lines && lines.length >= 1) {
                let jsonStr = lines[lines.length - 1].trim();
                let data = JSON.parse(jsonStr);
                this.onlineCorrectPWD = data.PWD;
                this.onlineVersion = data.Version;

                // 驗證登入密碼
                if (this.onlineCorrectPWD === localLoginPWD) {
                  this.isAccess = true;
                }
              } else {
                throw new Error('未找到足夠的行');
              }
            } else {
              throw new Error('未找到符合條件的 meta 元素');
            }
          }
        })
        .catch(error => {
          ElMessage.error('API 請求失敗: ' + error);
        })
        .finally(() => {});
    },
  },
});
