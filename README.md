<div align="center">

![vitaly icon](./public/icon-128.png)

</div>

# 簡介

此插件希望未來可以稱霸水果

## 來源

[Fork 原專案](https://github.com/elwin013/vitaly-extension)

## 本地開發流程

0. NodeJS 版本 v18.17.1
1. 輸入 `npm install`.
2. Run `npm run start` 來運行開發.
3. 運行完成後會產生 `dist` 目錄, 接著如下圖.

   1. 網址輸入 `chrome://extensions`
   2. 打開 `開發人員模式`
   3. 選擇 `載入未封裝項目` 並且選擇 `dist` 目錄

   ![loading unpacked extension](load-unpacked-extension.png)

4. 完成

## 本地打包流程

0. `npm run build`
1. `本地會產生prod`
2. 運行完成後會產生 `prod` 目錄, 接著如下圖.
   1. 網址輸入 `chrome://extensions`
   2. 打開 `開發人員模式`
   3. 選擇 `載入未封裝項目` 並且選擇 `prod` 目錄
      ![loading unpacked extension](load-unpacked-extension.png)

## License

Jim
