import { api, LightningElement } from 'lwc';

export default class SimpleItemInfoVIew extends LightningElement {
  @api eanCode;
  @api imageWidth;
  @api imageHeight;
  @api inEnglish = false;

  get detailsToShow() {
    return 'Image, Name, Description, EAN Code';
  }
}