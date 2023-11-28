import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import minMax from 'dayjs/plugin/minMax';
import { getUID, element, typeCheckConfig, getjQuery, onDOMContentLoaded } from './mdb/util/index';
import Data from './mdb/dom/data';
import EventHandler from './mdb/dom/event-handler';
import Manipulator from './mdb/dom/manipulator';
import SelectorEngine from './mdb/dom/selector-engine';

import Tooltip from './utils/tooltips';
import { addModalTemplate, editModalTemplate } from './utils/templates';
import { eventType, eventTimePeriod } from './utils/utils';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(minMax);

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'calendar';
const DATA_KEY = 'mdb.calendar';
const SELECTOR_DATA_INIT = '[data-mdb-calendar-init]';

const CLASSNAME_DAY_FIELD = 'day-field';
const CLASSNAME_CALENDAR_TOOLS = 'calendar-tools';
const CLASSNAME_CALENDAR_HEADING = 'calendar-heading';
const CLASSNAME_ALL_DAY_ROW = 'long-event-row';
const CLASSNAME_EVENTS_WRAPPER = 'events-wrapper';
const CLASSNAME_ACTIVE = 'active';

const SELECTOR_ACTIVE_CELL = `td.${CLASSNAME_ACTIVE}`;
const SELECTOR_CALENDAR_SUMMARY_INPUT = '.calendar-summary-input';
const SELECTOR_CALENDAR_LONG_EVENTS_CHECKBOX = '.calendar-long-events-checkbox';

const EDIT_EVENT = 'editEvent.mdb.calendar';
const ADD_EVENT = 'addEvent.mdb.calendar';
const DELETE_EVENT = 'deleteEvent.mdb.calendar';

const TIMEPICKER_VALUE_CHANGED_EVENT = 'valueChanged.mdb.timepicker';
const DATEPICKER_VALUE_CHANGED_EVENT = 'valueChanged.mdb.datepicker';
const SELECT_VALUE_CHANGED_EVENT = 'valueChange.mdb.select';

const OPTIONS_TYPE = {
  addEventCaption: 'string',
  weekdays: '(array|string)',
  months: '(array|string)',
  monthsShort: '(array|string)',
  mondayFirst: 'boolean',
  defaultView: 'string',
  twelveHour: 'boolean',
  defaultDate: '(object|string)',
  readonly: 'boolean',
  todayCaption: 'string',
  monthCaption: 'string',
  weekCaption: 'string',
  listCaption: 'string',
  allDayCaption: 'string',
  noEventsCaption: 'string',
  summaryCaption: 'string',
  descriptionCaption: 'string',
  startCaption: 'string',
  endCaption: 'string',
  addCaption: 'string',
  deleteCaption: 'string',
  saveCaption: 'string',
  closeCaption: 'string',
  addEventModalCaption: 'string',
  editEventModalCaption: 'string',
  events: 'array',
  tooltips: 'boolean',
  navigation: 'boolean',
  viewSelect: 'boolean',
  addEventButton: 'boolean',
  blur: 'boolean',
  newEventAttributes: 'function',
  datepickerOptions: 'object',
  timepickerOptions: 'object',
};

