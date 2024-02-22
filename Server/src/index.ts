import express, { Express, Request, Response } from 'express';
const port = 8780;

const app: Express = express();

app.get('/', (req: Request, res: Response) => {
  res.send('Hello world');
});

app.listen(port, () => {
  console.log('now listening on port :', port);
});

function sayHello(person: string) {
  return 'Hello 12345 , ' + person;
}

const user = 'jimmyy';
console.log(sayHello(user));
