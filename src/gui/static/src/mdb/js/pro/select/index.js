import { createPopper } from '@popperjs/core';
import Data from '../../mdb/dom/data';
import EventHandler from '../../mdb/dom/event-handler';
import Manipulator from '../../mdb/dom/manipulator';
import SelectorEngine from '../../mdb/dom/selector-engine';
import { typeCheckConfig, getUID } from '../../mdb/util/index';
import Input from '../../free/input';
import SelectOption from './select-option';
import SelectionModel from './selection-model';
import { ESCAPE, ENTER, DOWN_ARROW, UP_ARROW, HOME, END, TAB } from '../../mdb/util/keycodes';
import allOptionsSelected from './util';
import {
  getWrapperTemplate,
  getDropdownTemplate,
  getOptionsListTemplate,
  getFakeValueTemplate,
} from './templates';
import BaseComponent from '../../free/base-component';
import { bindCallbackEventsIfNeeded } from '../../autoinit/init';

const Default = {
  autoSelect: false,
  container: 'body',
  clearButton: false,
  disabled: false,
  displayedLabels: 5,
  formWhite: false,
  multiple: false,
  optionsSelectedLabel: 'options selected',
  optionHeight: 38,
  selectAll: true,
  selectAllLabel: 'Select all',
  searchPlaceholder: 'Search...',
  size: 'default',
  visibleOptions: 5,
  filter: false,
  filterDebounce: 300,
  noResultText: 'No results',
  validation: false,
  validFeedback: 'Valid',
  invalidFeedback: 'Invalid',
  placeholder: '',
  filterFn: null,
};

const DefaultType = {
  autoSelect: 'boolean',
  container: 'string',
  clearButton: 'boolean',
  disabled: 'boolean',
  displayedLabels: 'number',
  formWhite: 'boolean',
  multiple: 'boolean',
  optionsSelectedLabel: 'string',
  optionHeight: 'number',
  selectAll: 'boolean',
  selectAllLabel: 'string',
  searchPlaceholder: 'string',
  size: 'string',
  visibleOptions: 'number',
  filter: 'boolean',
  filterDebounce: 'number',
  noResultText: 'string',
  validation: 'boolean',
  validFeedback: 'string',
  invalidFeedback: 'string',
  placeholder: '',
  filterFn: '(function|null)',
};

const NAME = 'select';
const DATA_KEY = 'mdb.select';

const EVENT_KEY = `.${DATA_KEY}`;
const EVENT_CLOSE = `close${EVENT_KEY}`;
const EVENT_OPEN = `open${EVENT_KEY}`;
const EVENT_SELECTED = `optionSelected${EVENT_KEY}`;
const EVENT_DESELECTED = `optionDeselected${EVENT_KEY}`;
const EVENT_VALUE_CHANGED = `valueChanged${EVENT_KEY}`;
const EVENT_CHANGE_NATIVE = 'change';
const EVENT_OPENED = `opened${EVENT_KEY}`;
const EVENT_CLOSED = `closed${EVENT_KEY}`;
const EVENT_SEARCH = `search${EVENT_KEY}`;

const SELECTOR_LABEL = '.select-label';
const SELECTOR_INPUT = '.select-input';
const SELECTOR_FILTER_INPUT = '.select-filter-input';
const SELECTOR_DROPDOWN = '.select-dropdown';
const SELECTOR_OPTIONS_WRAPPER = '.select-options-wrapper';
const SELECTOR_OPTIONS_LIST = '.select-options-list';
const SELECTOR_OPTION = '.select-option';
const SELECTOR_CLEAR_BUTTON = '.select-clear-btn';
const SELECTOR_CUSTOM_CONTENT = '.select-custom-content';
const SELECTOR_NO_RESULTS = '.select-no-results';
const SELECTOR_FORM_OUTLINE = '.form-outline';
const SELECTOR_TOGGLE = '[data-mdb-toggle]';

const CLASS_NAME_INITIALIZED = 'select-initialized';
const CLASS_NAME_OPEN = 'open';
const CLASS_NAME_ACTIVE = 'active';
const CLASS_NAME_FOCUSED = 'focused';
const CLASS_NAME_OPTION_GROUP_LABEL = 'select-option-group-label';
const CLASS_NAME_SELECT_ALL_OPTION = 'select-all-option';

const ANIMATION_TRANSITION_TIME = 200;

