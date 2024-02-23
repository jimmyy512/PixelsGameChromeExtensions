import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import AutoBackup from './AutoBackup';
import ClearOldBackup from './ClearOldBackup';

const port = 3000;
const app: Express = express();
// 放寬傳輸限制
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
// 跨網域
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild'
  );
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  if (req.method == 'OPTIONS') res.send(200);
  else next();
});

const dataFilePath = path.join(__dirname, './data/data.json');
const writeQueue: Array<() => void> = [];

function processQueue() {
  if (writeQueue.length > 0) {
    const task = writeQueue.shift();
    if (task) {
      task();
    }
  }
}

function readDataFromFile(callback: (data: any) => void) {
  fs.readFile(dataFilePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        callback({});
      } else {
        console.error('Error reading file:', err);
      }
    } else {
      callback(JSON.parse(data.toString()));
    }
  });
}

function writeDataToFile(updatedData: object) {
  const dir = path.dirname(dataFilePath);

  // 檢查目錄是否存在
  if (!fs.existsSync(dir)) {
    // 遞歸創建目錄
    fs.mkdirSync(dir, { recursive: true });
  }

  // 現在目錄存在了，可以安全地寫入文件
  fs.writeFile(dataFilePath, JSON.stringify(updatedData, null, 2), (err) => {
    if (err) {
      console.error('Error writing file:', err);
    }
    processQueue();
  });
}

function updateDataAndWriteToFile(key: string, value: any) {
  readDataFromFile((currentData) => {
    // 更新指定key的值
    const updatedData = { ...currentData, [key]: value };
    writeDataToFile(updatedData);
  });
}

function queueWriteOperation(key: string, value: any) {
  writeQueue.push(() => updateDataAndWriteToFile(key, value));
  if (writeQueue.length === 1) {
    processQueue();
  }
}

app.post('/setData', (req: Request, res: Response) => {
  const { Key, SaveData } = req.body;
  if (Key === undefined || SaveData === undefined) {
    res.status(400).send('Key and value are required');
    return;
  }

  console.warn('setData receive key:', Key);
  queueWriteOperation(Key, SaveData);
  res.send({ message: 'Data is being updated and written to the file.' });
});

app.get('/getData', (req: Request, res: Response) => {
  const { Key } = req.query;
  if (!Key) {
    res.status(400).send('Key is required');
    return;
  }

  console.warn('getData receive key:', Key);

  readDataFromFile((data: any) => {
    if (data.hasOwnProperty(Key)) {
      res.send({ [Key as string]: data[Key as string] });
    } else {
      res.status(404).send('Key not found');
    }
  });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// 自動備份模組
AutoBackup(); // 每60分鐘備份一次
ClearOldBackup(); // 每1440分鐘清理一次
