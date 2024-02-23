import * as fs from 'fs';
import * as path from 'path';

const intervalMinutes = 60; // 每隔60分钟檢查一次
const backupDirectory = path.join(__dirname, '../data'); // 指向 data 子目录
console.log('backupDirectory:', backupDirectory);

const oneWeekAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000; // 一周前的时间戳

const clearOldBackups = () => {
  console.warn('clearOldBackups call:');
  fs.readdir(backupDirectory, (err, files) => {
    if (err) {
      console.error('Failed to list directory contents', err);
      return;
    }

    files.forEach((file) => {
      // 这里我们只关心以 'data-' 开头并且以 '.json' 结尾的文件
      if (file.startsWith('data-') && file.endsWith('.json')) {
        const filePath = path.join(backupDirectory, file);
        fs.stat(filePath, (err, stats) => {
          if (err) {
            console.error(`Failed to get file stats for ${file}`, err);
            return;
          }

          // 检查文件修改时间是否超过一周
          if (stats.mtime.getTime() < oneWeekAgo) {
            // 删除文件
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`Failed to delete ${file}`, err);
              } else {
                console.log(`${file} was deleted successfully.`);
              }
            });
          }
        });
      }
    });
  });
};

setInterval(clearOldBackups, intervalMinutes * 60 * 1000);
export default clearOldBackups;
