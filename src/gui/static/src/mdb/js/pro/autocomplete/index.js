import { createPopper } from '@popperjs/core';
import Data from '../../mdb/dom/data';
import Manipulator from '../../mdb/dom/manipulator';
import SelectorEngine from '../../mdb/dom/selector-engine';
import { typeCheckConfig, getUID, defineJQueryPlugin } from '../../mdb/util/index';
import EventHandler from '../../mdb/dom/event-handler';
import {
  getDropdownTemplate,
  getItemsTemplate,
  getLoaderTemplate,
  getNoResultsTemplate,
} from './templates';
import { ESCAPE, UP_ARROW, DOWN_ARROW, HOME, END, ENTER, TAB } from '../../mdb/util/keycodes';
import { sanitizeHtml, DefaultWhitelist } from '../../mdb/util/sanitizer';
import BaseComponent from '../../free/base-component';
import { bindCallbackEventsIfNeeded } from '../../autoinit/init';

const Default = {
  autoSelect: false,
  container: 'body',
  customContent: '',
  debounce: 300,
  displayValue: (value) => value,
  filter: null,
  itemContent: null,
  listHeight: 190,
  noResults: 'No results found',
  threshold: 0,
};

const DefaultType = {
  autoSelect: 'boolean',
  container: 'string',
  customContent: 'string',
  debounce: 'number',
  displayValue: 'function',
  filter: '(null|function)',
  itemContent: '(null|function)',
  listHeight: 'number',
  noResults: 'string',
  threshold: 'number',
};

const NAME = 'autocomplete';
const DATA_KEY = 'mdb.autocomplete';

const CLASS_NAME_CUSTOM_INPUT = 'autocomplete-input';
const CLASS_NAME_CUSTOM_LABEL = 'autocomplete-label';
const CLASS_NAME_ACTIVE = 'active';
const CLASS_NAME_FOCUSED = 'focused';
const CLASS_NAME_FOCUSING = 'focusing';
const CLASS_NAME_OPEN = 'open';

const SELECTOR_DROPDOWN = '.autocomplete-dropdown';
const SELECTOR_ITEMS_LIST = '.autocomplete-items-list';
const SELECTOR_ITEM = '.autocomplete-item';
const SELECTOR_LOADER = '.autocomplete-loader';
const SELECTOR_INPUT = '.form-control';
const SELECTOR_LABEL = '.form-label';
const SELECTOR_CUSTOM_CONTENT = '.autocomplete-custom-content';

const EVENT_KEY = `.${DATA_KEY}`;
const EVENT_CLOSE = `close${EVENT_KEY}`;
const EVENT_OPEN = `open${EVENT_KEY}`;
const EVENT_SELECT = `itemSelect${EVENT_KEY}`;
const EVENT_UPDATE = `update${EVENT_KEY}`;

const LOADER_CLOSE_DELAY = 300;

class Autocomplete extends BaseComponent {
  constructor(element, options) {
    super(element);

    this._options = this._getConfig(options);
    this._getContainer();
    this._input = SelectorEngine.findOne(SELECTOR_INPUT, element);
    this._label = SelectorEngine.findOne(SELECTOR_LABEL, element);
    this._customContent = SelectorEngine.findOne(SELECTOR_CUSTOM_CONTENT, element);
    this._loader = getLoaderTemplate();
    this._popper = null;
    this._debounceTimeoutId = null;
    this._loaderTimeout = null;
    this._activeItemIndex = -1;
    this._activeItem = null;
    this._filteredResults = null;
    this._lastQueryValue = null;
    this._canOpenOnFocus = true;
    this._isOpen = false;

    this._outsideClickHandler = this._handleOutsideClick.bind(this);
    this._inputFocusHandler = this._handleInputFocus.bind(this);
    this._userInputHandler = this._handleUserInput.bind(this);
    this._keydownHandler = this._handleKeydown.bind(this);

    this._init();
    Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
    bindCallbackEventsIfNeeded(this.constructor);
  }

  static get NAME() {
    return NAME;
  }

  get filter() {
    return this._options.filter;
  }

  get dropdown() {
    return SelectorEngine.findOne(SELECTOR_DROPDOWN, this._dropdownContainer);
  }

  get items() {
    return SelectorEngine.find(SELECTOR_ITEM, this._dropdownContainer);
  }

  get itemsList() {
    return SelectorEngine.findOne(SELECTOR_ITEMS_LIST, this._dropdownContainer);
  }

  search(value) {
    this._filterResults(value);
  }

