console.warn('captureDom start!!!!');

// setTimeout(() => {
//   console.warn(
//     'asd:',
//     document.querySelector('.Store_store-tabs-wrapper__OfH4C')
//   );
// }, 5000);
// html2canvas(document.querySelector('.Store_store-tabs-wrapper__OfH4C')).then(
//   (canvas: any) => {
//     var img = canvas.toDataURL('image/png');
//     // 在这里你可以处理图片，例如显示、保存或发送到服务器
//     console.log(img);
//   }
// );

(async () => {
  if (typeof html2canvas === 'undefined') {
    await fetch(
      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.js'
    )
      .then(response => response.text())
      .then(scriptContent => {
        eval(scriptContent);
      });
  }

  // 确保 html2canvas 加载完成
  html2canvas(document.body).then(canvas => {
    console.warn('canvas:', canvas);
    var imgURL = canvas.toDataURL('image/png');
    // 使用 canvas
  });
})();
