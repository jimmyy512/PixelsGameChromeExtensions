import { ElMessage } from 'element-plus';

enum LocalStorageKey {
  Fast_Count_State = 'Fast_Count_State',
  Customize_Count_State = 'Customize_Count_State',
  Customize_Note = 'Customize_Note',
  Daily_Task = 'Daily_Task',
  Cloud_Save_Time_Stamp = 'Cloud_Save_Time_Stamp',
}

export default class SaveStorage {
  private static PixelGameSaveData = 'PixelGameSaveData';
  public static LocalStorageKey = LocalStorageKey;
  public static cloudLastSaveTimeStamp = 0;
  public static saveLocalStorage(key: LocalStorageKey, value: any) {
    chrome.storage.local.set({
      [key]: value,
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

  public static async uploadSaveAllDataToCloudStorage() {
    let DataToSave: Record<string, any> = {};

    for (const key in LocalStorageKey) {
      DataToSave[key] = await SaveStorage.loadLocalStorage(
        key as LocalStorageKey
      );
    }

    chrome.storage.sync
      .set({ [SaveStorage.PixelGameSaveData]: DataToSave })
      .then(res => {
        console.warn('upload:', res);
        ElMessage.success('已上傳至雲端據');
      });
  }

  public static async downloadSaveAllDataFromCloudStorage() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(SaveStorage.PixelGameSaveData, result => {
        if (result) {
          console.warn('downloadSaveAllDataFromCloudStorage:', result);
          for (const key in LocalStorageKey) {
            SaveStorage.saveLocalStorage(
              key as LocalStorageKey,
              result[SaveStorage.PixelGameSaveData][key]
            );
          }

          ElMessage.success('已從雲端下載數據,重啟中...');
          // location.reload();
          resolve('downloadSaveAllDataFromCloudStorage success');
        } else {
          reject('downloadSaveAllDataFromCloudStorage error');
        }
      });
    });
  }

  // public static getCloudStorage(key: LocalStorageKey): { [key: string]: any } {
  //   return new Promise((resolve, reject) => {
  //     chrome.storage.sync.get(key, result => {
  //       if (result) {
  //         resolve(result[key]);
  //       } else {
  //         reject('getCloudStorage error');
  //       }
  //     });
  //   });
  // }

  // public static saveCloudStorage(key: LocalStorageKey, value: any) {
  //   chrome.storage.sync.set({ [key]: value }, function () {
  //     console.log(`Data for account ${key} has been stored.`);
  //   });
  // }

  // public static getCloudStorage(key: LocalStorageKey): { [key: string]: any } {
  //   return new Promise((resolve, reject) => {
  //     chrome.storage.sync.get(key, result => {
  //       if (result) {
  //         resolve(result[key]);
  //       } else {
  //         reject('getCloudStorage error');
  //       }
  //     });
  //   });
  // }
}
