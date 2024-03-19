import { createPopper } from '@popperjs/core';
import Data from '../../mdb/dom/data';
import EventHandler from '../../mdb/dom/event-handler';
import Manipulator from '../../mdb/dom/manipulator';
import SelectorEngine from '../../mdb/dom/selector-engine';
import ScrollBarHelper from '../../bootstrap/mdb-prefix/util/scrollbar';
import { typeCheckConfig, getUID, isRTL } from '../../mdb/util/index';
import FocusTrap from '../../mdb/util/focusTrap';
import {
  getDate,
  getDayNumber,
  getMonth,
  getYear,
  getDaysInMonth,
  addYears,
  addMonths,
  addDays,
  createDate,
  convertStringToDate,
  isSameDate,
  areDatesInSameView,
  isDateDisabled,
  isMonthDisabled,
  isYearDisabled,
  isNextDateDisabled,
  isPreviousDateDisabled,
  getYearsOffset,
  isValidDate,
} from './date-utils';
import {
  getBackdropTemplate,
  getDatepickerTemplate,
  createDayViewTemplate,
  createMonthViewTemplate,
  createYearViewTemplate,
  getToggleButtonTemplate,
  createCustomHeader,
} from './templates';
import {
  ENTER,
  SPACE,
  ESCAPE,
  LEFT_ARROW,
  RIGHT_ARROW,
  DOWN_ARROW,
  UP_ARROW,
  HOME,
  END,
  PAGE_UP,
  PAGE_DOWN,
} from '../../mdb/util/keycodes';
import BaseComponent from '../../free/base-component';
import { bindCallbackEventsIfNeeded } from '../../autoinit/init';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const YEARS_IN_VIEW = 24;
const YEARS_IN_ROW = 4;
const MONTHS_IN_ROW = 4;

const NAME = 'datepicker';
const DATA_KEY = `mdb.${NAME}`;
const DATA_API_KEY = '.data-api';

