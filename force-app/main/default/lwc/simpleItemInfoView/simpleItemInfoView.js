import { api, LightningElement } from 'lwc';

export default class SimpleItemInfoVIew extends LightningElement {
  @api eanCode;
  @api imageWidth;
  @api imageHeight;

  get detailsToShow() {
    return 'Image, Name, Description, EAN Code';
  }
}