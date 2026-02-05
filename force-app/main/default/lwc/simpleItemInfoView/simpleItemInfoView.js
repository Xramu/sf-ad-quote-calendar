import { track, LightningElement } from 'lwc';

export default class SimpleItemInfoVIew extends LightningElement {
  @track isLoading = false;
  @track hasError = false;
}