const EVENT_KEY = `.${DATA_KEY}`;
const EVENT_CLOSE = `close${EVENT_KEY}`;
const EVENT_OPEN = `open${EVENT_KEY}`;
const EVENT_VALUE_CHANGED = `valueChanged${EVENT_KEY}`;
const EVENT_VIEW_CHANGED = `viewChanged${EVENT_KEY}`;
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`;

const BACKDROP_OPEN_ANIMATION_CLASS = 'fade-in';
const BACKDROP_CLOSE_ANIMATION_CLASS = 'fade-out';
const CONTAINER_OPEN_ANIMATION_CLASS = 'fade-in';
const CONTAINER_CLOSE_ANIMATION_CLASS = 'fade-out';

const CLASS_FORM_ICON_TRAILING = 'form-icon-trailing';

const SELECTOR_DATA_TOGGLE = '[data-mdb-toggle="datepicker"]';
const SELECTOR_MODAL_CONTAINER = '.datepicker-modal-container';
const SELECTOR_DROPDOWN_CONTAINER = '.datepicker-dropdown-container';
const SELECTOR_VIEW_CHANGE_BUTTON = '.datepicker-view-change-button';
const SELECTOR_PREVIOUS_BUTTON = '.datepicker-previous-button';
const SELECTOR_NEXT_BUTTON = '.datepicker-next-button';
const SELECTOR_OK_BUTTON = '.datepicker-ok-btn';
const SELECTOR_CANCEL_BUTTON = '.datepicker-cancel-btn';
const SELECTOR_CLEAR_BUTTON = '.datepicker-clear-btn';
const SELECTOR_DATES_CONTAINER = '.datepicker-view';

const Default = {
  title: 'Select date',
  container: 'body',
  disablePast: false,
  disableFuture: false,
  monthsFull: [
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
  weekdaysFull: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  weekdaysNarrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  okBtnText: 'Ok',
  clearBtnText: 'Clear',
  cancelBtnText: 'Cancel',

  okBtnLabel: 'Confirm selection',
  clearBtnLabel: 'Clear selection',
  cancelBtnLabel: 'Cancel selection',
  nextMonthLabel: 'Next month',
  prevMonthLabel: 'Previous month',
  nextYearLabel: 'Next year',
  prevYearLabel: 'Previous year',
  nextMultiYearLabel: 'Next 24 years',
  prevMultiYearLabel: 'Previous 24 years',
  switchToMultiYearViewLabel: 'Switch to year list',
  switchToDayViewLabel: 'Switch to day list',

  startDate: null,
  startDay: 0,
  format: 'dd/mm/yyyy',
  view: 'days',

  min: null,
  max: null,
  filter: null,

  inline: false,
  toggleButton: true,
  disableToggleButton: false,
  disableInput: false,
  animations: true,
  confirmDateOnSelect: false,
  removeOkBtn: false,
  removeCancelBtn: false,
  removeClearBtn: false,
  headerTemplate: null,
  headerTemplateModifier: null,
};

const DefaultType = {
  title: 'string',
  container: 'string',
  disablePast: 'boolean',
  disableFuture: 'boolean',
  monthsFull: 'array',
  monthsShort: 'array',
  weekdaysFull: 'array',
  weekdaysShort: 'array',
  weekdaysNarrow: 'array',

  okBtnText: 'string',
  clearBtnText: 'string',
  cancelBtnText: 'string',
  okBtnLabel: 'string',
  clearBtnLabel: 'string',
  cancelBtnLabel: 'string',
  nextMonthLabel: 'string',
  prevMonthLabel: 'string',
  nextYearLabel: 'string',
  prevYearLabel: 'string',
  nextMultiYearLabel: 'string',
  prevMultiYearLabel: 'string',
  switchToMultiYearViewLabel: 'string',
  switchToDayViewLabel: 'string',

  startDate: '(null|string|date)',
  startDay: 'number',
  format: 'string',
  view: 'string',

  min: '(null|date|string)',
  max: '(null|date|string)',
  filter: '(null|function)',

  inline: 'boolean',
  toggleButton: 'boolean',
  disableToggleButton: 'boolean',
  disableInput: 'boolean',
  animations: 'boolean',
  confirmDateOnSelect: 'boolean',
  removeOkBtn: 'boolean',
  removeCancelBtn: 'boolean',
  removeClearBtn: 'boolean',

  headerTemplate: '(null|string)',
  headerTemplateModifier: '(null|function)',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Datepicker extends BaseComponent {
  constructor(element, options) {
    super(element);

    this._input = SelectorEngine.findOne('input', this._element);
    this._options = this._getConfig(options);
    this._activeDate = new Date();
    this._selectedDate = null;
    this._selectedYear = null;
    this._selectedMonth = null;
    this._headerDate = null;
    this._headerYear = null;
    this._headerMonth = null;
    this._view = this._options.view;
    this._popper = null;
    this._focusTrap = null;
    this._isOpen = false;
    this._toggleButtonId = this._element.id
      ? `datepicker-toggle-${this._element.id}`
      : getUID('datepicker-toggle-');
    this._animations =
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches && this._options.animations;

    this._scrollBar = new ScrollBarHelper();

    this._init();

    if (this.toggleButton && this._options.disableToggle) {
      this.toggleButton.disabled = 'true';
    }

    if (this._options.disableInput) {
      this._input.disabled = 'true';
    }

    Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
    bindCallbackEventsIfNeeded(this.constructor);
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  get container() {
    return (
      SelectorEngine.findOne(`${SELECTOR_MODAL_CONTAINER}-${this._toggleButtonId}`) ||
      SelectorEngine.findOne(`${SELECTOR_DROPDOWN_CONTAINER}-${this._toggleButtonId}`)
    );
  }

  get options() {
    return this._options;
  }

  get activeCell() {
    let activeCell;

    if (this._view === 'days') {
      activeCell = this._getActiveDayCell();
    }

    if (this._view === 'months') {
      activeCell = this._getActiveMonthCell();
    }

    if (this._view === 'years') {
      activeCell = this._getActiveYearCell();
    }

    return activeCell;
  }

  get activeDay() {
    return getDate(this._activeDate);
  }

  get activeMonth() {
    return getMonth(this._activeDate);
  }

  get activeYear() {
    return getYear(this._activeDate);
  }

  get firstYearInView() {
    return this.activeYear - getYearsOffset(this._activeDate, YEARS_IN_VIEW);
  }

  get lastYearInView() {
    return this.firstYearInView + YEARS_IN_VIEW - 1;
  }

  get viewChangeButton() {
    return SelectorEngine.findOne(SELECTOR_VIEW_CHANGE_BUTTON, this.container);
  }

  get previousButton() {
    return SelectorEngine.findOne(SELECTOR_PREVIOUS_BUTTON, this.container);
  }

  get nextButton() {
    return SelectorEngine.findOne(SELECTOR_NEXT_BUTTON, this.container);
  }

  get okButton() {
    return SelectorEngine.findOne(SELECTOR_OK_BUTTON, this.container);
  }

  get cancelButton() {
    return SelectorEngine.findOne(SELECTOR_CANCEL_BUTTON, this.container);
  }

  get clearButton() {
    return SelectorEngine.findOne(SELECTOR_CLEAR_BUTTON, this.container);
  }

  get datesContainer() {
    return SelectorEngine.findOne(SELECTOR_DATES_CONTAINER, this.container);
  }

  get toggleButton() {
    return SelectorEngine.findOne('.datepicker-toggle-button', this._element);
  }

  update(options = {}) {
    this._options = this._getConfig({ ...this._options, ...options });
  }

  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._element);

    config = {
      ...Default,
      ...dataAttributes,
      ...config,
    };

    typeCheckConfig(NAME, config, DefaultType);

    if (config.max && typeof config.max === 'string') {
      config.max = new Date(config.max);
    }

    if (config.min && typeof config.min === 'string') {
      config.min = new Date(config.min);
    }

    if (config.startDay && config.startDay !== 0) {
      const sortedWeekdaysNarrow = this._getNewDaysOrderArray(config);
      config.weekdaysNarrow = sortedWeekdaysNarrow;
    }

    return config;
  }

  _getContainer() {
    return SelectorEngine.findOne(this._options.container);
  }

  _getNewDaysOrderArray(config) {
    const index = config.startDay;

    const weekdaysNarrow = config.weekdaysNarrow;
    const sortedWeekdays = weekdaysNarrow.slice(index).concat(weekdaysNarrow.slice(0, index));

    return sortedWeekdays;
  }

  _init() {
    if (!this.toggleButton && this._options.toggleButton) {
      this._appendToggleButton();
      if (this._input.readOnly || this._input.disabled) {
        this.toggleButton.style.pointerEvents = 'none';
      }
    }

    this._listenToUserInput();
    this._listenToToggleClick();
    this._listenToToggleKeydown();
  }

  _appendToggleButton() {
    const toggleButton = getToggleButtonTemplate(this._toggleButtonId);
    this._element.insertAdjacentHTML('beforeend', toggleButton);
    Manipulator.addClass(this._input, CLASS_FORM_ICON_TRAILING);
  }

  open() {
    if (this._input.readOnly || this._input.disabled) {
      return;
    }
    const openEvent = EventHandler.trigger(this._element, EVENT_OPEN);

    if (this._isOpen || openEvent.defaultPrevented) {
      return;
    }

    this._setInitialDate();

    const backdrop = getBackdropTemplate();
    const template = getDatepickerTemplate(
      this._activeDate,
      this._selectedDate,
      this._selectedYear,
      this._selectedMonth,
      this._options,
      MONTHS_IN_ROW,
      YEARS_IN_VIEW,
      YEARS_IN_ROW,
      this._toggleButtonId
    );

    if (this._options.inline) {
      this._openDropdown(template);
    } else {
      this._openModal(backdrop, template);
      this._scrollBar.hide();
    }

    if (this._animations) {
      Manipulator.addClass(this.container, 'animation');
      Manipulator.addClass(this.container, CONTAINER_OPEN_ANIMATION_CLASS);
      this.container.style.animationDuration = '300ms';

      Manipulator.addClass(backdrop, 'animation');
      Manipulator.addClass(backdrop, BACKDROP_OPEN_ANIMATION_CLASS);
      backdrop.style.animationDuration = '150ms';
    }

    this._setFocusTrap(this.container);

    this._listenToDateSelection();
    this._addControlsListeners();
    this._updateControlsDisabledState();
    this._listenToEscapeClick();
    this._listenToKeyboardNavigation();
    this._listenToDatesContainerFocus();
    this._listenToDatesContainerBlur();

    // We need to wait for popper initialization to avoid bug with
    // focusing dates container, otherwise dates container will be
    // focused before popper position update which can change the
    // scroll position on the page
    this._asyncFocusDatesContainer();
    this._updateViewControlsAndAttributes(this._view);
    this._isOpen = true;

    // Wait for the component to open to prevent immediate calling of the
    // close method upon detecting a click on toggle element (input/button)
    setTimeout(() => {
      this._listenToOutsideClick();
    }, 0);
  }

  _openDropdown(template) {
    this._popper = createPopper(this._input, template, {
      placement: 'bottom-start',
    });
    const container = this._getContainer();
    container.appendChild(template);
  }

  _openModal(backdrop, template) {
    const container = this._getContainer();
    container.appendChild(backdrop);
    container.appendChild(template);
  }

  _setFocusTrap(element) {
    this._focusTrap = new FocusTrap(element, {
      event: 'keydown',
      condition: (event) => event.key === 'Tab',
    });
    this._focusTrap.trap();
  }

  _listenToUserInput() {
    EventHandler.on(this._input, 'input', (event) => {
      this._handleUserInput(event.target.value);
    });
  }

  _listenToToggleClick() {
    EventHandler.on(this._element, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, (event) => {
      event.preventDefault();
      this.open();
    });
  }

  _listenToToggleKeydown() {
    EventHandler.on(this._element, 'keydown', SELECTOR_DATA_TOGGLE, (event) => {
      if (event.keyCode === ENTER && !this._isOpen) {
        this.open();
      }
    });
  }

  _listenToDateSelection() {
    EventHandler.on(this.datesContainer, 'click', (e) => {
      this._handleDateSelection(e);
    });
  }

  _handleDateSelection(e) {
    const dataset = e.target.nodeName === 'DIV' ? e.target.parentNode.dataset : e.target.dataset;
    const cell = e.target.nodeName === 'DIV' ? e.target.parentNode : e.target;

    if (dataset.mdbDate) {
      this._pickDay(dataset.mdbDate, cell);
    }

    if (dataset.mdbMonth && dataset.mdbYear) {
      const month = parseInt(dataset.mdbMonth, 10);
      const year = parseInt(dataset.mdbYear, 10);
      this._pickMonth(month, year);
    }

    if (dataset.mdbYear && !dataset.mdbMonth) {
      const year = parseInt(dataset.mdbYear, 10);
      this._pickYear(year);
    }

    if (!this._options.inline) {
      this._updateHeaderDate(
        this._activeDate,
        this._options.monthsShort,
        this._options.weekdaysShort
      );
    }
  }

  _updateHeaderDate(date, monthNames, dayNames) {
    const headerDateEl = SelectorEngine.findOne('.datepicker-date-text', this.container);
    const month = getMonth(date);
    const day = getDate(date);
    const dayNumber = getDayNumber(date);

    const datepickerHeaderContainer = SelectorEngine.findOne('.datepicker-header', this.container);

    if (this._options.headerTemplate && datepickerHeaderContainer) {
      datepickerHeaderContainer.innerHTML = createCustomHeader(
        day,
        dayNumber,
        month,
        date,
        this._options
      );
      return;
    }
    headerDateEl.innerHTML = `${dayNames[dayNumber]}, ${monthNames[month]} ${day}`;
  }

  _addControlsListeners() {
    EventHandler.on(this.nextButton, 'click', () => {
      if (this._view === 'days') {
        this.nextMonth();
      } else if (this._view === 'years') {
        this.nextYears();
      } else {
        this.nextYear();
      }
      this._updateControlsDisabledState();
    });

    EventHandler.on(this.previousButton, 'click', () => {
      if (this._view === 'days') {
        this.previousMonth();
      } else if (this._view === 'years') {
        this.previousYears();
      } else {
        this.previousYear();
      }
      this._updateControlsDisabledState();
    });

    EventHandler.on(this.viewChangeButton, 'click', () => {
      if (this._view === 'days') {
        this._changeView('years');
      } else if (this._view === 'years' || this._view === 'months') {
        this._changeView('days');
      }
    });

    if (!this._options.inline) {
      this._listenToFooterButtonsClick();
    }
  }

  _listenToFooterButtonsClick() {
    EventHandler.on(this.okButton, 'click', () => this.handleOk());
    EventHandler.on(this.cancelButton, 'click', () => this.handleCancel());
    EventHandler.on(this.clearButton, 'click', () => this.handleClear());
  }

  _listenToOutsideClick() {
    EventHandler.on(document, EVENT_CLICK_DATA_API, (e) => {
      const isContainer = e.target === this.container;
      const isContainerContent = this.container && this.container.contains(e.target);

      if (!isContainer && !isContainerContent) {
        this.close();
      }
    });
  }

  _listenToEscapeClick() {
    EventHandler.on(document, 'keydown', (event) => {
      if (event.keyCode === ESCAPE && this._isOpen) {
        this.close();
      }
    });
  }

  _listenToKeyboardNavigation() {
    EventHandler.on(this.datesContainer, 'keydown', (event) => {
      this._handleKeydown(event);
    });
  }

  _listenToDatesContainerFocus() {
    EventHandler.on(this.datesContainer, 'focus', () => {
      this._focusActiveCell(this.activeCell);
    });
  }

  _listenToDatesContainerBlur() {
    EventHandler.on(this.datesContainer, 'blur', () => {
      this._removeCurrentFocusStyles();
    });
  }

  _handleKeydown(event) {
    if (this._view === 'days') {
      this._handleDaysViewKeydown(event);
    }

    if (this._view === 'months') {
      this._handleMonthsViewKeydown(event);
    }

    if (this._view === 'years') {
      this._handleYearsViewKeydown(event);
    }
  }

  _handleDaysViewKeydown(event) {
    const oldActiveDate = this._activeDate;
    const previousActiveCell = this.activeCell;

    switch (event.keyCode) {
      case LEFT_ARROW:
        this._activeDate = addDays(this._activeDate, isRTL ? 1 : -1);
        break;
      case RIGHT_ARROW:
        this._activeDate = addDays(this._activeDate, isRTL ? -1 : 1);
        break;
      case UP_ARROW:
        this._activeDate = addDays(this._activeDate, -7);
        break;
      case DOWN_ARROW:
        this._activeDate = addDays(this._activeDate, 7);
        break;
      case HOME:
        this._activeDate = addDays(this._activeDate, 1 - getDate(this._activeDate));
        break;
      case END:
        this._activeDate = addDays(
          this._activeDate,
          getDaysInMonth(this._activeDate) - getDate(this._activeDate)
        );
        break;
      case PAGE_UP:
        this._activeDate = addMonths(this._activeDate, -1);
        break;
      case PAGE_DOWN:
        this._activeDate = addMonths(this._activeDate, 1);
        break;
      case ENTER:
      case SPACE:
        this._selectDate(this._activeDate);
        this._handleDateSelection(event);
        event.preventDefault();
        return;
      default:
        return;
    }

    if (
      !areDatesInSameView(
        oldActiveDate,
        this._activeDate,
        this._view,
        YEARS_IN_VIEW,
        this._options.min,
        this._options.max
      )
    ) {
      this._changeView('days');
    }

    this._removeHighlightFromCell(previousActiveCell);
    this._focusActiveCell(this.activeCell);
    event.preventDefault();
  }

  _asyncFocusDatesContainer() {
    setTimeout(() => {
      this.datesContainer.focus();
    }, 0);
  }

  _focusActiveCell(cell) {
    if (cell) {
      Manipulator.addClass(cell, 'focused');
    }
  }

  _removeHighlightFromCell(cell) {
    if (cell) {
      cell.classList.remove('focused');
    }
  }

  _getActiveDayCell() {
    const cells = SelectorEngine.find('td', this.datesContainer);

    const activeCell = Array.from(cells).find((cell) => {
      const cellDate = convertStringToDate(cell.dataset.mdbDate);
      return isSameDate(cellDate, this._activeDate);
    });

    return activeCell;
  }

  _handleMonthsViewKeydown(event) {
    const oldActiveDate = this._activeDate;
    const previousActiveCell = this.activeCell;

    switch (event.keyCode) {
      case LEFT_ARROW:
        this._activeDate = addMonths(this._activeDate, isRTL ? 1 : -1);
        break;
      case RIGHT_ARROW:
        this._activeDate = addMonths(this._activeDate, isRTL ? -1 : 1);
        break;
      case UP_ARROW:
        this._activeDate = addMonths(this._activeDate, -4);
        break;
      case DOWN_ARROW:
        this._activeDate = addMonths(this._activeDate, 4);
        break;
      case HOME:
        this._activeDate = addMonths(this._activeDate, -this.activeMonth);
        break;
      case END:
        this._activeDate = addMonths(this._activeDate, 11 - this.activeMonth);
        break;
      case PAGE_UP:
        this._activeDate = addYears(this._activeDate, -1);
        break;
      case PAGE_DOWN:
        this._activeDate = addYears(this._activeDate, 1);
        break;
      case ENTER:
      case SPACE:
        this._selectMonth(this.activeMonth);
        return;
      default:
        return;
    }

    if (
      !areDatesInSameView(
        oldActiveDate,
        this._activeDate,
        this._view,
        YEARS_IN_VIEW,
        this._options.min,
        this._options.max
      )
    ) {
      this._changeView('months');
    }

    this._removeHighlightFromCell(previousActiveCell);
    this._focusActiveCell(this.activeCell);
    event.preventDefault();
  }

  _getActiveMonthCell() {
    const cells = SelectorEngine.find('td', this.datesContainer);

    const activeCell = Array.from(cells).find((cell) => {
      const cellYear = parseInt(cell.dataset.mdbYear, 10);
      const cellMonth = parseInt(cell.dataset.mdbMonth, 10);
      return cellYear === this.activeYear && cellMonth === this.activeMonth;
    });

    return activeCell;
  }

  _handleYearsViewKeydown(event) {
    const oldActiveDate = this._activeDate;
    const previousActiveCell = this.activeCell;
    const yearsPerRow = 4;
    const yearsPerPage = 24;

    switch (event.keyCode) {
      case LEFT_ARROW:
        this._activeDate = addYears(this._activeDate, isRTL ? 1 : -1);
        break;
      case RIGHT_ARROW:
        this._activeDate = addYears(this._activeDate, isRTL ? -1 : 1);
        break;
      case UP_ARROW:
        this._activeDate = addYears(this._activeDate, -yearsPerRow);
        break;
      case DOWN_ARROW:
        this._activeDate = addYears(this._activeDate, yearsPerRow);
        break;
      case HOME:
        this._activeDate = addYears(
          this._activeDate,
          -getYearsOffset(this._activeDate, yearsPerPage)
        );
        break;
      case END:
        this._activeDate = addYears(
          this._activeDate,
          yearsPerPage - getYearsOffset(this._activeDate, yearsPerPage) - 1
        );
        break;
      case PAGE_UP:
        this._activeDate = addYears(this._activeDate, -yearsPerPage);
        break;
      case PAGE_DOWN:
        this._activeDate = addYears(this._activeDate, yearsPerPage);
        break;
      case ENTER:
      case SPACE:
        this._selectYear(this.activeYear);
        return;
      default:
        return;
    }

    if (
      !areDatesInSameView(
        oldActiveDate,
        this._activeDate,
        this._view,
        YEARS_IN_VIEW,
        this._options.min,
        this._options.max
      )
    ) {
      this._changeView('years');
    }

    this._removeHighlightFromCell(previousActiveCell);
    this._focusActiveCell(this.activeCell);
    event.preventDefault();
  }

  _getActiveYearCell() {
    const cells = SelectorEngine.find('td', this.datesContainer);

    const activeCell = Array.from(cells).find((cell) => {
      const cellYear = parseInt(cell.dataset.mdbYear, 10);
      return cellYear === this.activeYear;
    });

    return activeCell;
  }

  _setInitialDate() {
    if (this._input.value) {
      this._handleUserInput(this._input.value);
    } else if (this._options.startDate) {
      this._activeDate = new Date(this._options.startDate);
    } else {
      this._activeDate = new Date();
    }
  }

  close() {
    const closeEvent = EventHandler.trigger(this._element, EVENT_CLOSE);

    if (!this._isOpen || closeEvent.defaultPrevented) {
      return;
    }

    this._removeDatepickerListeners();

    if (this._animations) {
      Manipulator.addClass(this.container, 'animation');
      Manipulator.addClass(this.container, CONTAINER_CLOSE_ANIMATION_CLASS);
    }

    if (this._options.inline) {
      this._closeDropdown();
    } else {
      this._closeModal();
    }

    this._isOpen = false;
    this._view = this._options.view;

    if (this.toggleButton) {
      this.toggleButton.focus();
    } else {
      this._input.focus();
    }
  }

  _closeDropdown() {
    const datepicker = SelectorEngine.findOne('.datepicker-dropdown-container');
    const container = this._getContainer();
    if (this._animations) {
      datepicker.addEventListener('animationend', () => {
        if (datepicker) {
          container.removeChild(datepicker);
        }

        if (this._popper) {
          this._popper.destroy();
        }
      });
    } else {
      if (datepicker) {
        container.removeChild(datepicker);
      }

      if (this._popper) {
        this._popper.destroy();
      }
    }
    this._removeFocusTrap();
  }

  _closeModal() {
    const backdrop = SelectorEngine.findOne('.datepicker-backdrop');
    const datepicker = SelectorEngine.findOne('.datepicker-modal-container');

    if (!datepicker || !backdrop) {
      return;
    }

    if (this._animations) {
      Manipulator.addClass(backdrop, 'animation');
      Manipulator.addClass(backdrop, BACKDROP_CLOSE_ANIMATION_CLASS);
    }

    if (this._animations) {
      backdrop.addEventListener('animationend', () => {
        this._removePicker(backdrop, datepicker);
        this._scrollBar.reset();
      });
    } else {
      this._removePicker(backdrop, datepicker);
      this._scrollBar.reset();
    }
  }

  _removePicker(backdrop, datepicker) {
    const container = this._getContainer();

    container.removeChild(backdrop);
    container.removeChild(datepicker);
  }

  _removeFocusTrap() {
    if (this._focusTrap) {
      this._focusTrap.disable();
      this._focusTrap = null;
    }
  }

  _removeDatepickerListeners() {
    EventHandler.off(this.nextButton, 'click');
    EventHandler.off(this.previousButton, 'click');
    EventHandler.off(this.viewChangeButton, 'click');
    EventHandler.off(this.okButton, 'click');
    EventHandler.off(this.cancelButton, 'click');
    EventHandler.off(this.clearButton, 'click');

    EventHandler.off(this.datesContainer, 'click');
    EventHandler.off(this.datesContainer, 'keydown');
    EventHandler.off(this.datesContainer, 'focus');
    EventHandler.off(this.datesContainer, 'blur');

    EventHandler.off(document, EVENT_CLICK_DATA_API);
  }

  dispose() {
    if (this._isOpen) {
      this.close();
    }

    this._removeInputAndToggleListeners();

    const generatedToggleButton = SelectorEngine.findOne(`#${this._toggleButtonId}`);

    if (generatedToggleButton) {
      this._element.removeChild(generatedToggleButton);
    }
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    super.dispose();
  }

  _removeInputAndToggleListeners() {
    EventHandler.off(this._input, 'input');
    EventHandler.off(this._element, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE);
    EventHandler.off(this._element, 'keydown', SELECTOR_DATA_TOGGLE);
  }

  handleOk() {
    this._confirmSelection(this._headerDate);
    this.close();
  }

  _selectDate(date, cell = this.activeCell) {
    const { min, max, filter, disablePast, disableFuture } = this._options;

    if (isDateDisabled(date, min, max, filter, disablePast, disableFuture)) {
      return;
    }

    this._removeCurrentSelectionStyles();
    this._removeCurrentFocusStyles();
    this._addSelectedStyles(cell);
    this._selectedDate = date;
    this._selectedYear = getYear(date);
    this._selectedMonth = getMonth(date);
    this._headerDate = date;

    if (this._options.inline || this.options.confirmDateOnSelect) {
      this._confirmSelection(date);
      this.close();
    }
  }

  _selectYear(year, cell = this.activeCell) {
    this._removeCurrentSelectionStyles();
    this._removeCurrentFocusStyles();
    this._addSelectedStyles(cell);
    this._headerYear = year;

    this._asyncChangeView('months');
  }

  _selectMonth(month, cell = this.activeCell) {
    this._removeCurrentSelectionStyles();
    this._removeCurrentFocusStyles();
    this._addSelectedStyles(cell);
    this._headerMonth = month;

    this._asyncChangeView('days');
  }

  _removeSelectedStyles(cell) {
    if (cell) {
      cell.classList.remove('selected');
    }
  }

  _addSelectedStyles(cell) {
    if (cell) {
      Manipulator.addClass(cell, 'selected');
    }
  }

  _confirmSelection(date) {
    if (date) {
      const dateString = this.formatDate(date);
      this._input.value = dateString;
      Manipulator.addClass(this._input, 'active');
      EventHandler.trigger(this._element, EVENT_VALUE_CHANGED, { date });
    }
  }

  handleCancel() {
    this._selectedDate = null;
    this._selectedYear = null;
    this._selectedMonth = null;
    this.close();
  }

  handleClear() {
    this._selectedDate = null;
    this._selectedMonth = null;
    this._selectedYear = null;
    this._headerDate = null;
    this._headerMonth = null;
    this._headerYear = null;
    this._removeCurrentSelectionStyles();
    this._input.value = '';
    this._input.classList.remove('active');
    this._setInitialDate();
    this._changeView('days');
    this._updateHeaderDate(
      this._activeDate,
      this._options.monthsShort,
      this._options.weekdaysShort
    );
  }

  _removeCurrentSelectionStyles() {
    const currentSelected = SelectorEngine.findOne('.selected', this.container);

    if (currentSelected) {
      currentSelected.classList.remove('selected');
    }
  }

  _removeCurrentFocusStyles() {
    const currentFocused = SelectorEngine.findOne('.focused', this.container);

    if (currentFocused) {
      currentFocused.classList.remove('focused');
    }
  }

  formatDate(date) {
    const d = getDate(date);
    const dd = this._addLeadingZero(getDate(date));
    const ddd = this._options.weekdaysShort[getDayNumber(date)];
    const dddd = this._options.weekdaysFull[getDayNumber(date)];
    const m = getMonth(date) + 1;
    const mm = this._addLeadingZero(getMonth(date) + 1);
    const mmm = this._options.monthsShort[getMonth(date)];
    const mmmm = this._options.monthsFull[getMonth(date)];
    const yy =
      getYear(date).toString().length === 2 ? getYear(date) : getYear(date).toString().slice(2, 4);
    const yyyy = getYear(date);

    const preformatted = this._options.format.split(/(d{1,4}|m{1,4}|y{4}|yy|!.)/g);
    let formatted = '';
    preformatted.forEach((datePart) => {
      switch (datePart) {
        case 'dddd':
          datePart = datePart.replace(datePart, dddd);
          break;
        case 'ddd':
          datePart = datePart.replace(datePart, ddd);
          break;
        case 'dd':
          datePart = datePart.replace(datePart, dd);
          break;
        case 'd':
          datePart = datePart.replace(datePart, d);
          break;
        case 'mmmm':
          datePart = datePart.replace(datePart, mmmm);
          break;
        case 'mmm':
          datePart = datePart.replace(datePart, mmm);
          break;
        case 'mm':
          datePart = datePart.replace(datePart, mm);
          break;
        case 'm':
          datePart = datePart.replace(datePart, m);
          break;
        case 'yyyy':
          datePart = datePart.replace(datePart, yyyy);
          break;
        case 'yy':
          datePart = datePart.replace(datePart, yy);
          break;
        default:
      }
      formatted += datePart;
    });

    return formatted;
  }

  _addLeadingZero(value) {
    return parseInt(value, 10) < 10 ? `0${value}` : value;
  }

  _pickDay(day, el) {
    const date = convertStringToDate(day);
    const { min, max, filter, disablePast, disableFuture } = this._options;

    if (isDateDisabled(date, min, max, filter, disablePast, disableFuture)) {
      return;
    }

    this._activeDate = date;
    this._selectDate(date, el);
  }

  _pickYear(year) {
    const { min, max, disablePast, disableFuture } = this._options;

    if (isYearDisabled(year, min, max, disablePast, disableFuture)) {
      return;
    }

    const newDate = createDate(year, this.activeMonth, this.activeDay);

    this._activeDate = newDate;
    this._selectedDate = newDate;
    this._selectYear(year);
  }

  _pickMonth(month, year) {
    const { min, max, disablePast, disableFuture } = this._options;

    if (
      isMonthDisabled(month, year, min, max, disablePast, disableFuture) ||
      isYearDisabled(year, min, max, disablePast, disableFuture)
    ) {
      return;
    }

    const newDate = createDate(year, month, this.activeDay);

    this._activeDate = newDate;
    this._selectMonth(month);
  }

  nextMonth() {
    const nextMonth = addMonths(this._activeDate, 1);
    const template = createDayViewTemplate(nextMonth, this._headerDate, this._options);
    this._activeDate = nextMonth;
    this.viewChangeButton.textContent = `${this._options.monthsFull[this.activeMonth]} ${
      this.activeYear
    }`;
    this.datesContainer.innerHTML = template;
  }

  previousMonth() {
    const previousMonth = addMonths(this._activeDate, -1);
    this._activeDate = previousMonth;
    const template = createDayViewTemplate(previousMonth, this._headerDate, this._options);
    this.viewChangeButton.textContent = `${this._options.monthsFull[this.activeMonth]} ${
      this.activeYear
    }`;
    this.datesContainer.innerHTML = template;
  }

  nextYear() {
    const nextYear = addYears(this._activeDate, 1);
    this._activeDate = nextYear;
    this.viewChangeButton.textContent = `${this.activeYear}`;
    const template = createMonthViewTemplate(
      this.activeYear,
      this._selectedYear,
      this._selectedMonth,
      this._options,
      MONTHS_IN_ROW
    );
    this.datesContainer.innerHTML = template;
  }

  previousYear() {
    const previousYear = addYears(this._activeDate, -1);
    this._activeDate = previousYear;
    this.viewChangeButton.textContent = `${this.activeYear}`;
    const template = createMonthViewTemplate(
      this.activeYear,
      this._selectedYear,
      this._selectedMonth,
      this._options,
      MONTHS_IN_ROW
    );
    this.datesContainer.innerHTML = template;
  }

  nextYears() {
    const nextYear = addYears(this._activeDate, 24);
    this._activeDate = nextYear;
    const template = createYearViewTemplate(
      nextYear,
      this._selectedYear,
      this._options,
      YEARS_IN_VIEW,
      YEARS_IN_ROW
    );
    this.viewChangeButton.textContent = `${this.firstYearInView} - ${this.lastYearInView}`;
    this.datesContainer.innerHTML = template;
  }

  previousYears() {
    const previousYear = addYears(this._activeDate, -24);
    this._activeDate = previousYear;
    const template = createYearViewTemplate(
      previousYear,
      this._selectedYear,
      this._options,
      YEARS_IN_VIEW,
      YEARS_IN_ROW
    );
    this.viewChangeButton.textContent = `${this.firstYearInView} - ${this.lastYearInView}`;
    this.datesContainer.innerHTML = template;
  }

  _asyncChangeView(view) {
    setTimeout(() => {
      this._changeView(view);
    }, 0);
  }

  _changeView(view) {
    this._view = view;
    // We need to add blur event here to reapply focus to
    // dates container when switching from years to months
    // view after selecting year
    this.datesContainer.blur();

    if (view === 'days') {
      this.datesContainer.innerHTML = createDayViewTemplate(
        this._activeDate,
        this._headerDate,
        this._options
      );
    }

    if (view === 'months') {
      this.datesContainer.innerHTML = createMonthViewTemplate(
        this.activeYear,
        this._selectedYear,
        this._selectedMonth,
        this._options,
        MONTHS_IN_ROW
      );
    }

    if (view === 'years') {
      this.datesContainer.innerHTML = createYearViewTemplate(
        this._activeDate,
        this._selectedYear,
        this._options,
        YEARS_IN_VIEW,
        YEARS_IN_ROW
      );
    }

    this.datesContainer.focus();
    this._updateViewControlsAndAttributes(view);
    this._updateControlsDisabledState();

    EventHandler.trigger(this._element, EVENT_VIEW_CHANGED, { view: this._view });
  }

  _updateViewControlsAndAttributes(view) {
    if (view === 'days') {
      this.viewChangeButton.textContent = `${this._options.monthsFull[this.activeMonth]} ${
        this.activeYear
      }`;
      this.viewChangeButton.setAttribute('aria-label', this._options.switchToMultiYearViewLabel);
      this.previousButton.setAttribute('aria-label', this._options.prevMonthLabel);
      this.nextButton.setAttribute('aria-label', this._options.nextMonthLabel);
    }

    if (view === 'months') {
      this.viewChangeButton.textContent = `${this.activeYear}`;
      this.viewChangeButton.setAttribute('aria-label', this._options.switchToDayViewLabel);
      this.previousButton.setAttribute('aria-label', this._options.prevYearLabel);
      this.nextButton.setAttribute('aria-label', this._options.nextYearLabel);
    }

    if (view === 'years') {
      this.viewChangeButton.textContent = `${this.firstYearInView} - ${this.lastYearInView}`;
      this.viewChangeButton.setAttribute('aria-label', this._options.switchToDayViewLabel);
      this.previousButton.setAttribute('aria-label', this._options.prevMultiYearLabel);
      this.nextButton.setAttribute('aria-label', this._options.nextMultiYearLabel);
    }
  }

  _updateControlsDisabledState() {
    if (
      isNextDateDisabled(
        this._options.disableFuture,
        this._activeDate,
        this._view,
        YEARS_IN_VIEW,
        this._options.min,
        this._options.max,
        this.lastYearInView,
        this.firstYearInView
      )
    ) {
      this.nextButton.disabled = true;
    } else {
      this.nextButton.disabled = false;
    }

    if (
      isPreviousDateDisabled(
        this._options.disablePast,
        this._activeDate,
        this._view,
        YEARS_IN_VIEW,
        this._options.min,
        this._options.max,
        this.lastYearInView,
        this.firstYearInView
      )
    ) {
      this.previousButton.disabled = true;
    } else {
      this.previousButton.disabled = false;
    }
  }

  _handleUserInput(input) {
    const delimeters = this._getDelimeters(this._options.format);
    const date = this._parseDate(input, this._options.format, delimeters);

    if (isValidDate(date)) {
      this._activeDate = date;
      this._selectedDate = date;
      this._selectedYear = getYear(date);
      this._selectedMonth = getMonth(date);
      this._headerDate = date;
    } else {
      this._activeDate = new Date();
      this._selectedDate = null;
      this._selectedMonth = null;
      this._selectedYear = null;
      this._headerDate = null;
      this._headerMonth = null;
      this._headerYear = null;
    }
  }

  _getDelimeters(format) {
    return format.match(/[^(dmy)]{1,}/g);
  }

  _parseDate(dateString, format, delimeters) {
    let delimeterPattern;

    if (delimeters[0] !== delimeters[1]) {
      delimeterPattern = delimeters[0] + delimeters[1];
    } else {
      delimeterPattern = delimeters[0];
    }

    const regExp = new RegExp(`[${delimeterPattern}]`);
    const dateParts = dateString.split(regExp);
    const formatParts = format.split(regExp);
    const isMonthString = format.indexOf('mmm') !== -1;

    const datesArray = [];

    for (let i = 0; i < formatParts.length; i++) {
      if (formatParts[i].indexOf('yy') !== -1) {
        datesArray[0] = { value: dateParts[i], format: formatParts[i] };
      }
      if (formatParts[i].indexOf('m') !== -1) {
        datesArray[1] = { value: dateParts[i], format: formatParts[i] };
      }
      if (formatParts[i].indexOf('d') !== -1 && formatParts[i].length <= 2) {
        datesArray[2] = { value: dateParts[i], format: formatParts[i] };
      }
    }

    let monthsNames;

    if (format.indexOf('mmmm') !== -1) {
      monthsNames = this._options.monthsFull;
    } else {
      monthsNames = this._options.monthsShort;
    }

    const year = Number(datesArray[0].value);
    const month = isMonthString
      ? this.getMonthNumberByMonthName(datesArray[1].value, monthsNames)
      : Number(datesArray[1].value) - 1;
    const day = Number(datesArray[2].value);

    const parsedDate = createDate(year, month, day);
    return parsedDate;
  }

  getMonthNumberByMonthName(monthValue, monthLabels) {
    return monthLabels.findIndex((monthLabel) => monthLabel === monthValue);
  }

  static jQueryInterface(config, options) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose/.test(config)) {
        return;
      }

      if (!data) {
        data = new Datepicker(this, _config);
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

export default Datepicker;