class Select extends BaseComponent {
  constructor(element, config) {
    super(element);

    this._config = this._getConfig(config);
    this._optionsToRender = this._getOptionsToRender(element);

    // optionsToRender may contain option groups and nested options, in this case
    // we need a list of plain options to manage selections and keyboard navigation
    this._plainOptions = this._getPlainOptions(this._optionsToRender);
    this._filteredOptionsList = null;

    this._selectionModel = new SelectionModel(this.multiple);

    this._activeOptionIndex = -1;
    this._activeOption = null;

    this._wrapperId = this._element.id
      ? `select-wrapper-${this._element.id}`
      : getUID('select-wrapper-');
    this._dropdownContainerId = this._element.id
      ? `select-dropdown-container-${this._element.id}`
      : getUID('select-dropdown-container-');
    this._selectAllId = this._element.id ? `select-all-${this._element.id}` : getUID('select-all-');
    this._debounceTimeoutId = null;

    this._dropdownHeight = this._config.optionHeight * this._config.visibleOptions;

    this._popper = null;
    this._input = null;
    this._label = SelectorEngine.next(this._element, SELECTOR_LABEL)[0];
    this._fakeValue = null;
    this._isFakeValueActive = false;
    this._customContent = SelectorEngine.next(element, SELECTOR_CUSTOM_CONTENT)[0];
    this._toggleButton = null;
    this._elementToggle = null;

    this._wrapper = null;
    this._inputEl = null;
    this._dropdownContainer = null;
    this._container = null;
    this._selectAllOption = null;

    this._init();

    this._mutationObserver = null;
    this._isOpen = false;

    this._addMutationObserver();
    Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
    bindCallbackEventsIfNeeded(this.constructor);
  }

  static get NAME() {
    return NAME;
  }

  get filterInput() {
    return SelectorEngine.findOne(SELECTOR_FILTER_INPUT, this._dropdownContainer);
  }

  get dropdown() {
    return SelectorEngine.findOne(SELECTOR_DROPDOWN, this._dropdownContainer);
  }

  get optionsList() {
    return SelectorEngine.findOne(SELECTOR_OPTIONS_LIST, this._dropdownContainer);
  }

  get optionsWrapper() {
    return SelectorEngine.findOne(SELECTOR_OPTIONS_WRAPPER, this._dropdownContainer);
  }

  get clearButton() {
    return SelectorEngine.findOne(SELECTOR_CLEAR_BUTTON, this._wrapper);
  }

  get options() {
    return this._filteredOptionsList ? this._filteredOptionsList : this._plainOptions;
  }

  get value() {
    return this.multiple ? this._selectionModel.values : this._selectionModel.value;
  }

  get multiple() {
    return this._config.multiple;
  }

  get hasSelectAll() {
    return this.multiple && this._config.selectAll;
  }

