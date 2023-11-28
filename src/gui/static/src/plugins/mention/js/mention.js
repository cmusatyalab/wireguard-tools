import { createPopper } from '@popperjs/core';
import Data from './mdb/dom/data';
import Manipulator from './mdb/dom/manipulator';
import EventHandler from './mdb/dom/event-handler';
import SelectorEngine from './mdb/dom/selector-engine';
import { getjQuery, typeCheckConfig, getUID, onDOMContentLoaded } from './mdb/util/index';

import {
  ESCAPE,
  TAB,
  UP_ARROW,
  DOWN_ARROW,
  HOME,
  END,
  ENTER,
  LEFT_ARROW,
  RIGHT_ARROW,
} from './mdb/util/keycodes';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'mention';
const DATA_KEY = 'mdb.mention';

const EVENT_OPEN = `open.${DATA_KEY}`;
const EVENT_CLOSE = `close.${DATA_KEY}`;
const EVENT_ITEM_SELECTED = `itemSelected.${DATA_KEY}`;
const EVENT_VALUE_CHANGE = `valueChange.${DATA_KEY}`;
const EVENT_FETCH_ERROR = `fetchError.${DATA_KEY}`;

const CLASS_MENTION_DROPDOWN_CONTAINER = `${NAME}-dropdown-container`;
const CLASS_MENTION_DROPDOWN = `${NAME}-dropdown`;
const CLASS_MENTION_ITEMS_LIST = `${NAME}-items-list`;
const CLASS_MENTION_ITEM = `${NAME}-item`;
const CLASS_MENTION_ITEM_TEXT = `${NAME}-item-text`;
const CLASS_MENTION_ITEM_IMAGE_CONTAINER = `${NAME}-item-image-container`;
const CLASS_MENTION_ITEM_IMAGE = `${NAME}-item-image`;
const CLASS_ROUNDED_CIRCLE = 'rounded-circle';

const SELECTOR_MENTION_DROPDOWN = `.${CLASS_MENTION_DROPDOWN}`;
const SELECTOR_MENTION_LIST = `.${CLASS_MENTION_ITEMS_LIST}`;
const SELECTOR_MENTION_ITEM = `.${CLASS_MENTION_ITEM}`;

const SELECTOR_DATA_INIT = '[data-mdb-mention-init]';

const TRIGGERS_ARRAY = ['@', '#', '$', '%', '^', '&', '*'];

const DefaultType = {
  noResultsText: 'string',
  trigger: 'string',
  queryBy: 'string',
  placement: 'string',
  showListOnTrigger: 'boolean',
  showImg: 'boolean',
  visibleItems: 'number',
  items: 'array',
  multiInstance: 'boolean',
  getAsync: 'string',
};

