import { track, api, LightningElement } from 'lwc';
import { ProductDataManager } from 'c/itemInfoUtils';

export default class SimpleItemInfoVIew extends LightningElement {
  @api eanCode;
  @api imageWidth;
  @api imageHeight;

  get detailsToShow() {
    return 'Image, Name, Description, EAN Code';
  }
}