/**
 * Week Cell (reusable)
 * - Props: weekNumber, hasAnyCampaign, hasCurrentUserCampaign
 * - Computes class names without inline template expressions
 * - Emits 'weekselected' when clickable and activated
 */
import { LightningElement, api } from 'lwc';

export default class WeekCell extends LightningElement {
  @api weekNumber;
  @api hasAnyCampaign = false;
  @api hasCurrentUserCampaign = false;

  get cellClass() {
    const base = ['cell'];
    if (this.hasAnyCampaign) {
      if (this.hasCurrentUserCampaign) {
        base.push('own');
      } else {
        base.push('other');
      }
      base.push('clickable');
    } else {
      base.push('empty');
    }
    return base.join(' ');
  }

  get labelText() {
    return `${this.weekNumber || ''}`;
  }

  get titleText() {
    return this.labelText;
  }

  handleClick = () => {
    if (!this.hasAnyCampaign) return;
    this.dispatchEvent(
      new CustomEvent('weekselected', {
        detail: { weekNumber: this.weekNumber },
        bubbles: true,
        composed: true
      })
    );
  };

  handleKeydown = (evt) => {
    if (evt.key === 'Enter' || evt.key === ' ') {
      evt.preventDefault();
      this.handleClick();
    }
  };
}
