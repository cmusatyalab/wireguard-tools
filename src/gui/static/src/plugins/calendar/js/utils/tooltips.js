import Manipulator from '../mdb/dom/manipulator';
import { eventTimePeriod } from './utils';

class Tooltip {
  constructor(element, event, formats) {
    this._element = element;
    this._event = event;
    this._formats = formats;

    this._content = '';
    this.init();
  }

  init() {
    this._setContent();
    this._initTooltip();
  }

  _setContent() {
    this._setSummary();
    this._setDescription();
    this._setTime();
  }

  _setSummary() {
    const summary = `<h6><strong>${this._event.summary}</strong></h6>`;
    this._content += summary;
  }

  _setDescription() {
    if (this._event.description !== undefined) {
      const description = `<p><small><em>${this._event.description}</em></small></p>`;
      this._content += description;
    }
  }

  _setTime() {
    const time = `<p class="mb-0"><small>
    <i class="fas fa-calendar-alt pr-1"></i>
    ${eventTimePeriod(this._event, this._formats)}</small></p>`;
    this._content += time;
  }

  _initTooltip() {
    Manipulator.setDataAttribute(this._element, 'toggle', 'tooltip');
    Manipulator.setDataAttribute(this._element, 'offset', [0, 10]);
    Manipulator.setDataAttribute(this._element, 'html', true);
    this._element.setAttribute('title', this._content);
  }
}

export default Tooltip;
