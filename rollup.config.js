import path from 'path';
export default {
  input: {
    devPanel: path.resolve(__dirname, './src/devtools_page/devPanel.html'),
  },
  output: {
    dir: 'prod', // 输出目录路径
    format: 'es', // ES 模块格式
  },
};