  get hasSelection() {
    return this._selectionModel.selection || this._selectionModel.selections.length > 0;
  }

  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._element);

    config = {
      ...Default,
      ...dataAttributes,
      ...config,
    };

    if (this._element.hasAttribute('multiple')) {
      config.multiple = true;
    }

    if (this._element.hasAttribute('disabled')) {
      config.disabled = true;
    }

    if (this._element.tabIndex) {
      config.tabIndex = this._element.getAttribute('tabIndex');
    }

    typeCheckConfig(NAME, config, DefaultType);

    return config;
  }

  _getOptionsToRender(select) {
    const options = [];

    const nodes = select.childNodes;

    nodes.forEach((node) => {
      if (node.nodeName === 'OPTGROUP') {
        const optionGroup = {
          id: node.id ? `group-${node.id}` : getUID('group-'),
          label: node.label,
          disabled: node.hasAttribute('disabled'),
          hidden: node.hasAttribute('hidden'),
          options: [],
        };
        const groupOptions = node.childNodes;
        groupOptions.forEach((option) => {
          if (option.nodeName === 'OPTION') {
            optionGroup.options.push(this._createOptionObject(option, optionGroup));
          }
        });
        options.push(optionGroup);
      } else if (node.nodeName === 'OPTION') {
        options.push(this._createOptionObject(node));
      }
    });
    return options;
  }

  _getPlainOptions(optionsToRender) {
    const hasOptionGroup = SelectorEngine.findOne('optgroup', this._element);

    if (!hasOptionGroup) {
      return optionsToRender;
    }

    const options = [];

    optionsToRender.forEach((option) => {
      const isOptionGroup = option.hasOwnProperty('options');
      if (isOptionGroup) {
        option.options.forEach((nestedOption) => {
          options.push(nestedOption);
        });
      } else {
        options.push(option);
      }
    });

    return options;
  }

  _createOptionObject(nativeOption, group = {}) {
    const id = nativeOption.id ? `option-${nativeOption.id}` : getUID('option-');
    const groupId = group.id ? group.id : null;
    const groupDisabled = group.disabled ? group.disabled : false;
    const selected = nativeOption.selected || nativeOption.hasAttribute('selected');
    const disabled = nativeOption.hasAttribute('disabled') || groupDisabled;
    const hidden = nativeOption.hasAttribute('hidden') || (group && group.hidden);
    const multiple = this.multiple;
    const value = nativeOption.value;
    const label = nativeOption.label;
    const secondaryText = Manipulator.getDataAttribute(nativeOption, 'secondaryText');
    const icon = Manipulator.getDataAttribute(nativeOption, 'icon');
    return new SelectOption(
      id,
      nativeOption,
      multiple,
      value,
      label,
      selected,
      disabled,
      hidden,
      secondaryText,
      groupId,
      icon
    );
  }

  _getNavigationOptions() {
    const availableOptions = this.options.filter((option) => !option.hidden);

    return this.hasSelectAll ? [this._selectAllOption, ...availableOptions] : availableOptions;
  }

  _init() {
    this._renderMaterialWrapper();

    this._wrapper = SelectorEngine.findOne(`#${this._wrapperId}`);
    this._input = SelectorEngine.findOne(SELECTOR_INPUT, this._wrapper);

    if (this._element.getAttribute('autocomplete') === 'off') {
      this._input.setAttribute('autocomplete', 'off');
    }
    const containerSelector = this._config.container;

    if (containerSelector === 'body') {
      this._container = document.body;
    } else {
      this._container = SelectorEngine.findOne(containerSelector);
    }

    this._initOutlineInput();
    this._setDefaultSelections();
    this._updateInputValue();
    this._appendFakeValue();
    this._updateFakeLabelPosition();
    this._updateLabelPosition();
    this._updateClearButtonVisibility();

    this._bindComponentEvents();

    if (this.hasSelectAll) {
      this._selectAllOption = this._createSelectAllOption();
    }

    this._dropdownContainer = getDropdownTemplate(
      this._dropdownContainerId,
      this._config,
      this._input.offsetWidth,
      this._dropdownHeight,
      this._selectAllOption,
      this._optionsToRender,
      this._customContent
    );

    this._setFirstActiveOption();
  }

  _renderMaterialWrapper() {
    const template = getWrapperTemplate(this._wrapperId, this._config, this._label);
    this._element.parentNode.insertBefore(template, this._element);
    Manipulator.addClass(this._element, CLASS_NAME_INITIALIZED);
    template.appendChild(this._element);
  }

  _initOutlineInput() {
    const inputWrapper = SelectorEngine.findOne(SELECTOR_FORM_OUTLINE, this._wrapper);
    const outlineInput = new Input(inputWrapper);
    outlineInput.init();
  }

  _bindComponentEvents() {
    this._listenToComponentKeydown();
    this._listenToWrapperClick();
    if (!this._config.disabled) {
      this._listenToClearBtnClick();
      this._listenToClearBtnKeydown();
    }
  }

  _setDefaultSelections() {
    this.options.forEach((option) => {
      if (option.selected) {
        this._selectionModel.select(option);
      }
    });
  }

  _listenToComponentKeydown() {
    EventHandler.on(this._wrapper, 'keydown', this._handleKeydown.bind(this));
  }

  _handleKeydown(event) {
    if (this._isOpen && !this._config.filter) {
      this._handleOpenKeydown(event);
    } else {
      this._handleClosedKeydown(event);
    }
  }

  _handleOpenKeydown(event) {
    const key = event.keyCode;
    const isCloseKey =
      key === ESCAPE || ((key === UP_ARROW || key === DOWN_ARROW) && event.altKey) || key === TAB;

    if (key === TAB && this._config.autoSelect && !this.multiple) {
      this._handleAutoSelection(this._activeOption);
    }

    if (isCloseKey) {
      this.close();
      this._input.focus();
      return;
    }

    switch (key) {
      case DOWN_ARROW:
        this._setNextOptionActive();
        this._scrollToOption(this._activeOption);
        break;
      case UP_ARROW:
        this._setPreviousOptionActive();
        this._scrollToOption(this._activeOption);
        break;
      case HOME:
        this._setFirstOptionActive();
        this._scrollToOption(this._activeOption);
        break;
      case END:
        this._setLastOptionActive();
        this._scrollToOption(this._activeOption);
        break;
      case ENTER:
        event.preventDefault();
        if (this._activeOption) {
          if (this.hasSelectAll && this._activeOptionIndex === 0) {
            this._handleSelectAll();
          } else {
            this._handleSelection(this._activeOption);
          }
        }
        return;
      default:
        return;
    }

    event.preventDefault();
  }

  _handleClosedKeydown(event) {
    const key = event.keyCode;
    if (key === ENTER) {
      event.preventDefault();
    }
    const isOpenKey =
      key === ENTER ||
      ((key === DOWN_ARROW || key === UP_ARROW) && event.altKey) ||
      (key === DOWN_ARROW && this.multiple);

    if (isOpenKey) {
      this.open();
    }

    if (!this.multiple) {
      switch (key) {
        case DOWN_ARROW:
          if (event.altKey) return;
          this._setNextOptionActive();
          this._handleSelection(this._activeOption);
          break;
        case UP_ARROW:
          if (event.altKey) return;
          this._setPreviousOptionActive();
          this._handleSelection(this._activeOption);
          break;
        case HOME:
          this._setFirstOptionActive();
          this._handleSelection(this._activeOption);
          break;
        case END:
          this._setLastOptionActive();
          this._handleSelection(this._activeOption);
          break;
        default:
          return;
      }
    } else {
      switch (key) {
        case DOWN_ARROW:
          this.open();
          break;
        case UP_ARROW:
          this.open();
          break;
        default:
          return;
      }
    }

    event.preventDefault();
  }

  _scrollToOption(option) {
    if (!option) {
      return;
    }

    let optionIndex;

    const visibleOptions = this.options.filter((option) => !option.hidden);

    if (this.hasSelectAll) {
      optionIndex = visibleOptions.indexOf(option) + 1;
    } else {
      optionIndex = visibleOptions.indexOf(option);
    }

    const groupsNumber = this._getNumberOfGroupsBeforeOption(optionIndex);

    const scrollToIndex = optionIndex + groupsNumber;

    const list = this.optionsWrapper;
    const listHeight = list.offsetHeight;
    const optionHeight = this._config.optionHeight;
    const scrollTop = list.scrollTop;

    if (optionIndex > -1) {
      const optionOffset = scrollToIndex * optionHeight;
      const isBelow = optionOffset + optionHeight > scrollTop + listHeight;
      const isAbove = optionOffset < scrollTop;

      if (isAbove) {
        list.scrollTop = optionOffset;
      } else if (isBelow) {
        list.scrollTop = optionOffset - listHeight + optionHeight;
      } else {
        list.scrollTop = scrollTop;
      }
    }
  }

  _getNumberOfGroupsBeforeOption(optionIndex) {
    const optionsList = this.options.filter((option) => !option.hidden);
    const groupsList = this._optionsToRender.filter((group) => !group.hidden);
    const index = this.hasSelectAll ? optionIndex - 1 : optionIndex;
    let groupsNumber = 0;

    for (let i = 0; i <= index; i++) {
      if (
        optionsList[i].groupId &&
        groupsList[groupsNumber] &&
        groupsList[groupsNumber].id &&
        optionsList[i].groupId === groupsList[groupsNumber].id
      ) {
        groupsNumber++;
      }
    }

    return groupsNumber;
  }

  _setNextOptionActive() {
    let index = this._activeOptionIndex + 1;
    const options = this._getNavigationOptions();

    if (!options[index]) {
      return;
    }

    while (options[index].disabled) {
      index += 1;

      if (!options[index]) {
        return;
      }
    }

    this._updateActiveOption(options[index], index);
  }

  _setPreviousOptionActive() {
    let index = this._activeOptionIndex - 1;
    const options = this._getNavigationOptions();

    if (!options[index]) {
      return;
    }

    while (options[index].disabled) {
      index -= 1;

      if (!options[index]) {
        return;
      }
    }

    this._updateActiveOption(options[index], index);
  }

  _setFirstOptionActive() {
    const index = 0;
    const options = this._getNavigationOptions();

    this._updateActiveOption(options[index], index);
  }

  _setLastOptionActive() {
    const options = this._getNavigationOptions();
    const index = options.length - 1;

    this._updateActiveOption(options[index], index);
  }

  _updateActiveOption(newActiveOption, index) {
    const currentActiveOption = this._activeOption;

    if (currentActiveOption) {
      currentActiveOption.removeActiveStyles();
    }

    newActiveOption.setActiveStyles();
    this._activeOptionIndex = index;
    this._activeOption = newActiveOption;
  }

  _listenToWrapperClick() {
    EventHandler.on(this._wrapper, 'click', () => {
      this.toggle();
    });
  }

  _listenToClearBtnClick() {
    EventHandler.on(this.clearButton, 'click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this._handleClear();
    });
  }

  _listenToClearBtnKeydown() {
    EventHandler.on(this.clearButton, 'keydown', (event) => {
      if (event.keyCode === ENTER) {
        this._handleClear();
        event.preventDefault();
        event.stopPropagation();
      }
    });
  }

  _handleClear() {
    if (this.multiple) {
      this._selectionModel.clear();
      this._deselectAllOptions(this.options);

      if (this.hasSelectAll) {
        this._updateSelectAllState();
      }
    } else {
      const selected = this._selectionModel.selection;
      this._selectionModel.clear();
      selected.deselect();
    }

    if (this._optionsToRender[0].hidden === true) {
      this._singleOptionSelect(this._optionsToRender[0]);
    } else {
      this._emitValueChangeEvent(null);
      this._emitNativeChangeEvent();
    }

    this._updateInputValue();
    this._updateFakeLabelPosition();
    this._updateLabelPosition();
    this._updateClearButtonVisibility();
  }

  _listenToOptionsClick() {
    EventHandler.on(this.optionsWrapper, 'click', (event) => {
      const optionGroupLabel = event.target.classList.contains(CLASS_NAME_OPTION_GROUP_LABEL);

      if (optionGroupLabel) {
        return;
      }

      const target =
        event.target.nodeName === 'DIV'
          ? event.target
          : SelectorEngine.closest(event.target, SELECTOR_OPTION);
      const selectAllOption = target.classList.contains(CLASS_NAME_SELECT_ALL_OPTION);

      if (selectAllOption) {
        this._handleSelectAll();
        return;
      }

      const id = target.dataset.mdbId;
      const option = this.options.find((option) => option.id === id);

      if (option && !option.disabled) {
        this._handleSelection(option);
      }
    });
  }

  _handleSelectAll() {
    const selected = this._selectAllOption.selected;

    if (selected) {
      this._deselectAllOptions(this.options);
      this._selectAllOption.deselect();
    } else {
      this._selectAllOptions(this.options);
      this._selectAllOption.select();
    }

    this._updateInputValue();
    this._updateFakeLabelPosition();
    this._updateLabelPosition();
    this._updateClearButtonVisibility();

    this._emitValueChangeEvent(this.value);
    this._emitNativeChangeEvent();
  }

  _selectAllOptions(options) {
    options.forEach((option) => {
      if (!option.selected && !option.disabled) {
        this._selectionModel.select(option);
        option.select();
      }
    });
  }

  _deselectAllOptions(options) {
    options.forEach((option) => {
      if (option.selected && !option.disabled) {
        this._selectionModel.deselect(option);
        option.deselect();
      }
    });
  }

  _handleSelection(option) {
    if (this.multiple) {
      this._handleMultiSelection(option);

      if (this.hasSelectAll) {
        this._updateSelectAllState();
      }
    } else {
      this._handleSingleSelection(option);
    }

    this._updateInputValue();
    this._updateFakeLabelPosition();
    this._updateLabelPosition();
    this._updateClearButtonVisibility();
  }

  _handleAutoSelection(option) {
    this._singleOptionSelect(option);
    this._updateInputValue();
    this._updateFakeLabelPosition();
    this._updateLabelPosition();
    this._updateClearButtonVisibility();
  }

  _handleSingleSelection(option) {
    this._singleOptionSelect(option);
    this.close();
    this._input.focus();
  }

  _singleOptionSelect(option) {
    const currentSelected = this._selectionModel.selections[0];

    if (currentSelected && currentSelected !== option) {
      this._selectionModel.deselect(currentSelected);
      currentSelected.deselect();
      currentSelected.node.setAttribute('selected', false);
      EventHandler.trigger(this._element, EVENT_DESELECTED, { value: currentSelected.value });
    }

    if (!currentSelected || (currentSelected && option !== currentSelected)) {
      this._selectionModel.select(option);
      option.select();
      option.node.setAttribute('selected', true);
      EventHandler.trigger(this._element, EVENT_SELECTED, { value: option.value });
      this._emitValueChangeEvent(this.value);
      this._emitNativeChangeEvent();
    }
  }

  _handleMultiSelection(option) {
    if (option.selected) {
      this._selectionModel.deselect(option);
      option.deselect();
      option.node.setAttribute('selected', false);
      EventHandler.trigger(this._element, EVENT_DESELECTED, { value: option.value });
    } else {
      this._selectionModel.select(option);
      option.select();
      option.node.setAttribute('selected', true);
      EventHandler.trigger(this._element, EVENT_SELECTED, { value: option.value });
    }

    this._emitValueChangeEvent(this.value);
    this._emitNativeChangeEvent();
  }

  _emitValueChangeEvent(value) {
    EventHandler.trigger(this._element, EVENT_VALUE_CHANGED, { value });
  }

  _emitNativeChangeEvent() {
    EventHandler.trigger(this._element, EVENT_CHANGE_NATIVE);
  }

  _updateInputValue() {
    const labels = this.multiple ? this._selectionModel.labels : this._selectionModel.label;
    let value;

    if (
      this.multiple &&
      this._config.displayedLabels !== -1 &&
      this._selectionModel.selections.length > this._config.displayedLabels
    ) {
      value = `${this._selectionModel.selections.length} ${this._config.optionsSelectedLabel}`;
    } else {
      value = labels;
    }

    if (!this.multiple && !this._isSelectionValid(this._selectionModel.selection)) {
      this._input.value = '';
    } else if (this._isLabelEmpty(this._selectionModel.selection)) {
      this._input.value = ' ';
    } else if (value) {
      this._input.value = value;
    } else {
      // prettier-ignore
      // eslint-disable-next-line
      this.multiple || !this._optionsToRender[0] ? (this._input.value = '') : (this._input.value = this._optionsToRender[0].label);
    }
  }

  _isSelectionValid(selection) {
    if (selection && (selection.disabled || selection.value === '')) {
      return false;
    }

    return true;
  }

  _isLabelEmpty(selection) {
    if (selection && selection.label === '') {
      return true;
    }

    return false;
  }

  _appendFakeValue() {
    if (!this._selectionModel.selection || this._selectionModel._multiple) {
      return;
    }

    const value = this._selectionModel.selection.label;
    this._fakeValue = getFakeValueTemplate(value);
    const inputWrapper = SelectorEngine.findOne(SELECTOR_FORM_OUTLINE, this._wrapper);
    inputWrapper.appendChild(this._fakeValue);
  }

  _updateLabelPosition() {
    const isInitialized = Manipulator.hasClass(this._element, CLASS_NAME_INITIALIZED);
    const isValueEmpty = this._input.value !== '';
    if (!this._label) {
      return;
    }

    if (isInitialized && (isValueEmpty || this._isOpen || this._isFakeValueActive)) {
      Manipulator.addClass(this._label, CLASS_NAME_ACTIVE);
    } else {
      Manipulator.removeClass(this._label, CLASS_NAME_ACTIVE);
    }
  }

  _updateLabelPositionWhileClosing() {
    if (!this._label) {
      return;
    }

    if (this._input.value !== '' || this._isFakeValueActive) {
      Manipulator.addClass(this._label, CLASS_NAME_ACTIVE);
    } else {
      Manipulator.removeClass(this._label, CLASS_NAME_ACTIVE);
    }
  }

  _updateFakeLabelPosition() {
    if (!this._fakeValue) {
      return;
    }

    if (this.hasSelection) {
      this._fakeValue.textContent = this.hasSelection.label;
    }

    if (this._input.value === '' && this._fakeValue.innerHTML !== '') {
      this._isFakeValueActive = true;
      Manipulator.addClass(this._fakeValue, CLASS_NAME_ACTIVE);
    } else {
      this._isFakeValueActive = false;
      Manipulator.removeClass(this._fakeValue, CLASS_NAME_ACTIVE);
    }
  }

  _updateClearButtonVisibility() {
    if (!this.clearButton) {
      return;
    }

    const hasSelection =
      this._selectionModel.selection || this._selectionModel.selections.length > 0;

    if (hasSelection) {
      Manipulator.addStyle(this.clearButton, { display: 'block' });
    } else {
      Manipulator.addStyle(this.clearButton, { display: 'none' });
    }
  }

  _updateSelectAllState() {
    const selectAllSelected = this._selectAllOption.selected;
    const allSelected = allOptionsSelected(this.options);
    if (!allSelected && selectAllSelected) {
      this._selectAllOption.deselect();
    } else if (allSelected && !selectAllSelected) {
      this._selectAllOption.select();
    }
  }

  toggle() {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    const isDisabled = this._config.disabled;
    const openEvent = EventHandler.trigger(this._element, EVENT_OPEN);

    if (this._isOpen || isDisabled || openEvent.defaultPrevented) {
      return;
    }

    this._openDropdown();
    this._updateDropdownWidth();
    this._setFirstActiveOption();
    this._scrollToOption(this._activeOption);

    if (this._config.filter) {
      // We need to wait for popper initialization, otherwise
      // dates container will be focused before popper position
      // update which can change the scroll position on the page
      setTimeout(() => {
        this.filterInput.focus();
      }, 0);

      this._listenToSelectSearch();

      // New listener for dropdown navigation is needed, because
      // we focus search input inside dropdown template, which is
      // appended to the body. In this case listener attached to the
      // select wrapper won't work
      this._listenToDropdownKeydown();
    }

    this._listenToOptionsClick();
    this._listenToOutsideClick();
    this._listenToWindowResize();

    this._isOpen = true;
    this._input.setAttribute('aria-expanded', true);
    EventHandler.trigger(this._element, EVENT_OPENED);

    this._updateLabelPosition();
    this._setInputActiveStyles();
  }

  _openDropdown() {
    this._popper = createPopper(this._input, this._dropdownContainer, {
      placement: 'bottom-start',
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

    // We need to add delay to wait for the popper initialization
    // and position update
    setTimeout(() => {
      Manipulator.addClass(this.dropdown, CLASS_NAME_OPEN);
    }, 0);
  }

  _updateDropdownWidth() {
    const inputWidth = this._input.offsetWidth;
    Manipulator.addStyle(this._dropdownContainer, { width: `${inputWidth}px` });
  }

  _setFirstActiveOption() {
    const options = this._getNavigationOptions();
    const currentActive = this._activeOption;

    if (currentActive) {
      currentActive.removeActiveStyles();
    }

    const firstSelected = this.multiple
      ? this._selectionModel.selections[0]
      : this._selectionModel.selection;

    if (firstSelected) {
      this._activeOption = firstSelected;
      firstSelected.setActiveStyles();
      this._activeOptionIndex = options.findIndex((option) => option === firstSelected);
    } else {
      this._activeOption = null;
      this._activeOptionIndex = -1;
    }
  }

  _setInputActiveStyles() {
    Manipulator.addClass(this._input, CLASS_NAME_FOCUSED);
  }

  _listenToWindowResize() {
    EventHandler.on(window, 'resize', this._handleWindowResize.bind(this));
  }

  _handleWindowResize() {
    if (this._dropdownContainer) {
      this._updateDropdownWidth();
    }
  }

  _listenToSelectSearch() {
    this.filterInput.addEventListener('input', (event) => {
      const searchTerm = event.target.value;
      const debounceTime = this._config.filterDebounce;
      const searchEvent = EventHandler.trigger(this._element, EVENT_SEARCH, { value: searchTerm });

      if (searchEvent.defaultPrevented) {
        return;
      }

      this._debounceFilter(searchTerm, debounceTime);
    });
  }

  _debounceFilter(searchTerm, debounceTime) {
    if (this._debounceTimeoutId) {
      clearTimeout(this._debounceTimeoutId);
    }

    this._debounceTimeoutId = setTimeout(() => {
      this._filterOptions(searchTerm);
    }, debounceTime);
  }

  _filterOptions(searchTerm) {
    const filtered = [];
    const filterFn = this._config.filterFn;

    this._optionsToRender.forEach((option) => {
      const isOptionGroup = option.hasOwnProperty('options');
      const isValidOption =
        !isOptionGroup && option.label.toLowerCase().includes(searchTerm.toLowerCase());
      const group = {};

      if (isOptionGroup) {
        group.label = option.label;
        group.options = this._filter(searchTerm, option.options);

        if (group.options.length > 0) {
          filtered.push(group);
        }
      }

      if (filterFn && !isOptionGroup) {
        const customSearchResult = filterFn(searchTerm, option);
        if (customSearchResult) {
          filtered.push(option);
        }
      } else if (isValidOption) {
        filtered.push(option);
      }
    });

    const hasNoResultsText = this._config.noResultText !== '';
    const hasFilteredOptions = filtered.length !== 0;

    if (hasFilteredOptions) {
      this._updateOptionsListTemplate(filtered);
      this._popper.forceUpdate();
      this._filteredOptionsList = this._getPlainOptions(filtered);

      if (this.hasSelectAll) {
        this._updateSelectAllState();
      }

      this._setFirstActiveOption();
    } else if (!hasFilteredOptions && hasNoResultsText) {
      const noResultsTemplate = this._getNoResultTemplate();
      this.optionsWrapper.innerHTML = noResultsTemplate;
    }
  }

  _updateOptionsListTemplate(optionsToRender) {
    const optionsWrapperContent =
      SelectorEngine.findOne(SELECTOR_OPTIONS_LIST, this._dropdownContainer) ||
      SelectorEngine.findOne(SELECTOR_NO_RESULTS, this._dropdownContainer);

    const optionsListTemplate = getOptionsListTemplate(
      optionsToRender,
      this._selectAllOption,
      this._config
    );
    this.optionsWrapper.removeChild(optionsWrapperContent);
    this.optionsWrapper.appendChild(optionsListTemplate);
  }

  _getNoResultTemplate() {
    return `<div class="select-no-results" style="height: ${this._config.optionHeight}px">${this._config.noResultText}</div>`;
  }

  _filter(value, options) {
    const filterFn = this._config.filterFn;
    if (filterFn) {
      return options.filter((option) => filterFn(value, option));
    }
    const filterValue = value.toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(filterValue));
  }

  _listenToDropdownKeydown() {
    EventHandler.on(this.dropdown, 'keydown', this._handleOpenKeydown.bind(this));
  }

  _listenToOutsideClick() {
    this._outsideClick = this._handleOutSideClick.bind(this);
    EventHandler.on(document, 'click', this._outsideClick);
  }

  _handleOutSideClick(event) {
    const isSelectContent = this._wrapper && this._wrapper.contains(event.target);
    const isDropdown = event.target === this._dropdownContainer;
    const isDropdownContent =
      this._dropdownContainer && this._dropdownContainer.contains(event.target);

    let isButton;
    if (!this._toggleButton) {
      this._elementToggle = SelectorEngine.find(SELECTOR_TOGGLE);
    }
    if (this._elementToggle) {
      this._elementToggle.forEach((button) => {
        const attributes = Manipulator.getDataAttribute(button, 'toggle');
        if (attributes === this._element.id || this._element.classList.contains(attributes)) {
          this._toggleButton = button;
          isButton = this._toggleButton.contains(event.target);
        }
      });
    }

    if (!isSelectContent && !isDropdown && !isDropdownContent && !isButton) {
      this.close();
    }
  }

  close() {
    const closeEvent = EventHandler.trigger(this._element, EVENT_CLOSE);

    if (!this._isOpen || closeEvent.defaultPrevented) {
      return;
    }

    if (this._config.filter && this.hasSelectAll) {
      this._resetFilterState();
      this._updateOptionsListTemplate(this._optionsToRender);
      if (this._config.multiple) {
        this._updateSelectAllState();
      }
    }

    this._removeDropdownEvents();

    Manipulator.removeClass(this.dropdown, CLASS_NAME_OPEN);

    setTimeout(() => {
      Manipulator.removeClass(this._input, CLASS_NAME_FOCUSED);
      if (this._label && !this.hasSelection) {
        Manipulator.removeClass(this._label, CLASS_NAME_ACTIVE);
        Manipulator.removeClass(this._input, CLASS_NAME_ACTIVE);
      }
      this._updateLabelPositionWhileClosing();
    }, 0);

    setTimeout(() => {
      if (this._container && this._dropdownContainer.parentNode === this._container) {
        this._container.removeChild(this._dropdownContainer);
      }
      this._popper.destroy();
      this._isOpen = false;
      this._input.setAttribute('aria-expanded', false);
      EventHandler.off(this.dropdown, 'transitionend');
      EventHandler.trigger(this._element, EVENT_CLOSED);
    }, ANIMATION_TRANSITION_TIME);
  }

  _resetFilterState() {
    this.filterInput.value = '';
    this._filteredOptionsList = null;
  }

  _removeDropdownEvents() {
    EventHandler.off(document, 'click', this._outsideClick);

    if (this._config.filter) {
      EventHandler.off(this.dropdown, 'keydown');
    }

    EventHandler.off(this.optionsWrapper, 'click');
  }

  _addMutationObserver() {
    this._mutationObserver = new MutationObserver(() => {
      if (this._wrapper) {
        this._updateSelections();
        this._updateDisabledState();
      }
    });

    this._observeMutationObserver();
  }

  _updateSelections() {
    this._optionsToRender = this._getOptionsToRender(this._element);
    this._plainOptions = this._getPlainOptions(this._optionsToRender);
    this._selectionModel.clear();
    this._setDefaultSelections();
    this._updateInputValue();
    this._updateFakeLabelPosition();
    this._updateLabelPosition();
    this._updateClearButtonVisibility();

    if (this.hasSelectAll) {
      this._updateSelectAllState();
    }

    const hasFilterValue = this._config.filter && this.filterInput && this.filterInput.value;

    if (this._isOpen && !hasFilterValue) {
      this._updateOptionsListTemplate(this._optionsToRender);
      this._setFirstActiveOption();
    } else if (this._isOpen && hasFilterValue) {
      this._filterOptions(this.filterInput.value);
      this._setFirstActiveOption();
    } else {
      this._dropdownContainer = getDropdownTemplate(
        this._dropdownContainerId,
        this._config,
        this._input.offsetWidth,
        this._dropdownHeight,
        this._selectAllOption,
        this._optionsToRender,
        this._customContent
      );
    }
  }

  _updateDisabledState() {
    const input = SelectorEngine.findOne(SELECTOR_INPUT, this._wrapper);

    if (this._element.hasAttribute('disabled')) {
      this._config.disabled = true;
      input.setAttribute('disabled', '');
    } else {
      this._config.disabled = false;
      input.removeAttribute('disabled');
    }
  }

  _observeMutationObserver() {
    if (!this._mutationObserver) {
      return;
    }

    this._mutationObserver.observe(this._element, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  _disconnectMutationObserver() {
    if (this._mutationObserver) {
      this._mutationObserver.disconnect();
      this._mutationObserver = null;
    }
  }

  _createSelectAllOption() {
    const id = this._selectAllId;
    const nativeOption = null;
    const multiple = true;
    const value = 'select-all';
    const label = this._config.selectAllLabel;
    const selected = allOptionsSelected(this.options);
    const disabled = false;
    const hidden = false;
    const secondaryText = null;
    const groupId = null;
    const icon = null;

    return new SelectOption(
      id,
      nativeOption,
      multiple,
      value,
      label,
      selected,
      disabled,
      hidden,
      secondaryText,
      groupId,
      icon
    );
  }

  dispose() {
    this._disconnectMutationObserver();
    this._removeComponentEvents();

    this._disconnectMutationObserver();

    this._destroyMaterialSelect();
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    super.dispose();
  }

  _removeComponentEvents() {
    EventHandler.off(this.input, 'click');
    EventHandler.off(this.wrapper, this._handleKeydown.bind(this));
    EventHandler.off(this.clearButton, 'click');
    EventHandler.off(this.clearButton, 'keydown');
    EventHandler.off(window, 'resize', this._handleWindowResize.bind(this));
  }

  _destroyMaterialSelect() {
    if (this._isOpen) {
      this.close();
    }

    this._destroyMaterialTemplate();
  }

  _destroyMaterialTemplate() {
    const wrapperParent = this._wrapper.parentNode;
    const labels = SelectorEngine.find('label', this._wrapper);

    wrapperParent.appendChild(this._element);
    labels.forEach((label) => {
      wrapperParent.appendChild(label);
    });

    labels.forEach((label) => {
      Manipulator.removeClass(label, CLASS_NAME_ACTIVE);
    });
    Manipulator.removeClass(this._element, CLASS_NAME_INITIALIZED);

    // restore custom content removed on init
    if (this._customContent) {
      wrapperParent.appendChild(this._customContent);
    }

    wrapperParent.removeChild(this._wrapper);
  }

  setValue(value) {
    this.options
      .filter((option) => option.selected)
      .forEach((selection) => (selection.nativeOption.selected = false));

    const isMultipleValue = Array.isArray(value);

    if (isMultipleValue) {
      value.forEach((selectionValue) => {
        this._selectByValue(selectionValue);
      });
    } else {
      this._selectByValue(value);
    }

    this._updateSelections();
    this._emitValueChangeEvent(value);
  }

  _selectByValue(value) {
    const correspondingOption = this.options.find((option) => option.value === value);
    if (!correspondingOption) {
      return false;
    }
    correspondingOption.nativeOption.selected = true;
    return true;
  }

  static jQueryInterface(config, options) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose/.test(config)) {
        return;
      }

      if (!data) {
        data = new Select(this, _config);
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

export default Select;