  _getContainer() {
    this._container = SelectorEngine.findOne(this._options.container);
  }

  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._element);

    config = {
      ...Default,
      ...dataAttributes,
      ...config,
    };

    typeCheckConfig(NAME, config, DefaultType);

    return config;
  }

  _init() {
    this._initDropdown();
    this._setInputAndLabelClasses();
    this._updateLabelPosition();
    this._setInputAriaAttributes();
    this._listenToInputFocus();
    this._listenToUserInput();
    this._listenToKeydown();
  }

  _initDropdown() {
    this._dropdownContainerId = this._element.id
      ? `autocomplete-dropdown-${this._element.id}`
      : getUID('autocomplete-dropdown-');
    const settings = {
      id: this._dropdownContainerId,
      items: [],
      width: this._input.offsetWidth,
      options: this._options,
    };

    this._dropdownContainer = getDropdownTemplate(settings);

    if (this._options.customContent !== '') {
      const customContent = this._options.customContent;
      const sanitizedCustomContent = sanitizeHtml(customContent, DefaultWhitelist, null);
      this.dropdown.insertAdjacentHTML('beforeend', sanitizedCustomContent);
    }
  }

  _setInputAndLabelClasses() {
    Manipulator.addClass(this._input, CLASS_NAME_CUSTOM_INPUT);

    if (this._label) {
      Manipulator.addClass(this._label, CLASS_NAME_CUSTOM_LABEL);
    }
  }

  _setInputAriaAttributes() {
    this._input.setAttribute('role', 'combobox');
    this._input.setAttribute('aria-expanded', false);
    this._input.setAttribute('aria-owns', this._dropdownContainerId);
    this._input.setAttribute('aria-haspopup', true);
    this._input.setAttribute('autocomplete', 'off');
  }

  _updateLabelPosition() {
    if (!this._label) {
      return;
    }

    if (this._input.value !== '' || this._isOpen) {
      Manipulator.addClass(this._label, CLASS_NAME_ACTIVE);
    } else {
      Manipulator.removeClass(this._label, CLASS_NAME_ACTIVE);
    }
  }

  _listenToInputFocus() {
    EventHandler.on(this._input, 'focus', this._inputFocusHandler);
  }

  _handleInputFocus(event) {
    const { value } = event.target;
    const threshold = this._options.threshold;

    if (!this._canOpenOnFocus) {
      this._canOpenOnFocus = true;
      return;
    }

    if (value.length < threshold) {
      return;
    }

    if (this._lastQueryValue !== value) {
      this._filterResults(value);
    } else {
      this.open();
    }
  }

  _listenToWindowResize() {
    EventHandler.on(window, 'resize', this._handleWindowResize.bind(this));
  }

  _handleWindowResize() {
    if (this._dropdownContainer) {
      this._updateDropdownWidth();
    }
  }

  _updateDropdownWidth() {
    const inputWidth = this._input.offsetWidth;
    Manipulator.addStyle(this._dropdownContainer, { width: `${inputWidth}px` });
  }

  _listenToUserInput() {
    EventHandler.on(this._input, 'input', this._userInputHandler);
  }

  _handleUserInput(event) {
    const { value } = event.target;
    const threshold = this._options.threshold;
    const debounceTime = this._options.debounce;

    if (!this.filter) {
      return;
    }

    if (value.length < threshold) {
      if (this._isOpen) {
        this.close();
      }
      return;
    }

    this._debounceFilter(value, debounceTime);
  }

  _debounceFilter(searchTerm, debounceTime) {
    if (this._debounceTimeoutId) {
      clearTimeout(this._debounceTimeoutId);
    }

    this._debounceTimeoutId = setTimeout(() => {
      this._filterResults(searchTerm);
    }, debounceTime);
  }

  _filterResults(value) {
    this._lastQueryValue = value;
    const data = this.filter(value);

    if (this._isPromise(data)) {
      this._asyncUpdateResults(data);
    } else {
      this._updateResults(data);
    }
  }

  _isPromise(value) {
    return !!value && typeof value.then === 'function';
  }

  _asyncUpdateResults(data) {
    this._resetActiveItem();
    this._showLoader();

    data.then((items) => {
      this._updateResults(items);

      this._loaderTimeout = setTimeout(() => {
        this._hideLoader();
        this._loaderTimeout = null;
      }, LOADER_CLOSE_DELAY);
    });
  }

  _resetActiveItem() {
    const currentActive = this._activeItem;

    if (currentActive) {
      Manipulator.removeClass(currentActive, 'active');
      this._activeItem = null;
      this._activeItemIndex = -1;
    }
  }

  _showLoader() {
    this._element.appendChild(this._loader);
  }

  _hideLoader() {
    const loader = SelectorEngine.findOne(SELECTOR_LOADER, this._element);

    if (loader) {
      this._element.removeChild(this._loader);
    }
  }

  _updateResults(data) {
    this._resetActiveItem();
    this._filteredResults = data;
    EventHandler.trigger(this._element, EVENT_UPDATE, { results: data });

    const itemsList = SelectorEngine.findOne('.autocomplete-items-list', this._dropdownContainer);
    const newTemplate = getItemsTemplate(data, this._options);
    const noResultsTemplate = getNoResultsTemplate(this._options.noResults);

    if (data.length === 0 && this._options.noResults !== '') {
      itemsList.innerHTML = noResultsTemplate;
    } else {
      itemsList.innerHTML = newTemplate;
    }

    if (!this._isOpen) {
      this.open();
    }

    if (this._popper) {
      this._popper.forceUpdate();
    }
  }

  _listenToKeydown() {
    EventHandler.on(this._element, 'keydown', this._keydownHandler);
  }

  _handleKeydown(event) {
    if (this._isOpen) {
      this._handleOpenKeydown(event);
    } else {
      this._handleClosedKeydown(event);
    }
  }

  _handleOpenKeydown(event) {
    const key = event.keyCode;

    if (key === TAB && this._options.autoSelect) {
      this._selectActiveItem();
    }

    // fix for flashing notch
    if (key === ESCAPE || (key === UP_ARROW && event.altKey)) {
      if (!this._input.value) {
        Manipulator.addClass(this._input, CLASS_NAME_FOCUSING);
      }

      this.close();
      this._input.focus();

      if (!this._input.value) {
        setTimeout(() => {
          Manipulator.removeClass(this._input, CLASS_NAME_FOCUSING);
        }, 10);
      }
      return;
    }

    const isCloseKey = key === ESCAPE || (key === UP_ARROW && event.altKey) || key === TAB;

    if (isCloseKey) {
      this.close();
      this._input.focus();
      return;
    }

    switch (key) {
      case DOWN_ARROW:
        this._setActiveItem(this._activeItemIndex + 1);
        this._scrollToItem(this._activeItem);
        break;
      case UP_ARROW:
        this._setActiveItem(this._activeItemIndex - 1);
        this._scrollToItem(this._activeItem);
        break;
      case HOME:
        if (this._activeItemIndex > -1) {
          this._setActiveItem(0);
          this._scrollToItem(this._activeItem);
        } else {
          this._input.setSelectionRange(0, 0);
        }
        break;
      case END:
        if (this._activeItemIndex > -1) {
          this._setActiveItem(this.items.length - 1);
          this._scrollToItem(this._activeItem);
        } else {
          const end = this._input.value.length;
          this._input.setSelectionRange(end, end);
        }
        break;
      case ENTER:
        event.preventDefault();
        if (this._activeItemIndex > -1) {
          const item = this._filteredResults[this._activeItemIndex];
          this._handleSelection(item);
        }
        return;
      default:
        return;
    }

    event.preventDefault();
  }

  _setActiveItem(index) {
    const items = this.items;

    if (!items[index]) {
      return;
    }

    this._updateActiveItem(items[index], index);
  }

  _updateActiveItem(newActiveItem, index) {
    const currentActiveItem = this._activeItem;

    if (currentActiveItem) {
      Manipulator.removeClass(currentActiveItem, 'active');
    }

    Manipulator.addClass(newActiveItem, 'active');
    this._activeItemIndex = index;
    this._activeItem = newActiveItem;
  }

  _scrollToItem(item) {
    if (!item) {
      return;
    }

    const list = this.itemsList;
    const listHeight = list.offsetHeight;
    const itemIndex = this.items.indexOf(item);
    const itemHeight = item.offsetHeight;
    const scrollTop = list.scrollTop;

    if (itemIndex > -1) {
      const itemOffset = itemIndex * itemHeight;
      const isBelow = itemOffset + itemHeight > scrollTop + listHeight;
      const isAbove = itemOffset < scrollTop;

      if (isAbove) {
        list.scrollTop = itemOffset;
      } else if (isBelow) {
        list.scrollTop = itemOffset - listHeight + itemHeight;
      } else {
        list.scrollTop = scrollTop;
      }
    }
  }

  _handleClosedKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
    const key = event.keyCode;
    const isOpenKey = key === ENTER || key === DOWN_ARROW || key === DOWN_ARROW;

    if (isOpenKey) {
      this.open();
    }
  }

  open() {
    if (this._lastQueryValue === null) {
      this._filterResults('');
    }

    const openEvent = EventHandler.trigger(this._element, EVENT_OPEN);

    if (this._isOpen || openEvent.defaultPrevented) {
      return;
    }
    this._updateDropdownWidth();
    this._listenToWindowResize();

    this._popper = createPopper(this._element, this._dropdownContainer, {
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 1],
          },
        },
      ],
    });
    this._container.appendChild(this._dropdownContainer);

    this._listenToOutsideClick();
    this._listenToItemsClick();

    // We need to add delay to wait for the popper initialization
    // and position update
    setTimeout(() => {
      Manipulator.addClass(this.dropdown, CLASS_NAME_OPEN);
      this._isOpen = true;
      this._setInputActiveStyles();
      this._updateLabelPosition();
    }, 0);
  }

  _listenToOutsideClick() {
    EventHandler.on(document, 'click', this._outsideClickHandler);
  }

  _handleOutsideClick(event) {
    const isInput = this._input === event.target;
    const isDropdown = event.target === this._dropdownContainer;
    const isDropdownContent =
      this._dropdownContainer && this._dropdownContainer.contains(event.target);

    if (!isInput && !isDropdown && !isDropdownContent) {
      this.close();
    }
  }

  _listenToItemsClick() {
    const itemsList = SelectorEngine.findOne(SELECTOR_ITEMS_LIST, this._dropdownContainer);
    EventHandler.on(itemsList, 'click', this._handleItemsClick.bind(this));
  }

  _handleItemsClick(event) {
    const target = SelectorEngine.closest(event.target, SELECTOR_ITEM);
    const targetIndex = Manipulator.getDataAttribute(target, 'index');
    const item = this._filteredResults[targetIndex];

    this._handleSelection(item);
  }

  _selectActiveItem() {
    const item = this._filteredResults[this._activeItemIndex];

    if (!item) {
      return;
    }

    const value = this._options.displayValue(item);
    const selectEvent = EventHandler.trigger(this._element, EVENT_SELECT, { value: item });

    if (selectEvent.defaultPrevented) {
      return;
    }

    setTimeout(() => {
      this._canOpenOnFocus = false;
      this._updateInputValue(value);
      this._updateLabelPosition();
    }, 0);
  }

  _handleSelection(item) {
    const value = this._options.displayValue(item);
    const selectEvent = EventHandler.trigger(this._element, EVENT_SELECT, { value: item });

    if (item === undefined) {
      return;
    }

    if (selectEvent.defaultPrevented) {
      return;
    }

    setTimeout(() => {
      this._canOpenOnFocus = false;
      this._updateInputValue(value);
      this._updateLabelPosition();
      this._input.focus();
      this.close();
    }, 0);
  }

  _updateInputValue(value) {
    this._input.value = value;
  }

  _setInputActiveStyles() {
    Manipulator.addClass(this._input, CLASS_NAME_FOCUSED);
  }

  close() {
    const closeEvent = EventHandler.trigger(this._element, EVENT_CLOSE);

    if (!this._isOpen || closeEvent.defaultPrevented) {
      return;
    }

    this._resetActiveItem();
    this._removeDropdownEvents();

    Manipulator.removeClass(this.dropdown, CLASS_NAME_OPEN);

    EventHandler.on(this.dropdown, 'transitionend', this._handleDropdownTransitionEnd.bind(this));

    Manipulator.removeClass(this._input, CLASS_NAME_FOCUSED);
    Manipulator.removeClass(this._input, CLASS_NAME_ACTIVE);

    if (!this._input.value && this._label) {
      Manipulator.removeClass(this._label, CLASS_NAME_ACTIVE);
    }
  }

  _removeDropdownEvents() {
    const itemsList = SelectorEngine.findOne(SELECTOR_ITEMS_LIST, this._dropdownContainer);
    EventHandler.off(itemsList, 'click');
    EventHandler.off(document, 'click', this._outsideClickHandler);
    EventHandler.off(window, 'resize', this._handleWindowResize.bind(this));
  }

  _handleDropdownTransitionEnd(event) {
    // This event fires for each animated property. We only want
    // to run this code once
    if (this._isOpen && event && event.propertyName === 'opacity') {
      this._popper.destroy();

      if (this._dropdownContainer) {
        this._container.removeChild(this._dropdownContainer);
      }

      this._isOpen = false;
      EventHandler.off(this.dropdown, 'transitionend');
    }
  }

  dispose() {
    if (this._isOpen) {
      this.close();
    }

    this._removeInputAndElementEvents();
    this._dropdownContainer.remove();
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    super.dispose();
  }

  _removeInputAndElementEvents() {
    EventHandler.off(this._input, 'focus', this._inputFocusHandler);
    EventHandler.off(this._input, 'input', this._userInputHandler);
    EventHandler.off(this._element, 'keydown', this._keydownHandler);
  }

  static jQueryInterface(config, options) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose/.test(config)) {
        return;
      }

      if (!data) {
        data = new Autocomplete(this, _config);
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

defineJQueryPlugin(Autocomplete);

export default Autocomplete;
