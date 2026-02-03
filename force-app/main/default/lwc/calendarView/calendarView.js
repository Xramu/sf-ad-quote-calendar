/**
 * Calendar View (left pane)
 * - Displays 1..53 weeks for given year
 * - Colors each week cell using summary flags
 * - Emits 'weekselected' when a week with campaigns is clicked
 *
 * Notes:
 * - No inline template expressions; classes computed via getters/helpers
 * - Sunday-start week numbers, provided by server in weekSummaries
 */
import { LightningElement, api, track } from 'lwc';

export default class CalendarView extends LightningElement {
  @api year;
  @api weekSummaries = []; // array of { weekNumber, hasAnyCampaign, hasCurrentUserCampaign }

  @track _weeks = [];
  @api selectedWeek = null;

  connectedCallback() {
    this.computeWeeks();
  }

  renderedCallback() {
    // nothing for now
  }

  set weekSummaries(value) {
    this._weeks = Array.isArray(value) ? value : [];
  }
  get weekSummaries() {
    return this._weeks;
  }

  get calendarTitle() {
    return `Viikot ${this.year || ''}`;
  }

  get weeks() {
    return this._weeks;
  }

  get weeksWithClasses() {
    return this._weeks.map(week => ({
      ...week,
      cellClass: this.getCellClass(week)
    }));
  }

  getCellClass(dto) {
    const base = ['cell'];
    if (dto && dto.hasAnyCampaign) {
      console.log(dto);
      // Use explicit 'hasOtherCampaign' from DTO when available to decide split vs own-only.
      // Priority:
      // - both: user + other campaigns present
      // - own: only current user campaigns present
      // - other: campaigns present but none for current user
      if (dto.hasCurrentUserCampaign && dto.hasOtherCampaign) {
        base.push('both');
      } else if (dto.hasCurrentUserCampaign) {
        base.push('own');
      } else {
        base.push('other');
      }

      base.push('clickable');

      if (dto.weekNumber === this.selectedWeek) {
        base.push('selected');
      }
    } else {
      base.push('empty');
    }
    return base.join(' ');
  }

  handleCellClick = (evt) => {
    const week = Number(evt.currentTarget?.dataset?.week);
    const dto = this._weeks.find((w) => w.weekNumber === week);
    if (!dto || !dto.hasAnyCampaign) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent('weekselected', {
        detail: { weekNumber: week },
        bubbles: true,
        composed: true
      })
    );
  };

  handleCellKeydown = (evt) => {
    if (evt.key === 'Enter' || evt.key === ' ') {
      evt.preventDefault();
      this.handleCellClick(evt);
    }
  };

  computeWeeks() {
    // Ensure there are always 1..53 entries for layout stability
    if (!Array.isArray(this._weeks) || this._weeks.length === 0) {
      const arr = [];
      for (let i = 1; i <= 53; i += 1) {
        arr.push({ weekNumber: i, hasAnyCampaign: false, hasCurrentUserCampaign: false, hasOtherCampaign: false });
      }
      this._weeks = arr;
    }
  }
}
