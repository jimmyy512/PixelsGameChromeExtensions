export const CountCONF = {
  Milk: {
    name: '牛奶',
    CountDown: [4800], // 1.5h
  },
  Energy: {
    name: '能量',
    CountDown: [21600], // 6h
  },
  // PumpKing: {
  //   name: '南瓜',
  //   CountDown: [10800, 2400], // 3h, 40m
  // },
  Bee: {
    name: '蜜蜂',
    CountDown: [2700], // 45m
  },
  Chicken: {
    name: '生蛋',
    CountDown: [3600], // 1h
  },
  Mining: {
    name: '挖礦',
    CountDown: [5400], // 1h
  },
};

export type CountConfKey = keyof typeof CountCONF;