const DEFAULT_OPTIONS = {
  addEventCaption: 'Add event',
  weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  months: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  mondayFirst: false,
  defaultView: 'month',
  twelveHour: false,
  defaultDate: dayjs().format('DD/MM/YYYY'),
  readonly: false,
  todayCaption: 'Today',
  monthCaption: 'Month',
  weekCaption: 'Week',
  allDayCaption: 'All day event',
  listCaption: 'List',
  noEventsCaption: 'No events',
  summaryCaption: 'Summary',
  descriptionCaption: 'Description',
  startCaption: 'Start',
  endCaption: 'End',
  addCaption: 'Add',
  deleteCaption: 'Remove',
  saveCaption: 'Save',
  closeCaption: 'Close',
  addEventModalCaption: 'Add an event',
  editEventModalCaption: 'Edit an event',
  events: [],
  tooltips: true,
  navigation: true,
  viewSelect: true,
  addEventButton: true,
  blur: false,
  newEventAttributes: (event) => event,
  datepickerOptions: {},
  timepickerOptions: {},
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Calendar {
  constructor(element, options = {}) {
    this._element = element;
    this._options = options;

    this.formats = {
      date: 'DD/MM/YYYY',
      dateTime: this.options.twelveHour ? 'DD/MM/YYYY hh:mm A' : 'DD/MM/YYYY HH:mm',
      time: this.options.twelveHour ? 'hh:mm A' : 'HH:mm',
    };
    this.view = this.options.defaultView;
    this.weekdays = [...this.options.weekdays];
    this.activeMoment = dayjs(this.options.defaultDate, this.formats.date);

    const eventsDeepCopy =
      this.options.events.length > 0 ? JSON.parse(JSON.stringify(this.options.events)) : [];

    this._events = this._formatEvents(eventsDeepCopy);
    this._newEvent = {};
    this._activeEvent = {};

    this._addModalId = getUID('addModal');
    this._editModalId = getUID('editModal');
    this._table = null;
    this._tHead = null;
    this._tBody = null;
    this._addEventModal = null;
    this._editEventModal = null;
    this._tools = null;
    this._arrowLeft = null;
    this._arrowRight = null;
    this._pickedStartDate = null;

    this._addEventModalInstance = null;
    this._editEventModalInstance = null;
    this._colorDropdownInstances = [];
    this._inputInstances = [];
    this._tooltips = [];

    if (this._element) {
      Data.setData(element, DATA_KEY, this);
    }

    this.init();
  }

  // Getters
  get events() {
    return this._parseEvents(this._events);
  }

  get options() {
    const config = {
      ...DEFAULT_OPTIONS,
      ...Manipulator.getDataAttributes(this._element),
      ...this._options,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    if (typeof config.weekdays === 'string') config.weekdays = config.weekdays.split(', ');
    if (typeof config.months === 'string') config.months = config.months.split(', ');
    if (typeof config.monthsShort === 'string') config.monthsShort = config.monthsShort.split(', ');

    return config;
  }

  get activeMomentCopy() {
    return dayjs(this.activeMoment);
  }

  get activeEventIndex() {
    return this._activeEvent.key - 1;
  }

  // Public
  init() {
    this._appendTemplate();
    this._sortEvents();
    this._addEventsKeys();
    this._setEvents();
    this._orderEvents();
    this._setLongEventCaptions();
    this._addListeners();
    this._initTooltips();
    this._initSelect();

    if (!this.options.readonly) {
      this._createAddEventModal();
      this._createEditEventModal();
    }
  }

  prev() {
    switch (this.view) {
      case 'month':
        this.activeMoment = this.activeMoment.startOf('month').subtract(1, 'month');
        break;
      case 'week':
      case 'list':
        this.activeMoment = this.activeMoment.subtract(1, 'week');
        this._setTHeadCaptions();
        break;
      default:
        return;
    }

    this._refreshTable();
    this._triggerEvent('prev');
  }

  next() {
    switch (this.view) {
      case 'month':
        this.activeMoment = this.activeMoment.startOf('month').add(1, 'month');
        this._setTBody();
        break;
      case 'week':
      case 'list':
        this.activeMoment = this.activeMoment.add(1, 'week');
        this._setTHeadCaptions();
        break;
      default:
        return;
    }

    this._refreshTable();
    this._triggerEvent('next');
  }

  today() {
    this.activeMoment = dayjs();
    this._setHeading();

    switch (this.view) {
      case 'month':
        this._setTBody();
        break;
      case 'week':
      case 'list':
        this._setTHeadCaptions();
        break;
      default:
        return;
    }

    this._refreshTable();
    this._triggerEvent('today');
  }

  changeView(target) {
    this.view = target;
    this._setTHeadCaptions();
    this._setHeading();
    this._refreshTable();
    this._updateSelectValue();
    this._triggerEvent('viewChange');
  }

  refresh() {
    this._clearEvents();
    this._sortEvents();
    this._addEventsKeys();
    this._setTBody();
    this._setEvents();
    this._orderEvents();
    this._setLongEventCaptions();
    this._initTooltips();
    this._triggerEvent('update');
  }

  addEvents(events) {
    const eventsDeepCopy = JSON.parse(JSON.stringify(events));
    this._events = this._formatEvents([...this._events, ...eventsDeepCopy]);
    this.refresh();
  }

  removeEvents() {
    this._events = [];
    this.refresh();
  }

  dispose() {
    this.removeEvents();
    this._removeListeners();
    this._disposeModals();

    Data.removeData(this._element, DATA_KEY);
    this._element.innerHTML = null;
  }

  // Private
  _formatEvents(events) {
    return events.map((event) => {
      event = { ...event };
      event.created = event.created && dayjs(event.created, this.formats.dateTime);
      event.start.date = event.start.date && dayjs(event.start.date, this.formats.date);
      event.start.dateTime = event.start.dateTime
        ? dayjs(event.start.dateTime, this.formats.dateTime)
        : dayjs(event.start.date, this.formats.date);
      event.end.date = event.end.date && dayjs(event.end.date, this.formats.date);
      event.end.dateTime = event.end.dateTime
        ? dayjs(event.end.dateTime, this.formats.dateTime)
        : dayjs(event.end.date, this.formats.date);
      event.color = event.color || {};
      return event;
    });
  }

  _updateSelectValue() {
    const selectInstance = mdb.Select.getInstance(this._viewSelect);
    selectInstance.setValue(this.view);
  }

  _parseEvent(event) {
    return {
      ...event,
      start: {
        date: dayjs(event.start.date).format(this.formats.date),
        dateTime: dayjs(event.start.dateTime).format(this.formats.dateTime),
      },
      end: {
        date: dayjs(event.end.date).format(this.formats.date),
        dateTime: dayjs(event.end.dateTime).format(this.formats.dateTime),
      },
      created: event.created ? dayjs(event.created).format(this.formats.dateTime) : undefined,
    };
  }

  _parseEvents(events) {
    return events.map((event) => this._parseEvent(event));
  }

  _appendTemplate() {
    this._appendTools();
    this._appendTable();
    if (this.options.mondayFirst) {
      this.weekdays.push(this.weekdays.shift());
    }
    this._setTHeadCaptions();
    this._setTBody();
  }

  _appendTable() {
    this._table = element('table');
    this._element.append(this._table);

    this._tHead = element('thead');
    this._table.append(this._tHead);

    this._tBody = element('tbody');
    this._table.append(this._tBody);

    const tr = element('tr');
    this._tHead.append(tr);
  }

  _appendTools() {
    this._tools = element('div');
    const leftTools = element('div');
    const rightTools = element('div');
    const navigation = element('div');
    this._todayBtn = element('button');
    this._arrowLeft = element('button');
    this._arrowRight = element('button');
    this._heading = element('span');
    this._viewSelect = element('select');
    this._newEventBtn = element('button');

    Manipulator.addClass(this._tools, CLASSNAME_CALENDAR_TOOLS);
    Manipulator.addClass(this._heading, CLASSNAME_CALENDAR_HEADING);
    Manipulator.addClass(leftTools, 'd-flex');
    Manipulator.addClass(leftTools, 'flex-column');
    Manipulator.addClass(leftTools, 'flex-lg-row');
    Manipulator.addClass(leftTools, 'justify-content-center');
    Manipulator.addClass(leftTools, 'align-items-center');
    Manipulator.addClass(navigation, 'my-2');
    Manipulator.addClass(navigation, 'me-2');
    Manipulator.addClass(navigation, 'my-lg-0');
    Manipulator.addClass(navigation, 'd-flex');
    Manipulator.addClass(navigation, 'justify-content-center');
    Manipulator.addClass(rightTools, 'd-flex');
    Manipulator.addClass(rightTools, 'justify-content-center');
    Manipulator.addClass(this._viewSelect, 'select');
    Manipulator.addClass(this._newEventBtn, 'btn');
    Manipulator.addClass(this._newEventBtn, 'btn-primary');
    [this._arrowLeft, this._arrowRight, this._todayBtn].forEach((btn) => {
      Manipulator.setDataAttribute(btn, 'ripple-color', 'dark');
    });

    this._todayBtn.innerHTML = this.options.todayCaption;
    this._arrowLeft.innerHTML = '<i class="fas fa-chevron-left"></i>';
    this._arrowRight.innerHTML = '<i class="fas fa-chevron-right"></i>';
    this._viewSelect.innerHTML = `<option value="month" ${
      this.options.defaultView === 'month' && 'selected'
    }>${this.options.monthCaption}</option><option value="week" ${
      this.options.defaultView === 'week' && 'selected'
    }>${this.options.weekCaption}</option><option value="list" ${
      this.options.defaultView === 'list' && 'selected'
    }>${this.options.listCaption}</option>`;
    this._newEventBtn.innerHTML = this.options.addEventCaption;

    ['btn', 'btn-link'].forEach((className) => {
      Manipulator.addClass(this._arrowLeft, className);
      Manipulator.addClass(this._arrowRight, className);
      Manipulator.addClass(this._todayBtn, className);
    });

    this._setHeading();

    navigation.append(this._todayBtn);
    navigation.append(this._arrowLeft);
    navigation.append(this._arrowRight);

    if (this.options.navigation) {
      leftTools.append(navigation);
    }
    leftTools.append(this._heading);
    if (this.options.viewSelect) {
      rightTools.append(this._viewSelect);
    }
    if (this.options.addEventButton && !this.options.readonly) {
      rightTools.append(this._newEventBtn);
    }
    this._tools.append(leftTools);
    this._tools.append(rightTools);
    this._element.append(this._tools);
  }

  _setTHeadCaptions() {
    const headTr = SelectorEngine.findOne('tr', this._tHead);
    headTr.innerHTML = '';

    if (this.view === 'month') {
      this.weekdays.forEach((day) => {
        const th = element('th');
        th.innerHTML = day;
        headTr.append(th);
      });
    } else if (this.view === 'week') {
      const th = element('th');
      headTr.append(th);

      for (let i = 0; i < 7; i++) {
        const th = element('th');

        if (this.options.mondayFirst) {
          const day = this.activeMomentCopy.startOf('week').add(i + 1, 'day');

          th.innerHTML = `<div class="weekday-field">${
            this.weekdays[i]
          }</div><div class="day-field">${day.format('DD')}</div>`;

          if (day.isSame(dayjs(), 'day')) {
            Manipulator.addClass(th, 'today');
          }
        } else {
          const day = this.activeMomentCopy.startOf('week').add(i, 'day');

          th.innerHTML = `<div class="weekday-field">${
            this.weekdays[i]
          }</div><div class="day-field">${day.format('DD')}</div>`;

          if (day.isSame(dayjs(), 'day')) {
            Manipulator.addClass(th, 'today');
          }
        }

        headTr.append(th);
      }
    }
  }

  _setTBody() {
    this._clearTBody();
    Manipulator.addClass(this._table, this.view);

    switch (this.view) {
      case 'month':
        this._appendWeekRows();
        this._appendPrevMonthDays();
        this._appendCurrentMonthDays();
        this._appendNextMonthDays();
        break;
      case 'week':
        this._appendLongEventSection();
        this._appendHoursSection();
        break;
      default:
        return;
    }
  }

  _appendWeekRows() {
    for (let i = 0; i < 6; i++) {
      const tr = element('tr');
      this._tBody.append(tr);
    }
  }

  _appendPrevMonthDays() {
    const firstDayOfActiveMonth = this.activeMomentCopy.startOf('month').day();
    const prevMonthDays = this._getArrayFromNumber(
      this.activeMomentCopy.subtract(1, 'months').daysInMonth()
    );

    let splicedPrevMonthDays;
    if (this.options.mondayFirst) {
      if (firstDayOfActiveMonth === 0) {
        splicedPrevMonthDays = prevMonthDays.reverse().splice(0, 6).reverse();
      } else {
        splicedPrevMonthDays = prevMonthDays
          .reverse()
          .splice(0, firstDayOfActiveMonth - 1)
          .reverse();
      }
    } else {
      splicedPrevMonthDays = prevMonthDays.reverse().splice(0, firstDayOfActiveMonth).reverse();
    }

    splicedPrevMonthDays.forEach((day) => {
      this._appendPrevMonthDayFields(day);
    });
  }

  _appendPrevMonthDayFields(day) {
    const eventsWrapper = element('div');
    const td = element('td');
    const dayFieldWrapper = element('div');
    const dayField = element('div');

    Manipulator.addClass(eventsWrapper, CLASSNAME_EVENTS_WRAPPER);
    Manipulator.addClass(td, 'disabled');
    Manipulator.addClass(dayFieldWrapper, 'day-field-wrapper');
    Manipulator.addClass(dayField, CLASSNAME_DAY_FIELD);

    dayFieldWrapper.append(dayField);
    td.append(dayFieldWrapper);
    td.append(eventsWrapper);

    const date = `${this._pad(day + 1)}/${this._pad(
      this.activeMomentCopy.startOf('month').subtract(1, 'month').month() + 1
    )}/${this.activeMomentCopy.startOf('month').subtract(1, 'month').year()}`;
    td.dataset.date = date;

    dayField.innerHTML = day + 1;
    SelectorEngine.findOne('tr', this._tBody).append(td);

    if (!this.options.readonly) {
      this._addDayFieldListeners(td, date);
    }
  }

  _addDayFieldListeners(element, date) {
    EventHandler.on(element, 'mousedown', () => this._setStartDate(date));
    EventHandler.on(element, 'mouseenter', () => this._highlightLongEventField(date));
    EventHandler.on(element, 'mouseup', (e) => this._toggleAddEventModal(e, date));
    EventHandler.on(element, 'dragenter', (e) => this._handleDragEnter(e));
    EventHandler.on(element, 'dragover', (e) => this._handleDragOver(e));
    EventHandler.on(element, 'dragleave', (e) => this._handleDragLeave(e));
    EventHandler.on(element, 'drop', (e) => this._handleDrop(e, date));
  }

  _setStartDate(date) {
    this._pickedStartDate = date;
  }

  _highlightLongEventField(date) {
    if (!this._pickedStartDate) {
      return;
    }

    SelectorEngine.find('td', this._tBody).forEach((td) => {
      let startDate;
      let selectionDate;
      let tdDate;

      if (td.dataset.dateTime) {
        startDate = dayjs(
          dayjs(this._pickedStartDate).format(this.formats.dateTime),
          this.formats.dateTime
        );
        selectionDate = dayjs(dayjs(date).format(this.formats.dateTime), this.formats.dateTime);
        tdDate = dayjs(
          dayjs(td.dataset.dateTime).format(this.formats.dateTime),
          this.formats.dateTime
        );
      } else {
        startDate = dayjs(this._pickedStartDate, this.formats.date);
        selectionDate = dayjs(date, this.formats.date);
        tdDate = dayjs(td.dataset.date, this.formats.date);
      }

      if (
        (tdDate.isBefore(selectionDate, 'minute') && tdDate.isAfter(startDate, 'minute')) ||
        (tdDate.isAfter(selectionDate, 'minute') && tdDate.isBefore(startDate, 'minute'))
      ) {
        Manipulator.addClass(td, CLASSNAME_ACTIVE);
      } else {
        Manipulator.removeClass(td, CLASSNAME_ACTIVE);
      }
    });
  }

  _clearHighlight() {
    SelectorEngine.find(SELECTOR_ACTIVE_CELL, this._tBody).forEach((td) => {
      Manipulator.removeClass(td, CLASSNAME_ACTIVE);
    });
  }

  _toggleNewEventModal() {
    const date = dayjs().format(this.formats.date);
    this._pickedStartDate = date;
    const fakeEvent = {
      which: 1,
    };
    this._toggleAddEventModal(fakeEvent, date);
  }

  _toggleAddEventModal(e, date) {
    if (e.which === 3) {
      return;
    }
    this._newEvent = {};

    const start = {};
    const end = {};

    start.date = dayjs
      .min([dayjs(this._pickedStartDate, this.formats.date), dayjs(date, this.formats.date)])
      .startOf('day');
    end.date = dayjs
      .max([dayjs(this._pickedStartDate, this.formats.date), dayjs(date, this.formats.date)])
      .startOf('day');

    if (
      dayjs(this._pickedStartDate, this.formats.dateTime).isValid() &&
      dayjs(date, this.formats.dateTime).isValid()
    ) {
      start.dateTime = dayjs.min([
        dayjs(this._pickedStartDate, this.formats.dateTime),
        dayjs(date, this.formats.dateTime),
      ]);
      end.dateTime = dayjs.max([
        dayjs(this._pickedStartDate, this.formats.dateTime).add(1, 'hour'),
        dayjs(date, this.formats.dateTime).add(1, 'hour'),
      ]);
    } else {
      start.dateTime = dayjs.min([
        dayjs(this._pickedStartDate, this.formats.date),
        dayjs(date, this.formats.date),
      ]);
      end.dateTime = dayjs.max([
        dayjs(this._pickedStartDate, this.formats.date),
        dayjs(date, this.formats.date),
      ]);
    }

    this._setNewEvent(start, end);
    this._updateAddEventModalContent();
    if (!this._addEventModalInstance) {
      this._addEventModalInstance = new mdb.Modal(this._addEventModal);
    }
    this._addEventModalInstance.show();
    this._initInputs();
    this._initPickers();
    this._initColorDropdowns(this._newEvent);
    this._addInputsListeners();
    this._clearSelection();

    // wait for modal animation end
    setTimeout(() => {
      const summaryInput = SelectorEngine.findOne(
        SELECTOR_CALENDAR_SUMMARY_INPUT,
        this._addEventModal
      );
      this._updateInputs();
      summaryInput.focus();
    }, 500);
  }

  _setNewEvent(start, end) {
    this._newEvent = {
      summary: '',
      description: '',
      start: {
        date: start.date,
        dateTime: start.dateTime,
      },
      end: {
        date: end.date,
        dateTime: end.dateTime,
      },
      color: {
        background: '#cfe0fc',
        foreground: '#0a47a9',
      },
    };
  }

  _clearSelection() {
    if (window.getSelection) {
      if (window.getSelection().empty) {
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {
        window.getSelection().removeAllRanges();
      }
    } else if (document.selection) {
      document.selection.empty();
    }

    this._pickedStartDate = null;
    this._clearHighlight();
  }

  // prettier-ignore
  _initInputs() {
    this._inputInstances = SelectorEngine.find(
      '.form-outline',
      this._addEventModal
    ).map((formOutline) => {
      const instance = new mdb.Input(formOutline);
      return instance;
    });
    this._inputInstances.push(...SelectorEngine.find(
      '.form-outline',
      this._editEventModal
    ).map((formOutline) => {
      const instance = new mdb.Input(formOutline);
      return instance;
    }));
  }

  _initColorDropdowns(event) {
    /* eslint-disable no-new */
    const dropdownElementList = [].slice.call(document.querySelectorAll('.color-dropdown-toggle'));
    this._colorDropdownInstances = dropdownElementList.map((dropdownToggleEl) => {
      if (event) {
        this._setDefaultDrodpownColor(dropdownToggleEl, event.color.background);
      }
      return new mdb.Dropdown(dropdownToggleEl);
    });
  }

  _setDefaultDrodpownColor(toggler, color) {
    toggler.innerHTML = `<i class="fas fa-circle" style="color: ${color}"></i>`;
  }

  _updateInputs() {
    // this._inputInstances.forEach((instance) => instance.update());
  }

  _initPickers() {
    /* eslint-disable no-new */
    SelectorEngine.find('.datepicker', this._addEventModal).forEach((formOutline) => {
      new mdb.Datepicker(formOutline, this._options.datepickerOptions);
    });
    SelectorEngine.find('.datepicker', this._editEventModal).forEach((formOutline) => {
      new mdb.Datepicker(formOutline, this._options.datepickerOptions);
    });
    SelectorEngine.find('.timepicker', this._addEventModal).forEach((formOutline) => {
      const input = SelectorEngine.findOne('input', formOutline);
      const value = input.value;
      new mdb.Timepicker(formOutline, {
        defaultTime: value,
        format24: !this.options.twelveHour,
        ...this._options.timepickerOptions,
      });
    });
    SelectorEngine.find('.timepicker', this._editEventModal).forEach((formOutline) => {
      const input = SelectorEngine.findOne('input', formOutline);
      const value = input.value;
      new mdb.Timepicker(formOutline, {
        defaultTime: value,
        format24: !this.options.twelveHour,
        ...this._options.timepickerOptions,
      });
    });
  }

  _addInputsListeners() {
    SelectorEngine.find('input', this._addEventModal).forEach((input) => {
      EventHandler.on(input, 'input', (e) => this._newEventUpdateData(e));
    });
    SelectorEngine.find('input', this._editEventModal).forEach((input) => {
      EventHandler.on(input, 'input', (e) => this._editActiveEventData(e));
    });
    SelectorEngine.find('textarea', this._addEventModal).forEach((textarea) => {
      EventHandler.on(textarea, 'input', (e) => this._newEventUpdateData(e));
    });
    SelectorEngine.find('textarea', this._editEventModal).forEach((textarea) => {
      EventHandler.on(textarea, 'input', (e) => this._editActiveEventData(e));
    });
    SelectorEngine.find('.datepicker', this._addEventModal).forEach((picker) => {
      const fakeEvent = {};
      const pickerToggler = SelectorEngine.findOne('.datepicker-toggle-button', picker);
      fakeEvent.target = SelectorEngine.findOne('input', picker);
      EventHandler.on(picker, DATEPICKER_VALUE_CHANGED_EVENT, () => {
        this._newEventUpdateData(fakeEvent);
      });
      EventHandler.on(pickerToggler, 'click', (e) => e.preventDefault());
    });
    SelectorEngine.find('.timepicker', this._addEventModal).forEach((picker) => {
      const fakeEvent = {};
      fakeEvent.target = SelectorEngine.findOne('input', picker);
      EventHandler.on(picker, TIMEPICKER_VALUE_CHANGED_EVENT, () => {
        this._newEventUpdateData(fakeEvent);
      });
    });
    SelectorEngine.find('.datepicker', this._editEventModal).forEach((picker) => {
      const fakeEvent = {};
      const pickerToggler = SelectorEngine.findOne('.datepicker-toggle-button', picker);
      fakeEvent.target = SelectorEngine.findOne('input', picker);
      EventHandler.on(picker, DATEPICKER_VALUE_CHANGED_EVENT, () => {
        this._editActiveEventData(fakeEvent);
      });
      EventHandler.on(pickerToggler, 'click', (e) => e.preventDefault());
    });
    SelectorEngine.find('.timepicker', this._editEventModal).forEach((picker) => {
      const fakeEvent = {};
      fakeEvent.target = SelectorEngine.findOne('input', picker);
      EventHandler.on(picker, TIMEPICKER_VALUE_CHANGED_EVENT, () => {
        this._editActiveEventData(fakeEvent);
      });
    });
    SelectorEngine.find('.color-dropdown .dropdown-item', this._editEventModal).forEach(
      (dropdownItem) => {
        EventHandler.on(dropdownItem, 'click', (e) => this._editExistingEventColor(e));
      }
    );
    SelectorEngine.find('.color-dropdown .dropdown-item', this._addEventModal).forEach(
      (dropdownItem) => {
        EventHandler.on(dropdownItem, 'click', (e) => this._editNewEventColor(e));
      }
    );
  }

  _editExistingEventColor(e) {
    e.preventDefault();
    this._editActiveEventData(e);
    this._setDropdownActiveColor(e);
  }

  _editNewEventColor(e) {
    e.preventDefault();
    this._newEventUpdateData(e);
    this._setDropdownActiveColor(e);
  }

  _setDropdownActiveColor(e) {
    const toggler = SelectorEngine.findOne(
      '.dropdown-toggle',
      SelectorEngine.closest(e.target, '.dropdown')
    );

    toggler.innerHTML = `<i class="fas fa-circle" style="color: ${e.target.dataset.background}"></i>`;
  }

  _newEventUpdateData(e) {
    switch (e.target.name) {
      case 'summary':
        this._newEvent.summary = e.target.value;
        break;
      case 'description':
        this._newEvent.description = e.target.value;
        break;
      case 'start.date':
        this._newEvent.start.date = dayjs(e.target.value, this.formats.date);
        this._newEvent.start.dateTime = dayjs(
          `${e.target.value} ${this._newEvent.start.dateTime.format(this.formats.date)}`,
          this.formats.date
        );
        break;
      case 'end.date':
        this._newEvent.end.date = dayjs(e.target.value, this.formats.date);
        this._newEvent.end.dateTime = dayjs(
          `${e.target.value} ${this._newEvent.end.dateTime.format(this.formats.date)}`,
          this.formats.date
        );
        break;
      case 'start.time':
        this._newEvent.start.dateTime = dayjs(
          `${this._newEvent.start.date.format(this.formats.date)} ${e.target.value}`,
          this.formats.dateTime
        );
        break;
      case 'end.time':
        this._newEvent.end.dateTime = dayjs(
          `${this._newEvent.end.date.format(this.formats.date)} ${e.target.value}`,
          this.formats.dateTime
        );
        break;
      case 'color':
        if (!this._newEvent.color) this._newEvent.color = {};
        this._newEvent.color.background = e.target.dataset.background;
        this._newEvent.color.foreground = e.target.dataset.foreground;
        break;
      default:
        return;
    }
    this._clearValidation();
  }

  _editActiveEventData(e) {
    switch (e.target.name) {
      case 'summary':
        this._activeEvent.summary = e.target.value;
        break;
      case 'description':
        this._activeEvent.description = e.target.value;
        break;
      case 'start.date':
        this._activeEvent.start.date = dayjs(e.target.value, this.formats.date);
        this._activeEvent.start.dateTime = dayjs(
          `${e.target.value} ${this._activeEvent.start.dateTime.format(this.formats.date)}`,
          this.formats.date
        );
        break;
      case 'end.date':
        this._activeEvent.end.date = dayjs(e.target.value, this.formats.date);
        this._activeEvent.end.dateTime = dayjs(
          `${e.target.value} ${this._activeEvent.end.dateTime.format(this.formats.date)}`,
          this.formats.date
        );
        break;
      case 'start.time':
        this._activeEvent.start.dateTime = dayjs(
          `${this._activeEvent.start.date.format(this.formats.date)} ${e.target.value}`,
          this.formats.dateTime
        );
        break;
      case 'end.time':
        this._activeEvent.end.dateTime = dayjs(
          `${this._activeEvent.end.date.format(this.formats.date)} ${e.target.value}`,
          this.formats.dateTime
        );
        break;
      case 'color':
        if (!this._activeEvent.color) this._activeEvent.color = {};
        this._activeEvent.color.background = e.target.dataset.background;
        this._activeEvent.color.foreground = e.target.dataset.foreground;
        break;
      default:
        return;
    }
    this._clearValidation();
  }

  _toggleInfoEventModal(e) {
    e.stopPropagation();
  }

  _toggleEditEventModal(e, event) {
    this._clearSelection();
    e.stopPropagation();
    if (e.which === 3 || event.readonly) {
      return;
    }

    this._setActiveEvent(event);
    this._updateEditEventModalContent();
    if (!this._editEventModalInstance) {
      this._editEventModalInstance = new mdb.Modal(this._editEventModal);
    }
    this._editEventModalInstance.show();
    this._initInputs();
    this._initPickers();
    this._initColorDropdowns(event);
    this._addInputsListeners();

    // wait for modal animation end
    setTimeout(() => {
      this._updateInputs();
    }, 500);
  }

  _preventModalToggling(e) {
    this._clearSelection();
    e.stopPropagation();
  }

  _setActiveEvent(event) {
    this._activeEvent = {
      ...event,
      start: {
        ...event.start,
      },
      end: {
        ...event.end,
      },
      color: {
        ...event.color,
      },
    };
  }

  _appendCurrentMonthDays() {
    const firstDayOfActiveMonth = this.activeMomentCopy.startOf('month').day();
    const currentMonthDays = this._getArrayFromNumber(this.activeMomentCopy.daysInMonth());

    const arrayOfCurrentMonthDays = [];

    if (this.options.mondayFirst) {
      if (firstDayOfActiveMonth === 0) {
        arrayOfCurrentMonthDays.push(currentMonthDays.slice(0, 1));
        arrayOfCurrentMonthDays.push(currentMonthDays.slice(1, 8 - firstDayOfActiveMonth));
      } else {
        arrayOfCurrentMonthDays.push(currentMonthDays.slice(0, 8 - firstDayOfActiveMonth));
      }

      for (let i = 7; i <= 35; i += 7) {
        arrayOfCurrentMonthDays.push(
          currentMonthDays.slice(8 - firstDayOfActiveMonth + i - 7, 8 - firstDayOfActiveMonth + i)
        );
      }
    } else {
      arrayOfCurrentMonthDays.push(currentMonthDays.slice(0, 7 - firstDayOfActiveMonth));
      for (let i = 7; i <= 35; i += 7) {
        arrayOfCurrentMonthDays.push(
          currentMonthDays.slice(7 - firstDayOfActiveMonth + i - 7, 7 - firstDayOfActiveMonth + i)
        );
      }
    }

    this._createCurrentMonthDayFields(arrayOfCurrentMonthDays);
  }

  _createCurrentMonthDayFields(arrayOfCurrentMonthDays) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < arrayOfCurrentMonthDays[i].length; j++) {
        const td = element('td');
        const eventsWrapper = element('div');
        const dayFieldWrapper = element('div');
        const dayField = element('div');

        Manipulator.addClass(eventsWrapper, CLASSNAME_EVENTS_WRAPPER);
        Manipulator.addClass(dayFieldWrapper, 'day-field-wrapper');
        Manipulator.addClass(dayField, CLASSNAME_DAY_FIELD);

        const currentDay = arrayOfCurrentMonthDays[i][j] + 1;
        dayField.innerHTML = currentDay;
        const date = `${this._pad(currentDay)}/${this._pad(
          this.activeMoment.month() + 1
        )}/${this.activeMoment.year()}`;
        td.dataset.date = date;

        if (dayjs(date, this.formats.date).isSame(dayjs(), 'day')) {
          Manipulator.addClass(td, 'today');
        }

        dayFieldWrapper.append(dayField);
        td.append(dayFieldWrapper);
        td.append(eventsWrapper);
        SelectorEngine.find('tr', this._tBody)[i].append(td);

        if (!this.options.readonly) {
          this._addDayFieldListeners(td, date);
        }
      }
    }
  }

  _sortEvents() {
    this._events.sort((a, b) => dayjs(a.start.dateTime).diff(b.start.dateTime));
  }

  _addEventsKeys() {
    this._events.forEach((event, key) => (event.key = key + 1));
  }

  _setEvents() {
    this._events.forEach((event, key) => {
      this._appendEvent(event, key);
    });

    if (this.view === 'list') {
      this._appendEmptyList();
    }
  }

  _appendEvent(event) {
    switch (this.view) {
      case 'month':
        this._appendMonthEvent(event);
        break;
      case 'week':
        this._appendWeekEvent(event);
        break;
      case 'list':
        this._appendListEvent(event);
        break;
      default:
        return;
    }
  }

  _appendMonthEvent(event) {
    SelectorEngine.find('td', this._tBody).forEach((td) => {
      const tdDate = dayjs(td.dataset.date, this.formats.date);
      const eventEl = element('div');

      if (dayjs(event.start.date).isSame(tdDate)) {
        this._appendEventFirstDay(eventEl, event, td);
      } else if (
        dayjs(event.start.dateTime).isBefore(tdDate) &&
        dayjs(event.end.dateTime).isSameOrAfter(tdDate)
      ) {
        this._appendEventContinuation(eventEl, event, td);
      }

      if (!dayjs(event.end.date).isAfter(tdDate)) {
        Manipulator.addClass(eventEl, 'event-end');
      }

      if (this.options.readonly || event.readonly) {
        Manipulator.addClass(eventEl, 'event-readonly');
      } else {
        eventEl.setAttribute('draggable', true);
        this._appendMonthListeners(eventEl, event);
      }

      if (event.readonly) {
        this._appendReadonlyEventListener(eventEl);
      }

      if (this.options.blur && dayjs().isAfter(tdDate, 'day')) {
        Manipulator.addClass(eventEl, 'event-blur');
      }

      this._initTooltip(eventEl, event);
    });
  }

  _initTooltip(eventEl, event) {
    if (this.options.tooltips) {
      new Tooltip(eventEl, event, this.formats);
    }
  }

  _appendEventFirstDay(eventEl, event, td) {
    event.order = SelectorEngine.find('.event', td).length;

    Manipulator.style(eventEl, { order: event.key });
    Manipulator.addClass(eventEl, 'event');
    Manipulator.addClass(eventEl, `event-${event.key}`);
    Manipulator.setDataAttribute(eventEl, 'event-key', event.key);
    Manipulator.setDataAttribute(eventEl, 'event-order', event.order);

    if (
      event.start.dateTime.isSame(event.end.dateTime, 'day') &&
      !event.start.dateTime.isSame(event.end.dateTime, 'time')
    ) {
      const circle = element('i');
      ['fas', 'fa-circle', 'pe-1', 'event-circle'].forEach((className) => {
        Manipulator.addClass(circle, className);
      });
      Manipulator.addClass(eventEl, 'event-short');
      Manipulator.style(circle, { color: event.color && event.color.background });
      eventEl.append(circle);
    } else {
      Manipulator.style(eventEl, {
        background: event.color && event.color.background,
        color: event.color && event.color.foreground,
      });
    }

    const tdDate = dayjs(td.dataset.date, this.formats.date);
    if (!dayjs(event.end.date).isAfter(tdDate)) {
      Manipulator.addClass(eventEl, 'event-end');
    }

    eventEl.append(event.summary);
    SelectorEngine.findOne(`.${CLASSNAME_EVENTS_WRAPPER}`, td).append(eventEl);
  }

  _appendEventContinuation(eventEl, event, td) {
    eventEl.innerHTML = '&nbsp;';
    Manipulator.style(eventEl, {
      order: event.key,
      background: event.color && event.color.background,
      color: event.color && event.color.foreground,
    });

    Manipulator.setDataAttribute(eventEl, 'event-key', event.key);
    Manipulator.setDataAttribute(eventEl, 'event-order', event.order);
    ['event', `event-${event.key}`, 'event-long'].forEach((className) => {
      Manipulator.addClass(eventEl, className);
    });

    SelectorEngine.findOne(`.${CLASSNAME_EVENTS_WRAPPER}`, td).append(eventEl);
  }

  _appendMonthListeners(eventEl, event) {
    EventHandler.on(eventEl, 'dragstart', (e) => this._handleDragStart(e, event));
    EventHandler.on(eventEl, 'dragend', (e) => this._handleDragEnd(e, event));
    EventHandler.on(eventEl, 'mouseup', (e) => this._toggleEditEventModal(e, event));
    EventHandler.on(eventEl, 'mouseenter', () => this._markEvent(event));
    EventHandler.on(eventEl, 'mouseleave', () => this._unmarkEvent(event));
  }

  _appendReadonlyEventListener(eventEl) {
    EventHandler.on(eventEl, 'mouseup', (e) => this._preventModalToggling(e));
  }

  _markEvent(event) {
    SelectorEngine.find(`.event-${event.key}`, this._tBody).forEach((event) => {
      Manipulator.addClass(event, CLASSNAME_ACTIVE);
    });
  }

  _unmarkEvent(event) {
    SelectorEngine.find(`.event-${event.key}`, this._tBody).forEach((event) => {
      Manipulator.removeClass(event, CLASSNAME_ACTIVE);
    });
  }

  _handleDragStart(e, event) {
    this._hideTooltip(e);
    this._clearSelection();
    const eventElements = SelectorEngine.find(`.event-${event.key}`, this._tBody);
    eventElements.forEach((eventEl) => {
      Manipulator.addClass(eventEl, 'dragging');
    });
    e.dataTransfer.setData('text/plain', event.key);
  }

  _handleDragEnd(e, event) {
    const eventElements = SelectorEngine.find(`.event-${event.key}`, this._tBody);
    eventElements.forEach((eventEl) => {
      Manipulator.removeClass(eventEl, 'dragging');
    });
  }

  _handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }

    return false;
  }

  _handleDragEnter(e) {
    Manipulator.addClass(e.target, 'dragenter');
  }

  _handleDragLeave(e) {
    Manipulator.removeClass(e.target, 'dragenter');
  }

  _handleDrop(e, date) {
    const eventKey = parseInt(e.dataTransfer.getData('text/plain'), 10);
    const event = this._events[eventKey - 1];
    const eventStartDate = dayjs(event.start.dateTime, this.formats.dateTime);
    const eventStartTime = dayjs(event.start.dateTime).format(this.formats.time);
    const eventEndDate = dayjs(event.end.dateTime, this.formats.dateTime);
    const eventDurationDays = eventEndDate.diff(eventStartDate, 'days');
    const eventDurationMinutes = eventEndDate.diff(eventStartDate, 'minutes');

    event.start = {
      date: dayjs(date, this.formats.date),
      dateTime: dayjs(`${date} ${eventStartTime}`, this.formats.dateTime),
    };

    event.end = {
      date: dayjs(date, this.formats.date).add(eventDurationDays, 'days'),
      dateTime: dayjs(`${date} ${eventStartTime}`, this.formats.dateTime).add(
        eventDurationMinutes,
        'minutes'
      ),
    };

    EventHandler.trigger(this._element, EDIT_EVENT, {
      event: this._parseEvent(event),
    });
    this.refresh();
  }

  _orderEvents() {
    SelectorEngine.find(`.${CLASSNAME_EVENTS_WRAPPER}`, this._tBody).forEach((eventsWrapper) => {
      const events = SelectorEngine.find('.event', eventsWrapper);
      for (let i = 0; i <= events.length; i++) {
        if (!events[i]) {
          return;
        }
        let isOrderCorrect =
          this._getAllPrevEl(events[i]).length < parseInt(events[i].dataset.mdbEventOrder, 10);

        while (isOrderCorrect) {
          const fakeEvent = element('div');
          fakeEvent.innerHTML = '&nbsp;';
          Manipulator.style(fakeEvent, { order: events[i].dataset.mdbEventOrder });
          Manipulator.addClass(fakeEvent, 'fake-event');
          eventsWrapper.insertBefore(fakeEvent, events[i]);

          SelectorEngine.find('div', eventsWrapper).forEach((event, key) => {
            if (event.dataset.mdbEventOrder < key) {
              SelectorEngine.find(`.event-${event.dataset.mdbEventKey}`, this._tBody).forEach(
                (event) => (event.dataset.mdbEventOrder = key)
              );
            }
          });

          isOrderCorrect =
            this._getAllPrevEl(events[i]).length < parseInt(events[i].dataset.mdbEventOrder, 10);
        }
      }
    });
  }

  _appendNextMonthDays() {
    const dayRows = SelectorEngine.find('tr', this._tBody);
    const numberOfEmptyFieldsInFifthRow = 7 - SelectorEngine.find('td', dayRows[4]).length;
    const numberOfEmptyFieldsInSixthRow = 7 - SelectorEngine.find('td', dayRows[5]).length;

    if (numberOfEmptyFieldsInFifthRow > 0) {
      this._appendEventsInRow(dayRows[4], numberOfEmptyFieldsInFifthRow);
    }

    if (numberOfEmptyFieldsInSixthRow > 0) {
      this._appendEventsInRow(
        dayRows[5],
        numberOfEmptyFieldsInSixthRow,
        numberOfEmptyFieldsInFifthRow
      );
    }
  }

  _appendEventsInRow(row, sixthRowEmptyFields, fifthRowEmptyFields = 0) {
    for (let i = 0; i < sixthRowEmptyFields; i++) {
      const eventsWrapper = element('div');
      const td = element('td');
      const dayFieldWrapper = element('div');
      const dayField = element('div');

      Manipulator.addClass(eventsWrapper, CLASSNAME_EVENTS_WRAPPER);
      Manipulator.addClass(td, 'disabled');
      Manipulator.addClass(dayFieldWrapper, 'day-field-wrapper');
      Manipulator.addClass(dayField, 'day-field');

      dayField.innerHTML = i + 1 + fifthRowEmptyFields;

      const date = `${this._pad(i + 1 + fifthRowEmptyFields)}/${this._pad(
        this.activeMomentCopy.startOf('month').add(1, 'month').month() + 1
      )}/${this.activeMomentCopy.startOf('month').add(1, 'month').year()}`;

      td.dataset.date = date;

      dayFieldWrapper.append(dayField);
      td.append(dayFieldWrapper);
      td.append(eventsWrapper);
      row.append(td);
      if (!this.options.readonly) {
        this._addDayFieldListeners(td, date);
      }
    }
  }

  _pad(num, size = 2) {
    num = num.toString();
    while (num.length < size) {
      num = `0${num}`;
    }
    return num;
  }

  _appendWeekEvent(event) {
    this._appendLongWeekEvent(event);
    this._appendDateTimeWeekEvent(event);
  }

  _appendLongWeekEvent(event) {
    SelectorEngine.find('tr.long-event-row td', this._tBody).forEach((td, key) => {
      const tdDate = this.options.mondayFirst
        ? this.activeMomentCopy.startOf('week').add(key, 'day').add(1, 'day')
        : this.activeMomentCopy.startOf('week').add(key, 'day');

      const eventEl = element('div');

      if (dayjs(event.start.date).isSame(tdDate)) {
        Manipulator.style(eventEl, {
          order: event.key,
        });

        event.order = SelectorEngine.find('.event', td).length;

        Manipulator.addClass(eventEl, 'event');
        Manipulator.addClass(eventEl, `event-${event.key}`);
        Manipulator.setDataAttribute(eventEl, 'event-key', event.key);
        Manipulator.setDataAttribute(eventEl, 'event-order', event.order);

        if (
          event.start.dateTime.isSame(event.end.dateTime, 'day') &&
          !event.start.dateTime.isSame(event.end.dateTime, 'time')
        ) {
          const circle = element('i');
          ['fas', 'fa-circle', 'pe-1', 'event-circle'].forEach((className) => {
            Manipulator.addClass(circle, className);
          });
          Manipulator.addClass(eventEl, 'event-short');
          Manipulator.style(circle, { color: event.color && event.color.background });
          eventEl.append(circle);
        } else {
          Manipulator.style(eventEl, {
            background: event.color && event.color.background,
            color: event.color && event.color.foreground,
          });
        }

        eventEl.append(event.summary);

        SelectorEngine.findOne(`.${CLASSNAME_EVENTS_WRAPPER}`, td).append(eventEl);

        if (this.options.readonly || event.readonly) {
          Manipulator.addClass(eventEl, 'event-readonly');
        } else {
          eventEl.setAttribute('draggable', true);
          this._appendMonthListeners(eventEl, event);
        }

        if (event.readonly) {
          this._appendReadonlyEventListener(eventEl);
        }

        if (this.options.blur && dayjs().isAfter(tdDate, 'day')) {
          Manipulator.addClass(eventEl, 'event-blur');
        }
      }

      if (
        dayjs(event.start.dateTime).isBefore(tdDate) &&
        dayjs(event.end.dateTime).isSameOrAfter(tdDate)
      ) {
        eventEl.innerHTML = '&nbsp;';
        Manipulator.style(eventEl, {
          order: event.key,
          background: event.color && event.color.background,
          color: event.color && event.color.foreground,
        });

        Manipulator.setDataAttribute(eventEl, 'event-key', event.key);
        Manipulator.setDataAttribute(eventEl, 'event-order', event.order);
        ['event', `event-${event.key}`, 'event-long'].forEach((className) => {
          Manipulator.addClass(eventEl, className);
        });

        SelectorEngine.findOne(`.${CLASSNAME_EVENTS_WRAPPER}`, td).append(eventEl);

        if (this.options.readonly || event.readonly) {
          Manipulator.addClass(eventEl, 'event-readonly');
        } else {
          eventEl.setAttribute('draggable', true);
          this._appendMonthListeners(eventEl, event);
        }

        if (event.readonly) {
          this._appendReadonlyEventListener(eventEl);
        }

        if (this.options.blur && dayjs().isAfter(tdDate, 'day')) {
          Manipulator.addClass(eventEl, 'event-blur');
        }
      }

      if (!dayjs(event.end.date).isAfter(tdDate)) {
        Manipulator.addClass(eventEl, 'event-end');
      }

      this._initTooltip(eventEl, event);
    });
  }

  _appendDateTimeWeekEvent(event) {
    if (
      event.start.dateTime.isSame(event.end.dateTime, 'day') &&
      !event.start.dateTime.isSame(event.end.dateTime, 'time')
    ) {
      SelectorEngine.find('tr:not(.long-event-row) td', this._tBody).forEach((td) => {
        const tdDate = dayjs(td.dataset.dateTime, this.formats.dateTime);
        if (
          dayjs(event.start.dateTime, this.formats.dateTime).minute(0).isSameOrBefore(tdDate) &&
          !dayjs(event.end.dateTime, this.formats.dateTime).isSameOrBefore(tdDate)
        ) {
          const eventEl = element('div');
          ['event', 'event-short', `event-${event.key}`].forEach((className) => {
            Manipulator.addClass(eventEl, className);
          });

          eventEl.innerHTML = `<i class="fas fa-circle event-circle pe-1" style="color: ${event.color.background}"></i>${event.summary}`;

          td.append(eventEl);

          if (this.options.readonly || event.readonly) {
            Manipulator.addClass(eventEl, 'event-readonly');
          } else {
            eventEl.setAttribute('draggable', true);
            this._appendMonthListeners(eventEl, event);
          }

          if (event.readonly) {
            this._appendReadonlyEventListener(eventEl);
          }

          if (this.options.blur && dayjs().isAfter(tdDate, 'day')) {
            Manipulator.addClass(eventEl, 'event-blur');
          }

          this._initTooltip(eventEl, event);
        }
      });
    }
  }

  _appendEmptyList() {
    if (!SelectorEngine.find('td', this._tBody).length) {
      const tr = element('tr');
      const th = element('th');

      th.innerHTML = this.options.noEventsCaption;
      tr.append(th);
      this._tBody.append(tr);
    }
  }

  _appendListEvent(event) {
    const weekStartDate = this.activeMomentCopy.startOf('week');
    const weekEndDate = this.activeMomentCopy.endOf('week');
    if (this.options.mondayFirst) {
      weekStartDate.add(1, 'day');
      weekEndDate.add(1, 'day');
    }

    if (
      dayjs(event.start.dateTime).isBefore(weekEndDate) &&
      (dayjs(event.end.dateTime).isAfter(weekStartDate) ||
        dayjs(event.end.dateTime).isSame(weekStartDate))
    ) {
      const headingTr = element('tr');
      const summaryTr = element('tr');
      const headingTh = element('th');
      const summaryTd = element('td');

      headingTh.innerHTML = eventTimePeriod(event, this.formats);
      const eventBg = event.color.background || '#cfe0fc';
      summaryTd.innerHTML = `<i class="pe-2 fas fa-circle" style="color: ${eventBg}"></i><strong>${event.summary}</strong>`;

      headingTr.append(headingTh);
      summaryTr.append(summaryTd);
      this._tBody.append(headingTr);
      this._tBody.append(summaryTr);

      if (event.description) {
        this._addListEventDescription(summaryTd, event.description);
      }

      if (this.options.readonly || event.readonly) {
        Manipulator.addClass(summaryTd, 'td-readonly');
      } else {
        EventHandler.on(summaryTd, 'mouseup', (e) => this._toggleEditEventModal(e, event));
      }

      if (event.readonly) {
        this._appendReadonlyEventListener(summaryTd);
      }

      if (this.options.blur && dayjs().isAfter(event.end.dateTime, 'day')) {
        Manipulator.addClass(summaryTd, 'td-blur');
      }
    }
  }

  _addListEventDescription(summaryTd, eventDescription) {
    const description = element('p');
    Manipulator.addClass(description, 'mb-0');
    description.innerHTML = `<small>${eventDescription}</small>`;
    summaryTd.append(description);
  }

  _appendLongEventSection() {
    const longEventsSection = element('tr');
    Manipulator.addClass(longEventsSection, CLASSNAME_ALL_DAY_ROW);
    const th = element('th');
    longEventsSection.append(th);

    for (let i = 0; i < 7; i++) {
      const td = element('td');
      const eventsWrapper = element('div');

      Manipulator.addClass(eventsWrapper, CLASSNAME_EVENTS_WRAPPER);
      td.append(eventsWrapper);
      longEventsSection.append(td);

      // prettier-ignore
      const date = this.options.mondayFirst
        ? this.activeMomentCopy.startOf('week').add(i + 1, 'day').format(this.formats.date)
        : this.activeMomentCopy.startOf('week').add(i, 'day').format(this.formats.date);
      td.dataset.date = date;

      if (dayjs(date, this.formats.date).isSame(dayjs(), 'day')) {
        Manipulator.addClass(td, 'today');
      }

      if (!this.options.readonly) {
        this._addDayFieldListeners(td, date);
      }
    }

    this._tBody.append(longEventsSection);
  }

  _appendHoursSection() {
    for (let i = 0; i < 23; i++) {
      const tr = element('tr');
      const th = element('th');
      Manipulator.addClass(th, 'hour-field');

      if (this.options.twelveHour) {
        if (i > 11) {
          th.innerHTML = `${i - 11}:00 pm`;
        } else if (i === 11) {
          th.innerHTML = `${i + 1}:00 pm`;
        } else {
          th.innerHTML = `${i + 1}:00 am`;
        }
      } else {
        th.innerHTML = `${i + 1}:00`;
      }
      tr.append(th);

      for (let j = 0; j < 7; j++) {
        const td = element('td');

        // prettier-ignore
        const date = this.options.mondayFirst
          ? this.activeMomentCopy.startOf('week').add(j + 1, 'day').add(i + 1, 'hour').format(this.formats.dateTime)
          : this.activeMomentCopy.startOf('week').add(j, 'day').add(i + 1, 'hour').format(this.formats.dateTime);

        td.dataset.dateTime = date;

        tr.append(td);

        if (!this.options.readonly) {
          this._addDayFieldListeners(td, date);
        }
      }

      this._tBody.append(tr);
    }
  }

  _setHeading() {
    this._heading.innerHTML = '';
    switch (this.view) {
      case 'month':
        this._heading.innerHTML = `${
          this.options.months[this.activeMomentCopy.month()]
        } ${this.activeMomentCopy.year()}`;
        break;
      case 'week':
      case 'list':
        this._setWeekAndListHeading();
        break;
      default:
        return;
    }
  }

  _setWeekAndListHeading() {
    const start = this.options.mondayFirst
      ? this.activeMomentCopy.startOf('week').add(1, 'day')
      : this.activeMomentCopy.startOf('week');

    const end = this.options.mondayFirst
      ? this.activeMomentCopy.endOf('week').add(1, 'day')
      : this.activeMomentCopy.endOf('week');

    const startMonth = this.options.monthsShort[start.month()];
    const endMonth = this.options.monthsShort[end.month()];

    if (start.month() === end.month()) {
      this._heading.innerHTML = `${this.options.months[start.month()]} ${start.year()}`;
    } else {
      this._heading.innerHTML = `${startMonth} - ${endMonth}, ${start.year()}`;
    }
  }

  _clearTBody() {
    this._tBody.innerHTML = '';
    this._table.className = '';
  }

  _addListeners() {
    EventHandler.on(this._arrowLeft, 'click', () => this.prev());
    EventHandler.on(this._arrowRight, 'click', () => this.next());
    EventHandler.on(this._todayBtn, 'click', () => this.today());
    if (this.options.addEventButton && !this.options.readonly) {
      EventHandler.on(this._newEventBtn, 'click', () => this._toggleNewEventModal());
    }
    EventHandler.on(this._table, 'mouseup', () => this._clearSelection());
    if (this.options.viewSelect) {
      EventHandler.on(this._viewSelect, SELECT_VALUE_CHANGED_EVENT, (event) =>
        this.changeView(event.value)
      );
    }
  }

  _removeListeners() {
    EventHandler.off(this._arrowLeft, 'click', this.prev);
    EventHandler.off(this._arrowRight, 'click', this.next);
    EventHandler.off(this._todayBtn, 'click', this.today);
    if (this.options.addEventButton && !this.options.readonly) {
      EventHandler.off(this._newEventBtn, 'click', this._toggleNewEventModal);
    }
    if (this.options.viewSelect) {
      EventHandler.off(this._viewSelect, SELECT_VALUE_CHANGED_EVENT, this.changeView);
    }
    EventHandler.off(this._table, 'mouseup', this._clearSelection);
  }

  _getArrayFromNumber(number) {
    return Array.from(Array(number).keys());
  }

  _getAllPrevEl(element) {
    const result = [];
    let child = element.previousElementSibling;

    while (child) {
      result.push(element);
      child = child.previousElementSibling;
    }
    return result;
  }

  _setLongEventCaptions() {
    if (this.view === 'list') return;
    SelectorEngine.find('tr', this._tBody).forEach((tr) => {
      const firstTd = SelectorEngine.findOne('td', tr);
      SelectorEngine.find('.event', firstTd).forEach((event) => {
        if (event.innerHTML === '&nbsp;') {
          event.innerHTML = this._events[parseInt(event.dataset.mdbEventKey, 10) - 1].summary;
          Manipulator.style(event, { paddingLeft: '7px' });
        }
      });
    });
  }

  _initTooltips() {
    this._tooltips = [...this._element.querySelectorAll('[data-mdb-toggle="tooltip"]')].map(
      (tooltip) => new mdb.Tooltip(tooltip)
    );
  }

  _initSelect() {
    if (this._viewSelect && this.options.viewSelect) {
      new mdb.Select(this._viewSelect);
    }
  }

  _hideTooltip(e) {
    if (this.options.tooltips) {
      mdb.Tooltip.getInstance(e.target).hide();
    }
  }

  _refreshTable() {
    this._setTBody();
    this._setHeading();
    this._setEvents();
    this._orderEvents();
    this._setLongEventCaptions();
    this._initTooltips();
  }

  // MODALS ---------------------------------------------
  _createAddEventModal() {
    this._addEventModal = element('div');
    Manipulator.addClass(this._addEventModal, 'modal');
    Manipulator.addClass(this._addEventModal, 'fade');
    this._addEventModal.setAttribute('tabindex', '-1');
    this._addEventModal.setAttribute('aria-hidden', 'true');

    document.body.appendChild(this._addEventModal);
  }

  _updateAddEventModalContent() {
    this._addEventModal.innerHTML = addModalTemplate(
      this.options,
      this._newEvent,
      this.formats,
      this._addModalId
    );

    const longEventsCheckbox = SelectorEngine.findOne(
      SELECTOR_CALENDAR_LONG_EVENTS_CHECKBOX,
      this._addEventModal
    );
    EventHandler.on(longEventsCheckbox, 'change', (e) => this._toggleLongEventMode(e));

    this._editAddModalIfLongEvent(this._newEvent, longEventsCheckbox);

    const form = SelectorEngine.findOne('form', this._addEventModal);
    EventHandler.on(form, 'submit', (e) => {
      this._addEvent(e);
    });
  }

  _toggleLongEventMode(e) {
    const isLongEventEnabled = e.target.checked;
    const longEventsSections = SelectorEngine.find('.long-event-section', this._addEventModal);
    const dateTimeSections = SelectorEngine.find('.date-time-section', this._addEventModal);

    if (isLongEventEnabled) {
      longEventsSections.forEach((section) => (section.style.display = 'block'));
      dateTimeSections.forEach((section) => (section.style.display = 'none'));
    } else {
      longEventsSections.forEach((section) => (section.style.display = 'none'));
      dateTimeSections.forEach((section) => (section.style.display = 'block'));
    }

    this._updateInputs();
  }

  _toggleLongEventModeInEditModal(e) {
    const isLongEventEnabled = e.target.checked;
    const longEventsSections = SelectorEngine.find('.long-event-section', this._editEventModal);
    const dateTimeSections = SelectorEngine.find('.date-time-section', this._editEventModal);

    if (isLongEventEnabled) {
      longEventsSections.forEach((section) => (section.style.display = 'block'));
      dateTimeSections.forEach((section) => {
        SelectorEngine.find('.timepicker-input', section).forEach((input) => {
          input.value = '00:00';
          this._activeEvent.start.dateTime = dayjs(this._activeEvent.start.dateTime).startOf('day');
          this._activeEvent.end.dateTime = dayjs(this._activeEvent.end.dateTime).startOf('day');
        });
        section.style.display = 'none';
      });
    } else {
      longEventsSections.forEach((section) => (section.style.display = 'none'));
      dateTimeSections.forEach((section) => (section.style.display = 'block'));
    }

    this._updateInputs();
  }

  _createEditEventModal() {
    this._editEventModal = element('div');
    Manipulator.addClass(this._editEventModal, 'modal');
    Manipulator.addClass(this._editEventModal, 'fade');
    this._editEventModal.setAttribute('tabindex', '-1');
    this._editEventModal.setAttribute('aria-hidden', 'true');

    document.body.appendChild(this._editEventModal);
  }

  _updateEditEventModalContent() {
    this._editEventModal.innerHTML = editModalTemplate(
      this.options,
      this._activeEvent,
      this.formats,
      this._editModalId
    );

    const longEventsCheckbox = SelectorEngine.findOne(
      SELECTOR_CALENDAR_LONG_EVENTS_CHECKBOX,
      this._editEventModal
    );
    EventHandler.on(longEventsCheckbox, 'change', (e) => this._toggleLongEventModeInEditModal(e));

    this._editModalIfLongEvent(this._activeEvent, longEventsCheckbox);

    const submitBtn = SelectorEngine.findOne('.btn-save-event', this._editEventModal);
    const deleteBtn = SelectorEngine.findOne('.btn-delete-event', this._editEventModal);
    EventHandler.on(submitBtn, 'click', () => {
      this._editEvent();
    });
    EventHandler.on(deleteBtn, 'click', () => {
      this._deleteEvent();
    });
  }

  _editAddModalIfLongEvent(event, checkbox) {
    if (eventType(event) === 'short-event' || eventType(event) === 'long-event-with-time') {
      checkbox.checked = false;
      const longEventsSections = SelectorEngine.find('.long-event-section', this._addEventModal);
      const dateTimeSections = SelectorEngine.find('.date-time-section', this._addEventModal);
      longEventsSections.forEach((section) => (section.style.display = 'none'));
      dateTimeSections.forEach((section) => (section.style.display = 'block'));
    }
  }

  _editModalIfLongEvent(event, checkbox) {
    if (eventType(event) === 'short-event' || eventType(event) === 'long-event-with-time') {
      checkbox.checked = false;
      const longEventsSections = SelectorEngine.find('.long-event-section', this._editEventModal);
      const dateTimeSections = SelectorEngine.find('.date-time-section', this._editEventModal);
      longEventsSections.forEach((section) => (section.style.display = 'none'));
      dateTimeSections.forEach((section) => (section.style.display = 'block'));
    }
  }

  _addEvent(e) {
    e.preventDefault();
    if (this._validateEvent(this._newEvent)) {
      const newEvent = this.options.newEventAttributes(this._newEvent);

      this._events.push({
        ...newEvent,
        summary: newEvent.summary,
        start: newEvent.start,
        end: newEvent.end,
        color: newEvent.color || {},
        description: newEvent.description || '',
      });

      EventHandler.trigger(this._element, ADD_EVENT, {
        event: this._parseEvent(newEvent),
      });
      this.refresh();
      this._addEventModalInstance.hide();
    } else {
      this._setInputsInvalid(this._newEvent);
    }
  }

  _validateEvent(event) {
    if (event.start.dateTime.isSameOrBefore(event.end.dateTime) && event.summary) {
      return true;
    }
    return false;
  }

  _setInputsInvalid(event) {
    if (event.end.dateTime.isBefore(event.start.dateTime)) {
      SelectorEngine.find('.calendar-date-input').forEach((input) => {
        Manipulator.addClass(input, 'calendar-invalid-input');
        Manipulator.addClass(input.parentNode.parentNode, 'was-validated');
      });
    }
    if (event.summary === '') {
      SelectorEngine.find('.calendar-summary-input').forEach((input) => {
        Manipulator.addClass(input, 'calendar-invalid-input');
        Manipulator.addClass(input.parentNode.parentNode, 'was-validated');
      });
    }
  }

  _clearValidation() {
    SelectorEngine.find('.calendar-date-input').forEach((input) => {
      Manipulator.removeClass(input, 'calendar-invalid-input');
      Manipulator.removeClass(input.parentNode.parentNode, 'was-validated');
    });
    SelectorEngine.find('.calendar-summary-input').forEach((input) => {
      Manipulator.removeClass(input, 'calendar-invalid-input');
      Manipulator.removeClass(input.parentNode.parentNode, 'was-validated');
    });
  }

  _editEvent() {
    if (this._validateEvent(this._activeEvent)) {
      this._events[this.activeEventIndex].summary = this._activeEvent.summary;
      this._events[this.activeEventIndex].start.date = this._activeEvent.start.date;
      this._events[this.activeEventIndex].start.dateTime = this._activeEvent.start.dateTime;
      this._events[this.activeEventIndex].end.date = this._activeEvent.end.date;
      this._events[this.activeEventIndex].end.dateTime = this._activeEvent.end.dateTime;
      this._events[this.activeEventIndex].description = this._activeEvent.description;
      this._events[this.activeEventIndex].color.background =
        this._activeEvent.color && this._activeEvent.color.background;
      this._events[this.activeEventIndex].color.foreground = this._activeEvent.color.foreground;

      EventHandler.trigger(this._element, EDIT_EVENT, {
        event: this._parseEvent(this._activeEvent),
      });
      this.refresh();
      this._editEventModalInstance.hide();
    } else {
      this._setInputsInvalid(this._activeEvent);
    }
  }

  _deleteEvent() {
    EventHandler.trigger(this._element, DELETE_EVENT, {
      event: this._parseEvent(this._events[this.activeEventIndex]),
    });
    this._events.splice(this.activeEventIndex, 1);
    this.refresh();
    this._editEventModalInstance.hide();
  }

  _clearEvents() {
    SelectorEngine.find('.event', this._element).forEach((event) => {
      event.remove();
    });
  }

  _triggerEvent(event) {
    EventHandler.trigger(this._element, `${event}.mdb.calendar`);
  }

  _disposeModals() {
    if (this._addEventModalInstance) {
      this._addEventModalInstance.dispose();
    }
    if (this._addEventModal) {
      this._addEventModal.remove();
    }
    if (this._editEventModalInstance) {
      this._editEventModalInstance.dispose();
    }
    if (this._editEventModal) {
      this._editEventModal.remove();
    }
  }

  // Static
  static get NAME() {
    return NAME;
  }

  static get dayjs() {
    return dayjs;
  }

  static getInstance(element) {
    return Data.getData(element, DATA_KEY);
  }

  static jQueryInterface(config, options) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;
      if (!data && /dispose/.test(config)) {
        return;
      }
      if (!data) {
        data = new Calendar(this, _config);
      }
      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config](options);
      }
    });
  }
}

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = Calendar.jQueryInterface;
    $.fn[NAME].Constructor = Calendar;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Calendar.jQueryInterface;
    };
  }
});

SelectorEngine.find(SELECTOR_DATA_INIT).forEach((el) => new Calendar(el));

export default Calendar;
