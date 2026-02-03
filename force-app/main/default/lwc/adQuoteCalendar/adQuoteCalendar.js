/**
 * Ad Quote Calendar - Parent container
 * Layout:
 *  - Left: Calendar View (80%)
 *  - Right: Details View (20%)
 * Responsibilities:
 *  - Manage current year, selected week, selected campaign
 *  - Load weekly summaries via Apex (cacheable)
 *  - Pass data to child components
 *
 * Notes:
 *  - Weeks are Sunday-start, week numbers computed on server
 *  - No inline math/concat in template per project rules
 */
import { LightningElement, track } from 'lwc';
import getWeeklySummary from '@salesforce/apex/AdCampaignCalendarService.getWeeklySummary';

export default class AdQuoteCalendar extends LightningElement {
  @track currentYear = new Date().getFullYear();
  @track selectedWeek = null;
  @track selectedCampaignId = null;

  // Internal store for week summaries keyed by week number
  _weekSummariesByKey = {};
  @track weekSummariesArray = [];

  connectedCallback() {
    this.loadWeeklySummary();
  }

  get currentYearLabel() {
    // Keep simple identifier binding in template
    return `${this.currentYear}`;
  }

  handlePrevYear = () => {
    this.currentYear = this.currentYear - 1;
    this.selectedWeek = null;
    this.selectedCampaignId = null;
    this.loadWeeklySummary();
  };

  handleNextYear = () => {
    this.currentYear = this.currentYear + 1;
    this.selectedWeek = null;
    this.selectedCampaignId = null;
    this.loadWeeklySummary();
  };

  async loadWeeklySummary() {
    try {
      const data = await getWeeklySummary({ year: this.currentYear });
      this._weekSummariesByKey = data || {};
      // Make an ordered array of 1..53 for rendering
      const arr = [];
      for (let w = 1; w <= 53; w += 1) {
        const dto = this._weekSummariesByKey[w] || {
          weekNumber: w,
          hasAnyCampaign: false,
          hasCurrentUserCampaign: false,
          hasOtherCampaign: false
        };
        arr.push(dto);
      }
      this.weekSummariesArray = arr;
    } catch (e) {
      // Basic error surface; could add toast if desired
      // eslint-disable-next-line no-console
      console.error('Failed to load weekly summary', e);
      this._weekSummariesByKey = {};
      this.weekSummariesArray = [];
    }
  }

  handleWeekSelected = (evt) => {
    // If week changes, clear selected campaign until user chooses one (or details view auto-opens if single)
    this.selectedCampaignId = null;

    const { weekNumber } = evt.detail || {};
    this.selectedWeek = weekNumber || null;
    console.log(this.selectedWeek);
  };

  handleCampaignSelected = (evt) => {
    const { campaignId } = evt.detail || {};
    this.selectedCampaignId = campaignId || null;
  };
}
