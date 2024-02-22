import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const port = 8780;
const app: Express = express();
// 放寬傳輸限制
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const dataFilePath = path.join(__dirname, 'data.json');
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
    console.warn('cool');
    writeDataToFile(updatedData);
  });
}

function queueWriteOperation(key: string, value: any) {
  writeQueue.push(() => updateDataAndWriteToFile(key, value));
  if (writeQueue.length === 1) {
    processQueue();
  }
}

app.post('/write', (req: Request, res: Response) => {
  const { Key, SaveData } = req.body;
  if (Key === undefined || SaveData === undefined) {
    res.status(400).send('Key and value are required');
    return;
  }
  queueWriteOperation(Key, SaveData);
  res.send({ message: 'Data is being updated and written to the file.' });
});

app.get('/read', (req: Request, res: Response) => {
  const { key } = req.query;
  if (!key) {
    res.status(400).send('Key is required');
    return;
  }

  readDataFromFile((data: any) => {
    if (data.hasOwnProperty(key)) {
      res.send({ [key as string]: data[key as string] });
    } else {
      res.status(404).send('Key not found');
    }
  });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
