// TODO: create 'document' type for 'full' plugins

export interface Item {
  readonly content: ReadonlyArray<Item>;
  addAttr(attr: Attr): void;
  attr(attrName: string): Attr;
  eachAttr(callbackFn: (attr: Attr) => void);
  isElem(elemName: string);
  isEmpty(): boolean;
  hasAttr(name: string);
  removeAttr(attrName: string | string[]): void;
  renameElem(elem: string): Item;
}

export interface Attr {
  readonly name: string;
  readonly value: string;
  readonly prefix: string;
  readonly local: string;
}
