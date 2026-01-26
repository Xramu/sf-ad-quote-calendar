import { api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class ItemInfoModal extends LightningModal {
  @api item;

  get entries() {
    const raw = this.item?.extraJsonData;
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((x) => x && (x.name || x.value))
        .map((x, idx) => {
          const title = x.name ?? '';
          const value = x.value ?? '';
          return {
            key: `${idx}`,
            titleWithColon: title ? `${title}:` : '',
            value
          };
        });
    } catch (e) {
      return [];
    }
  }

  get hasEntries() {
    return this.entries.length > 0;
  }

  handleClose = () => {
    this.close();
  };
}
