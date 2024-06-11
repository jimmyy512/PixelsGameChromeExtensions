import * as fs from 'fs';
import * as path from 'path';

// const backupIntervalMinutes = 60; // 每隔60分钟备份一次
const backupIntervalMinutes = 1; // 每隔60分钟备份一次

const backupData = () => {
  const getFormattedTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}_${hour}_${minute}`;
  };

  const sourcePath = path.join(__dirname, './data/data.json');

  // 检查文件是否存在
  if (!fs.existsSync(sourcePath)) {
    console.log('data.json does not exist, skipping backup.');
    return; // 如果文件不存在，则退出函数
  }

  const backupPath = path.join(__dirname, `./data/data-${getFormattedTimestamp()}.json`);

  fs.copyFile(sourcePath, backupPath, (err) => {
    if (err) {
      console.error('Error during backup:', err);
    } else {
      console.log(`Backup successful: ${backupPath}`);
    }
  });
};

// 设置定时器,每小時備份一次
setInterval(() => backupData(), backupIntervalMinutes * 3600 * 1000);
export default backupData;
