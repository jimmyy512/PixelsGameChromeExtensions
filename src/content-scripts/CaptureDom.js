console.warn('capture dom start1111');
// (async () => {
//   console.warn('capture dom start');
//   if (typeof html2canvas === 'undefined') {
//     await fetch(
//       'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.js'
//     )
//       .then(response => response.text())
//       .then(scriptContent => {
//         eval(scriptContent);
//       });
//   }
//   window.addEventListener('message', event => {
//     console.warn('captureDom event:', event);
//     if (event?.action === 'START_CAPTURE') {
//       startCapture();
//     }
//   });
//   const startCapture = () => {
//     html2canvas(document.body).then(canvas => {
//       var imgURL = canvas.toDataURL('image/png');
//       window.postMessage(
//         { action: 'END_CAPTURE', data: imgURL, from: 'CaptureDom' },
//         '*'
//       );
//     });
//   };
// })();
