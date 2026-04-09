import { api, LightningElement } from 'lwc';

export default class SimpleItemInfoViewArray extends LightningElement {
    @api eanCodes = [];
    @api imageWidth;
    @api imageHeight;
    @api inEnglish = false;
}