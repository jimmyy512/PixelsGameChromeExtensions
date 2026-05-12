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
      // 將一般編輯網址轉為匯出 TSV 格式的網址
      const exportUrl = ProjectConfig.GoogleExcelURL.replace(
        /\/edit.*$/,
        '/export?format=tsv&gid=0'
      );

      return axios
        .get(exportUrl)
        .then(res => {
          if (res?.data) {
            let data: any = null;

            // 如果 Axios 已經自動將其解析為 JSON (因為回傳剛好是合法的 JSON 字串)
            if (typeof res.data === 'object') {
              data = res.data;
            } else {
              // 如果是純文字內容，則手動分割成行
              const contentValue = String(res.data);
              const lines = contentValue.split('\n');

              if (lines && lines.length >= 1) {
                let jsonStr = lines[lines.length - 1].trim();
                
                // 處理 TSV 可能包含的引號
                if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
                  jsonStr = jsonStr.substring(1, jsonStr.length - 1).replace(/""/g, '"');
                }
                
                data = JSON.parse(jsonStr);
              } else {
                throw new Error('未找到足夠的行');
              }
            }

            if (data) {
              this.onlineCorrectPWD = data.PWD;
              this.onlineVersion = data.Version;

              // 驗證登入密碼
              if (this.onlineCorrectPWD === localLoginPWD) {
                this.isAccess = true;
              }
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
