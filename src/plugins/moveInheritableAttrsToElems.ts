// TODO: remove inheritable attributes from groups after we apply them to their children
// TODO: should non-group nodes pass down inheritable attrs (i.e. svg, clip-path, use, def, etc)?

import { Item } from '../types/svgo';

const inheritableAttrs: ReadonlySet<string> = new Set([
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke-width',
]);

export const moveInheritableAttrsToElems = {
  active: true,
  type: 'perItem',
  fn: moveInheritableAttrsToElemsFn,
  params: undefined as any,
};

function moveInheritableAttrsToElemsFn(item: Item) {
  if (!item.isElem('g') || item.isEmpty()) {
    return undefined;
  }

  item.eachAttr(attr => {
    if (!inheritableAttrs.has(attr.name)) {
      return;
    }
    item.content
      .filter(child => child.isElem('g') || child.isElem('path'))
      .filter(child => !child.hasAttr(attr.name))
      .forEach(child => child.addAttr({ ...attr }));
  });

  return undefined;
}
