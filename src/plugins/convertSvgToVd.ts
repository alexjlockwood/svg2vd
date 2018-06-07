// TODO: attempt to convert 'opacity' to 'fill-opacity' or 'stroke-opacity' when possible?
// TODO: attempt to convert 'stroke-dasharray' and 'stroke-dashoffset'?
// TODO: clip-paths
// TODO: write custom plugin that moves inheritable attributes to the leaf nodes
// TODO: deal with weird first two arguments of svg viewbox
// TODO: confirm that it is never possible for nodes to still have 'transform' attributes at this point
// TODO: write custom plugin that converts web colors to android compatible colors
// TODO: figure out how to deal with numeric values containing 'px', '%', 'em', 'pt', etc.
// TODO: make sure default SVG attrs are applied to the final result
// TODO: convert gradients
// TODO: convert masks (is this possible)?
// TODO: convert ids to names (maybe add a command line option to keep IDs?)
// TODO: convert preserveAspectRatio?
// TODO: can we convert an SVG that doesn't have a viewBox (but maybe has width/height instead)? how?
// TODO: convert non-scaling stroke
// TODO: do we need to deal with 'inherit' attribute values? (let previous plugin handle?)
// TODO: confirm that the 'replaceUseElems' plugin is 100% up to spec
// TODO: investigate whether to support 'transform' attribute on the 'svg' node.
// TODO: confirm that color names (i.e. 'black', 'blue', etc.) are converted to hex prior to this plugin running
// TODO: rename input file if it contains dashes and stuff like that

import * as tinycolor from 'tinycolor2';

import { Item } from '../types/svgo';

export const convertSvgToVd = {
  active: true,
  type: 'perItem',
  fn: convertSvgToVdFn,
  params: undefined as any,
};

function convertSvgToVdFn(item: Item) {
  if (item.isElem('svg')) {
    convertSvgItem(item);
  } else if (item.isElem('g')) {
    convertGroupItem(item);
  } else if (item.isElem('path')) {
    convertPathItem(item);
  } else {
    return false;
  }
  return undefined;
}

function convertSvgItem(item: Item) {
  item.renameElem('vector');

  item.eachAttr(({ name, value }) => {
    item.removeAttr(name);

    switch (name) {
      case 'width':
      case 'height':
        addAndroidAttr(item, `${value}dp`, name);
        break;
      case 'viewBox':
        const nums = value.split(/[ ,]+/g);
        addAndroidAttr(item, nums[2], 'viewportWidth');
        addAndroidAttr(item, nums[3], 'viewportHeight');
        break;
      case 'opacity':
        addAndroidAttr(item, value, 'alpha');
        break;
    }
  });

  item.addAttr({
    name: 'xmlns:android',
    value: 'http://schemas.android.com/apk/res/android',
    prefix: 'xmlns',
    local: 'android',
  });
}

function convertGroupItem(item: Item) {
  item.renameElem('group');

  item.eachAttr(({ name }) => {
    item.removeAttr(name);
  });
}

function convertPathItem(item: Item) {
  if (!item.hasAttr('fill')) {
    item.addAttr({ name: 'fill', value: '#000', prefix: '', local: 'fill' });
  }
  if (
    !item.hasAttr('stroke-width') &&
    item.hasAttr('stroke') &&
    item.attr('stroke').value !== 'none'
  ) {
    item.addAttr({
      name: 'stroke-width',
      value: '1',
      prefix: '',
      local: 'stroke-width',
    });
  }

  item.eachAttr(({ name, value }) => {
    item.removeAttr(name);

    switch (name) {
      case 'd':
        addAndroidAttr(item, value, 'pathData');
        break;
      case 'fill':
        addAndroidAttr(item, convertToAndroidColor(value), 'fillColor');
        break;
      case 'fill-opacity':
        addAndroidAttr(item, value, 'fillAlpha');
        break;
      case 'stroke':
        addAndroidAttr(item, convertToAndroidColor(value), 'strokeColor');
        break;
      case 'stroke-opacity':
        addAndroidAttr(item, value, 'strokeAlpha');
        break;
      case 'stroke-width':
        addAndroidAttr(item, value, 'strokeWidth');
        break;
      case 'stroke-linecap':
        addAndroidAttr(item, value, 'strokeLineCap');
        break;
      case 'stroke-linejoin':
        addAndroidAttr(item, value, 'strokeLineJoin');
        break;
      case 'stroke-miterlimit':
        addAndroidAttr(item, value, 'strokeMiterLimit');
        break;
      case 'fill-rule':
        const fillTypeValue = value === 'evenodd' ? 'evenOdd' : 'nonZero';
        addAndroidAttr(item, fillTypeValue, 'fillType');
        break;
    }
  });
}

function addAndroidAttr(
  item: Item,
  androidAttrValue: string,
  androidAttrLocal: string,
) {
  item.addAttr({
    name: `android:${androidAttrLocal}`,
    value: androidAttrValue,
    prefix: 'android',
    local: androidAttrLocal,
  });
}

function convertToAndroidColor(svgColor: string): string | undefined {
  if (!svgColor || svgColor === 'none') {
    return undefined;
  }
  const colorInstance = tinycolor(svgColor);
  const colorHex = colorInstance.toHex();
  const alphaHex = colorInstance.toHex8().substr(6);
  return '#' + (alphaHex !== 'ff' ? alphaHex : '') + colorHex;
}
