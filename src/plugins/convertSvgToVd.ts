export const convertSvgToVd = {
  active: true,
  type: 'perItem',
  fn: convertSvgToVdFn,
  params: undefined as any,
};

const elemMap = {
  svg: 'vector',
  g: 'group',
  path: 'path',
};

// const attrPathMap = {
//   d: 'pathData',
//   fill: 'fillColor',
//   'fill-opacity': 'fillAlpha',
//   stroke: 'strokeColor',
//   'stroke-opacity': 'strokeAlpha',
// };

function convertSvgToVdFn(item: any, params: any): any {
  Object.entries(elemMap).forEach(([key, value]) => {
    if (item.isElem(key)) {
      item.renameElem(value);
    }
  });
}
