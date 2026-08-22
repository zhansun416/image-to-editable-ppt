// Copy this file into an output folder and adapt it to one reference slide.
const pptxgen = require('pptxgenjs');
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'image-to-editable-ppt';
const slide = pptx.addSlide();

// Keep Latin/English runs in Times New Roman. Use PingFang SC on macOS and Microsoft YaHei elsewhere.
function addMixedText(value, x, y, w, h, options = {}) {
  const chineseFace = options.fontFace || (process.platform === 'darwin' ? 'PingFang SC' : 'Microsoft YaHei');
  const runs = String(value).split(/([\x00-\x7F]+)/g).filter(Boolean).map(part => ({
    text: part,
    options: { fontFace: /[\x00-\x7F]/.test(part) ? 'Times New Roman' : chineseFace }
  }));
  slide.addText(runs, { x, y, w, h, margin: 0, fontSize: 16, fit: 'shrink', ...options });
}

// Add native objects here. Avoid full-slide screenshot backgrounds.
addMixedText('Editable title', 0.5, 0.4, 8, 0.5, { fontSize: 28, bold: true, color: '005B5E' });

pptx.writeFile({ fileName: 'editable-slide.pptx' });
