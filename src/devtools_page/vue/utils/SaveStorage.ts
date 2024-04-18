import { ElMessage } from 'element-plus';
import axios from '@/utils/axios';
import ProjectConfig from '@/conf/ProjectConfig.json';

enum LocalStorageKey {
  Fast_Count_State = 'Fast_Count_State',
  Customize_Count_State = 'Customize_Count_State',
  Daily_Task = 'Daily_Task',
  Cloud_Save_Info = 'Cloud_Save_Info',
  NoteList = 'NoteList',
  BuyBot_Index = 'BuyBot_Index',
  BuyBot_Price = 'BuyBot_Price',
  BuyBot_Summary = 'BuyBot_Summary',
}

export interface Cloud_Save_Info {
  SaveKey: string;
  SaveTime: number;
}

export default class SaveStorage {
  private static PixelGameSaveData = 'PixelGameSaveData';
  public static LocalStorageKey = LocalStorageKey;
  public static cloudLastSaveTimeStamp = 0;

  public static saveLocalStorage(
    key: LocalStorageKey,
    value: any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  public static loadLocalStorage(key: LocalStorageKey): { [key: string]: any } {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, result => {
        if (result) {
          resolve(result[key]);
        } else {
          reject('loadLocalStorage error');
        }
      });
    });
  }

  public static async uploadSaveAllDataToCloudStorage(Key: string) {
    let DataToSave: Record<string, any> = {};

    for (const key in LocalStorageKey) {
      DataToSave[key] = await SaveStorage.loadLocalStorage(
        key as LocalStorageKey
      );
    }

    return axios
      .post(`${ProjectConfig.CloudSaveURL}/setData`, {
        Key,
        SaveData: JSON.stringify(DataToSave),
      })
      .then(res => {
        if (res.data?.message) {
          ElMessage.success(`已上傳至雲端`);
        }
      });
  }

  public static async downloadSaveAllDataFromCloudStorage(Key: string) {
    return new Promise<void>((resolve, reject) => {
      axios
        .get(`${ProjectConfig.CloudSaveURL}/getData`, {
          params: {
            Key,
          },
        })
        .then(res => {
          if (res.data?.[Key]) {
            const cloudSaveData = JSON.parse(res.data[Key]);
            for (const storageKey in LocalStorageKey) {
              SaveStorage.saveLocalStorage(
                storageKey as LocalStorageKey,
                cloudSaveData[storageKey]
              );
            }
            ElMessage.success(`存檔下載完成...3秒後自動重啟插件`);

            setTimeout(() => {
              location.reload();
            }, 3000);
            resolve();
          } else {
            reject();
          }
        })
        .catch(err => {
          console.error('err:', err);
          ElMessage.warning(`無此存檔, 請確認存檔代號是否正確`);
          reject();
        });
    });
  }
}
