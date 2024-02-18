import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import { getChromeLocalSync, compareVersion } from '@/utils/utils';
import { ElMessage } from 'element-plus';
import ProjectConfig from '@/conf/ProjectConfig.json';

// Local Storage 登入密碼
let localLoginPWD = '';

// @ts-ignore
const CurrentClientVersion = __Admine_VERSION__;

export const useConf = defineStore('confStore', {
  state: () => ({
    // conf api是否完成
    isLoading: true,
    // 登入是否成功, 此插件不需要登入驗證模組,直接設為true
    isAccess: true,
    // Google Excel上的 版本號
    onlineVersion: '',
    // Google Excel上的 登入密碼
    onlineCorrectPWD: '',
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
      if (ProjectConfig.IsNeedPWD) {
        if (import.meta.env.MODE === 'development') {
          this.isAccess = true;
          this.isLoading = false;
        } else {
          let localRes = await getChromeLocalSync(['LoginPWD']);
          if (localRes?.LoginPWD) {
            localLoginPWD = localRes.LoginPWD;
          }
        }
      }
      this.getOnlineGoogleExcelConf().finally(() => {
        this.isLoading = false;
      });
    },
    getOnlineGoogleExcelConf() {
      return axios
        .get(ProjectConfig.GoogleExcelURL, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
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
                // data 是 google excel 上的 object
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
