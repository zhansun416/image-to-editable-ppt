// Copy this file into an output folder and adapt it to one reference slide.
// Set PPTXGENJS_DIST to this skill's runtime dist when pptxgenjs is not installed in the output project.
const pptxgen = require(process.env.PPTXGENJS_DIST || 'pptxgenjs');
const pptx = new pptxgen();

// Measure the source image first. Preserve its aspect ratio instead of forcing widescreen.
const reference = {
  widthPx: 1600,
  heightPx: 1000,
  slideWidthIn: 12,
  fontFace: 'Aptos', // Replace with the closest available face after visual inspection.
};
reference.slideHeightIn = reference.slideWidthIn * reference.heightPx / reference.widthPx;
pptx.defineLayout({ name: 'REFERENCE_CANVAS', width: reference.slideWidthIn, height: reference.slideHeightIn });
pptx.layout = 'REFERENCE_CANVAS';
pptx.author = 'image-to-editable-ppt';
const slide = pptx.addSlide();

const pxToInX = (px) => px / reference.widthPx * reference.slideWidthIn;
const pxToInY = (px) => px / reference.heightPx * reference.slideHeightIn;
const sourceBox = ({ x, y, w, h }) => ({ x: pxToInX(x), y: pxToInY(y), w: pxToInX(w), h: pxToInY(h) });

function addReferenceText(objectName, value, bbox, options = {}) {
  slide.addText(value, {
    objectName,
    ...sourceBox(bbox),
    margin: 0,
    fontFace: reference.fontFace,
    ...options,
  });
}

// Use stable objectName values and mirror them in reconstruction-manifest.json.
// Preserve the reference's actual font family, weight, spacing, color, alignment, and layer order.
addReferenceText('title', 'Editable title', { x: 80, y: 55, w: 950, h: 90 }, {
  fontSize: 28,
  bold: true,
  color: '17324D',
});

pptx.writeFile({ fileName: 'editable-slide.pptx' });