const Default = {
  noResultsText: 'No results found',
  trigger: '@',
  queryBy: 'username',
  placement: 'bottom',
  showListOnTrigger: true,
  showImg: false,
  visibleItems: 5,
  items: [],
  multiInstance: false,
  getAsync: '',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */
//

class Mention {
  constructor(element, options) {
    this._element = element;
    this._options = this._getConfig(options);
    this._popper = null;

    this._mentionContainerId = getUID('mention-dropdown-container-');
    this._mentionContainer = null;
    this._mentionListContainer = null;
    this._mentionList = null;

    this._items = this._options.items;
    this._activeItemIndex = -1;
    this._activeItem = null;
    this._itemsList = null;

    this._withTriggerValueStart = null;
    this._withTriggerValueEnd = null;

    this._keyDownHandler = (e) => this._handleKeyDown(e);
    this._dropdownClickHandler = (e) => this._handleOpenedDropdownClick(e);
    this._dropdownTransitionHandler = (e) => this._handleDropdownCloseTransition(e);
    this._resizeHandler = () => this._handleWindowResize();

    this._isOpen = false;
    this._isLoading = false;

    if (this._element) {
      this._init();

      this._setData();
    }
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  get mentionItems() {
    return SelectorEngine.find(SELECTOR_MENTION_ITEM, this._mentionContainer);
  }

  // Public

  dispose() {
    EventHandler.off(this._element, 'click', this._handleInputEvent);
    EventHandler.off(window, 'resize', this._handleWindowResize);

    if (this._mentionContainer) this._destroyMentionContainer();

    Data.removeData(this._element, DATA_KEY);
    this._element = null;
  }

  open() {
    this._openMention();
    EventHandler.on(window, 'resize', this._resizeHandler);

    this._listenToOpenedDropdownClick();
    this._listenToKeyDown();

    this._isOpen = true;
    EventHandler.trigger(this._element, EVENT_OPEN);
  }

  close = () => {
    this._removeDropdownEvents();

    Manipulator.removeClass(this._mentionListContainer, 'open');

    EventHandler.on(this._mentionListContainer, 'transitionend', this._dropdownTransitionHandler);

    EventHandler.trigger(this._element, EVENT_CLOSE);
  };

  _setData() {
    if (this._options.multiInstance) {
      const previousInstance = Data.getData(this._element, DATA_KEY);
      const existingTriggers = [];

      if (previousInstance) {
        previousInstance.forEach(({ _options: { trigger } }) => {
          existingTriggers.push(trigger);
        });
      }

      if (existingTriggers.length > 0 && existingTriggers.includes(this._options.trigger)) {
        this._options.trigger = this._getArrayDifference(existingTriggers, TRIGGERS_ARRAY)[0];
        // eslint disable-next-line
        console.warn(
          `You've passed trigger key that already exists on Mention multiple list. We've changed it to ${this._options.trigger}. Please verify your code`
        );
      }

      Data.setMultipleData(this._element, DATA_KEY, this);
    } else {
      Data.setData(this._element, DATA_KEY, this);
    }
  }

  // Private
  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._element);
    config = {
      ...Default,
      ...dataAttributes,
      ...config,
    };

    if (dataAttributes.items && typeof dataAttributes.items === 'string') {
      config.items = this._parseDataAttributeItems(dataAttributes.items);
    }

    const HTMLDataList = this._element
      ? SelectorEngine.findOne(`[data-mdb-target=${this._element.id}]`)
      : null;
    if (HTMLDataList !== null) {
      config.items = this._getDataFromHTML(HTMLDataList, config);
    }

    typeCheckConfig(NAME, config, DefaultType);

    return config;
  }

  _getDataFromHTML(dataList, config) {
    const HTMLDataItems = SelectorEngine.find('li', dataList);
    const data = HTMLDataItems.map((el) => Manipulator.getDataAttributes(el));
    const allItemsArray = [...config.items, ...data];

    return this._getArrayUnion(data, allItemsArray);
  }

  _getArrayUnion(arrayA, arrayB) {
    const setB = new Set(arrayB);

    const union = new Set([...arrayA]);
    setB.forEach((el) => {
      if (!union.has(el)) union.add(el);
    });
    return [...union];
  }

  _getArrayDifference(arrToBeDifferenced, arrToBeDifferencedFrom) {
    const setA = new Set(arrToBeDifferenced);
    const setB = new Set(arrToBeDifferencedFrom);
    const difference = new Set([...setB].filter((x) => !setA.has(x)));
    return [...difference];
  }

  _parseDataAttributeItems(items) {
    items = items
      .replace(/'/g, '"')
      .replace(/}/g, '}}')
      .split('},')
      .map((el) =>
        el
          .replace(/}}]/, '}')
          .substring(el.indexOf('{'), el.lastIndexOf('}') + 1)
          .replace(/(\w+:)|(\w+ :)/g, (matchedStr) => {
            return `"${matchedStr.substring(0, matchedStr.length - 1)}":`;
          })
      );

    return items.map((el) => JSON.parse(el));
  }

  _init() {
    if (this._options.getAsync) this._fetchItems();

    this._listenToInputEvents();
  }

  async _fetchItems() {
    this._isLoading = true;

    try {
      const response = await fetch(this._options.getAsync);
      if (response.ok) {
        const data = await response.json();

        if (data.hasOwnProperty('items')) {
          this._items = data.items;
        } else if (data[0].hasOwnProperty(this._options.queryBy)) {
          this._items = data;
        }

        // ideally this will never happen, but it's just in case if user will be faster than server response
        if (this._isOpen) {
          const template = this._itemsListTemplate();

          this._updateMentionList(template);
        }
      } else {
        throw new Error('Could not get the data');
      }
    } catch (error) {
      EventHandler.trigger(this._element, EVENT_FETCH_ERROR, { value: error });
      this._handleFetchError();
    }

    this._isLoading = false;
  }

  _handleFetchError() {
    this._isLoading = false;
    this._options.noResultsText = 'There was problem reaching your data from the server';
  }

  _listenToInputEvents() {
    const events = ['click', 'input'];

    EventHandler.on(this._element, 'keydown', (e) => this._handleInputKeydown(e));
    events.forEach((event) => EventHandler.on(this._element, event, this._handleInputEvent));
  }

  _handleInputKeydown(e) {
    if (e.keyCode === LEFT_ARROW || e.keyCode === RIGHT_ARROW) {
      this._handleInputEvent(e);
    }
  }

  _getCurrentSelection(inputValue) {
    const boundaries = {
      start: this._element.selectionStart,
      end: this._element.selectionStart,
    };
    let i = 0;
    while (i < 1) {
      const start = boundaries.start;
      const end = boundaries.end;
      const prevChar = inputValue.charAt(start - 1);
      const currentChar = inputValue.charAt(end);

      if (!prevChar.match(/\s/g) && prevChar.length > 0) {
        boundaries.start--;
      }

      if (!currentChar.match(/\s/g) && currentChar.length > 0) {
        boundaries.end++;
      }

      if (start === boundaries.start && end === boundaries.end) {
        i = 1;
      }
    }
    this._withTriggerValueStart = boundaries.start;
    this._withTriggerValueEnd = boundaries.end;

    return inputValue.slice(boundaries.start, boundaries.end);
  }

  _handleInputEvent = (event) => {
    if (event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW) return;

    const { value } = event.target;

    const word = this._getCurrentSelection(value);

    if (!word && this._isOpen) {
      this.close();
      return;
    }

    const triggerIndex = word.indexOf(this._options.trigger);
    const userInput = word.slice(triggerIndex + 1);
    const hasTrigger = triggerIndex !== -1;

    if (!hasTrigger && this._isOpen) {
      this.close();
    } else if (hasTrigger) {
      this._withTriggerValue = word;
      this._handleUserInputWithTrigger(userInput);
    }
  };

  _handleUserInputWithTrigger(value) {
    if (!this._options.showListOnTrigger && value.length < 1) {
      return;
    }

    if (!this._isOpen) {
      if (this._options.multiInstance && this._isMultiInstanceOpen()) return;
      this.open();
    }

    this._itemsList = this._getFilteredItems(value);

    if (this._itemsList.length !== 0) {
      const filteredItemsTemplate = this._itemsListTemplate(value);

      this._updateMentionList(filteredItemsTemplate);
    } else {
      const noResultsTemplate = this._getNoResultsTemplate();
      this._updateMentionList(noResultsTemplate);
    }
  }

  _isMultiInstanceOpen() {
    const instances = Mention.getInstance(this._element);
    const openInstances = instances.filter((instance) => {
      return instance._mentionContainerId !== this._mentionContainerId && instance._isOpen === true;
    });

    if (openInstances.length > 0) return true;
    return false;
  }

  _listenToOpenedDropdownClick() {
    EventHandler.on(document, 'click', this._dropdownClickHandler);
  }

  _handleOpenedDropdownClick(event) {
    if (!this._isOpen) return;

    const { target } = event;

    const clickedInput = this._element && this._element.contains(target);
    const clickedMention = target === this._mentionContainer;
    const clickedMentionList = this._mentionContainer && this._mentionContainer.contains(target);

    if (!clickedInput && !clickedMention && !clickedMentionList) {
      this.close();
    } else if (clickedMention || clickedMentionList) {
      const clickedItem = SelectorEngine.closest(target, SELECTOR_MENTION_ITEM);
      this._activeItem = clickedItem;

      this._handleSelect();
    }
  }

  _listenToKeyDown() {
    EventHandler.on(this._element, 'keydown', this._keyDownHandler);
  }

  _handleKeyDown(event) {
    if (!this._isOpen) return;

    const key = event.keyCode;
    const isCloseKey = key === ESCAPE || (key === UP_ARROW && event.altKey);

    if (isCloseKey) {
      this.close();
      this._element.focus();
      return;
    }

    switch (key) {
      case TAB:
        this.close();
        break;
      case DOWN_ARROW:
        event.preventDefault();
        this._setActiveItem(this._activeItemIndex + 1);
        this._scrollToActiveItem();
        break;
      case UP_ARROW:
        event.preventDefault();
        this._setActiveItem(this._activeItemIndex - 1);
        this._scrollToActiveItem();
        break;
      case HOME:
        event.preventDefault();
        this._setActiveItem(0);
        this._scrollToActiveItem();
        break;
      case END:
        event.preventDefault();
        this._setActiveItem(this.mentionItems.length - 1);
        this._scrollToActiveItem();
        break;
      case ENTER:
        event.preventDefault();
        this._handleSelect();
        break;
      default:
        return;
    }
  }

  _handleDropdownCloseTransition(event) {
    // prevent from firing closing element twice
    // (transitionend event fires twice for both opacity and transform)
    // so we listen for only one of them to end
    if (event && event.propertyName === 'opacity' && this._isOpen) {
      this._isOpen = false;

      this._destroyMentionContainer();
    }
  }

  _destroyMentionContainer() {
    this._mentionContainer.parentNode.removeChild(this._mentionContainer);

    this._withTriggerValueStart = null;
    this._withTriggerValueEnd = null;

    this._popper.destroy();
    this._popper = null;

    this._mentionContainer = null;
  }

  _removeDropdownEvents() {
    EventHandler.off(document, 'click', this._dropdownClickHandler);
    EventHandler.off(this._element, 'keydown', this._keyDownHandler);
    EventHandler.off(this._mentionListContainer, 'transitionend', this._dropdownTransitionHandler);
    EventHandler.off(window, 'resize', this._resizeHandler);
  }

  _getFilteredItems(value) {
    return this._items.filter((item) => {
      return item[this._options.queryBy].toLowerCase().includes(value.toLowerCase());
    });
  }

  _openMention() {
    // get template string and put it ine the DOM, for popper
    const mentionTemplate = this._getMentionTemplate();
    document.body.insertAdjacentHTML('beforeend', mentionTemplate);

    // create selector from inserted HTML element for handling other selectors
    this._mentionContainer = SelectorEngine.findOne(`#${this._mentionContainerId}`);
    this._mentionListContainer = SelectorEngine.findOne(
      SELECTOR_MENTION_DROPDOWN,
      this._mentionContainer
    );
    this._mentionList = SelectorEngine.findOne(SELECTOR_MENTION_LIST, this._mentionContainer);
    this._updateMentionSize();

    this._popper = createPopper(this._element, this._mentionContainer, {
      placement: `${this._options.placement}`,
    });

    setTimeout(() => {
      Manipulator.addClass(this._mentionListContainer, 'open');
      this._popper.update();
      this._setActiveItem(0);
      this._scrollToActiveItem();
    }, 0);
  }

  _handleWindowResize() {
    if (this._mentionContainer) {
      this._updateMentionSize();
    }
  }

  _updateMentionSize() {
    const { offsetHeight, offsetWidth } = this._element;

    Manipulator.addStyle(this._mentionListContainer, {
      maxHeight: `${offsetHeight * this._options.visibleItems}px`,
    });
    Manipulator.addStyle(this._mentionContainer, { width: `${offsetWidth}px` });
  }

  _setActiveItem(index) {
    const newActiveItem = this.mentionItems[index];
    if (!newActiveItem) return;

    const currentActiveItem = this._activeItem;

    if (currentActiveItem) {
      Manipulator.removeClass(currentActiveItem, 'active');
    }

    Manipulator.addClass(newActiveItem, 'active');

    this._activeItemIndex = index;
    this._activeItem = newActiveItem;
  }

  _scrollToActiveItem() {
    if (!this._activeItem) return;

    const itemIndex = this.mentionItems.indexOf(this._activeItem);
    const itemHeight = this._activeItem.getBoundingClientRect().height;
    const itemOffset = itemIndex * itemHeight;

    const list = this._mentionListContainer;
    const listHeight = list.offsetHeight;
    const listScroll = list.scrollTop;

    const isBelow = itemOffset + itemHeight >= listHeight + listScroll;
    const isAbove = itemOffset < listScroll;

    if (isBelow) {
      list.scrollTop = itemOffset + itemHeight - listHeight;
    } else if (isAbove) {
      list.scrollTop = itemOffset;
    }
  }

  _handleSelect() {
    if (!this.mentionItems) return;

    const textNode = SelectorEngine.findOne(`.${CLASS_MENTION_ITEM_TEXT}`, this._activeItem);
    const textValue = textNode.textContent;

    this._updateInputValue(textValue);

    const [itemValue] = this._items.filter((el) => el[this._options.queryBy] === textValue);

    EventHandler.trigger(this._element, EVENT_ITEM_SELECTED, { value: itemValue });
    EventHandler.trigger(this._element, EVENT_VALUE_CHANGE, { value: textValue });

    this.close();
    this._element.focus();
  }

  _updateInputValue(text) {
    const { trigger } = this._options;
    const { value } = this._element;

    const withTrigger = value
      .substring(this._withTriggerValueStart, this._withTriggerValueEnd)
      .split(trigger);

    const preTrigger = value.substring(0, this._withTriggerValueStart).trimEnd();
    const newValue = `${withTrigger[0]} ${trigger}${text}`.trimStart();
    const postTrigger = value.substring(this._withTriggerValueEnd).trimStart();

    const newInputValue = `${preTrigger} ${newValue} ${postTrigger}`;

    this._element.value = newInputValue.trimStart();

    const caretPos =
      this._element.value.indexOf(`${withTrigger[0]} ${trigger}${text}`) + newValue.length + 2;
    this._element.setSelectionRange(caretPos, caretPos);
  }

  _updateMentionList(template) {
    if (this._mentionList) {
      this._mentionList.innerHTML = template;
      this._setActiveItem(0);
      this._popper.update();
    }
  }

  _highlightMatchingLetters(itemName, value) {
    // https://javascript.info/regexp-groups
    // allows to replace matched letters but considers original case sensitivity
    const matchingLetters = new RegExp(`(?<captureGroup>${value})`, 'gi');

    return itemName.replace(matchingLetters, '<strong>$<captureGroup></strong>');
  }

  _getMentionTemplate() {
    return `
      <div id="${this._mentionContainerId}" class="${CLASS_MENTION_DROPDOWN_CONTAINER}" >
        <div class="${CLASS_MENTION_DROPDOWN}">
          <div class="${CLASS_MENTION_ITEMS_LIST}"></div>
        </div>
      </div>
    `;
  }

  _itemsListTemplate(value = null) {
    return `${this._itemsList
      .map((item) => {
        const itemName = item[this._options.queryBy];
        return `
          <div class="${CLASS_MENTION_ITEM}">
            <span class="${CLASS_MENTION_ITEM_TEXT}">${
          value ? this._highlightMatchingLetters(itemName, value) : itemName
        }</span>
            ${
              this._options.showImg && item.image
                ? `<span class="${CLASS_MENTION_ITEM_IMAGE_CONTAINER}">
                    <img class="${CLASS_MENTION_ITEM_IMAGE} ${CLASS_ROUNDED_CIRCLE}" src=${
                    item.image
                  } alt=${item[this._options.queryBy]}>
                  </span>`
                : ''
            }
          </div>
        `;
      })
      .join('')}`;
  }

  _getNoResultsTemplate() {
    return `<div class="mention-no-results">${
      this._isLoading ? 'Loading...' : this._options.noResultsText
    }</div>`;
  }

  // Static

  static jQueryInterface(config, options) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose/.test(config)) {
        return;
      }

      if (!data) {
        data = new Mention(this, _config);
      }

      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config](options);
      }
    });
  }

  static getInstance(element) {
    return Data.getData(element, DATA_KEY);
  }
}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation - auto initialization
 * ------------------------------------------------------------------------
 */

SelectorEngine.find(SELECTOR_DATA_INIT).forEach((el) => {
  let instance = Mention.getInstance(el);
  const id = el.id;
  if (!instance && SelectorEngine.findOne(`.mention-data-items[data-mdb-target="${id}"]`)) {
    instance = new Mention(el);
  }
  return instance;
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .chart to jQuery only if jQuery is present
 */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = Mention.jQueryInterface;
    $.fn[NAME].Constructor = Mention;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Mention.jQueryInterface;
    };
  }
});

export default Mention;
