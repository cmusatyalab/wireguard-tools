/* eslint-disable no-fallthrough */
import { typeCheckConfig, getjQuery, onDOMContentLoaded } from './mdb/util/index';
import Data from './mdb/dom/data';
import Manipulator from './mdb/dom/manipulator';
import EventHandler from './mdb/dom/event-handler';
import SelectorEngine from './mdb/dom/selector-engine';

import create from './templates';
/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'wysiwyg';
const DATA_KEY = `mdb.${NAME}`;
const EVENT_KEY = `.${DATA_KEY}`;

const CONTENT_CLASS = `${NAME}-content`;
const TOOLBAR_CLASS = `${NAME}-toolbar`;
const TOOLBAR_TOGGLER_CLASS = `${NAME}-toolbar-toggler`;
const TOOLBAR_GROUP_CLASS = `${NAME}-toolbar-group`;
const HIDE_CLASS = `${NAME}-hide`;
const SHOW_HTML_CLASS = `${NAME}-show-html`;
const ACTIVE_CLASS = 'active';

const EVENT_RESIZE = `resize${EVENT_KEY}`;
const EVENT_CLICK = `click${EVENT_KEY}`;
const EVENT_MOUSEDOWN = `mousedown${EVENT_KEY}`;
const EVENT_DROPDOWN_HIDE = 'hide.bs.dropdown';
const EVENT_DROPDOWN_SHOW = 'show.bs.dropdown';
const EVENT_BLUR = 'blur';
const EVENT_MOUSE_ENTER = 'mouseenter';
const EVENT_MOUSE_LEAVE = 'mouseleave';
const EVENT_INPUT = 'input';

const SELECTOR_DATA_INIT = '[data-mdb-wysiwyg-init]';

const SELECTOR_COMMAND = '[data-mdb-cmd]';
const SELECTOR_FORM_OUTLINE = '.form-outline';
const SELECTOR_DROPDOWN = '.dropdown';
const SELECTOR_DROPDOWN_MENU = '.dropdown-menu';
const SELECTOR_DROPDOWN_TOGGLE = '.dropdown-toggle';
const SELECTOR_INPUT_TYPE_URL = '[type="url"]';
const SELECTOR_INPUT_TYPE_TEXT = '[type="text"]';
const SELECTOR_TEXTAREA = '.wysiwyg-textarea';
const SELECTOR_INPUT = 'input';
const SELECTOR_DIV = 'div';
const SELECTOR_SHOW = 'show';
const SELECTOR_LINKS_SECTION = '#links-section';
const SELECTOR_DATA_TOGGLE_DROPDOWN = '[data-mdb-dropdown-init]';
const SELECTOR_DATA_TOOLTIP = '[data-mdb-tooltip-init]';
const SELECTOR_WYSIWYG = `.${NAME}`;
const SELECTOR_CONTENT = `.${CONTENT_CLASS}`;
const SELECTOR_HIDE = `.${HIDE_CLASS}`;
const SELECTOR_TOOLBAR = `.${TOOLBAR_CLASS}`;
const SELECTOR_TOOLBAR_TOGGLER = `.${TOOLBAR_TOGGLER_CLASS}`;
const SELECTOR_TOOLBAR_GROUP = `.${TOOLBAR_GROUP_CLASS}`;
const SELECTOR_DROPDOWN_IN_TOOLBAR_TOGGLER = `${SELECTOR_TOOLBAR_TOGGLER} ${SELECTOR_DROPDOWN}`;
const SELECTOR_DROPDOWN_TOGGLE_IN_TOOLBAR_TOGGLER = `${SELECTOR_TOOLBAR_TOGGLER} ${SELECTOR_DROPDOWN_TOGGLE}`;
const SELECTOR_DROPDOWN_MENU_IN_TOOLBAR_TOGGLER = `${SELECTOR_TOOLBAR_TOGGLER} ${SELECTOR_DROPDOWN_MENU}`;
const SELECTOR_ACTION_HANDLER = `${SELECTOR_TOOLBAR_GROUP} ${SELECTOR_COMMAND}`;
const SELECTOR_INPUT_IN_FORM_OUTLINE = `${SELECTOR_FORM_OUTLINE} ${SELECTOR_INPUT}`;
const SELECTOR_HIDDEN_TOOL = `${SELECTOR_TOOLBAR_GROUP}${SELECTOR_HIDE}`;

const COLORS = [
  '#1266F1', // Primary
  '#B23CFD', // Secondary
  '#00B74A', // Success
  '#F93154', // Danger
  '#FFA900', // Warning
  '#39C0ED', // Info
  '#FBFBFB', // Light
  '#262626', // Dark
];

const TRANSLATIONS = {
  paragraph: 'Paragraph',
  textStyle: 'Text style',
  heading: 'Heading',
  preformatted: 'Preformatted',
  bold: 'Bold',
  italic: 'Italic',
  strikethrough: 'Strikethrough',
  underline: 'Underline',
  textcolor: 'Color',
  textBackgroundColor: 'Background Color',
  alignLeft: 'Align Left',
  alignCenter: 'Align Center',
  alignRight: 'Align Right',
  alignJustify: 'Align Justify',
  insertLink: 'Insert Link',
  insertPicture: 'Insert Picture',
  unorderedList: 'Unordered List',
  orderedList: 'Numbered List',
  increaseIndent: 'Increase Indent',
  decreaseIndent: 'Decrease Indent',
  insertHorizontalRule: 'Insert Horizontal Line',
  showHTML: 'Show HTML code',
  undo: 'Undo',
  redo: 'Redo',
  addLinkHead: 'Add Link',
  addImageHead: 'Add Image',
  linkUrlLabel: 'Enter a URL:',
  linkDescription: 'Enter a description',
  imageUrlLabel: 'Enter a URL:',
  okButton: 'OK',
  cancelButton: 'cancel',
  moreOptions: 'Show More Options',
};

const DEFAULT_OPTIONS = {
  wysiwygColors: COLORS,
  wysiwygTranslations: TRANSLATIONS,
  wysiwygStylesSection: true,
  wysiwygFormattingSection: true,
  wysiwygJustifySection: true,
  wysiwygListsSection: true,
  wysiwygLinksSection: true,
  wysiwygShowCodeSection: true,
  wysiwygUndoRedoSection: true,
  wysiwygFixed: false,
  wysiwygFixedOffsetTop: 0,
  wysiwygTextareaName: '',
};

const OPTIONS_TYPE = {
  wysiwygColors: 'array',
  wysiwygTranslations: 'object',
  wysiwygStylesSection: 'boolean',
  wysiwygFormattingSection: 'boolean',
  wysiwygJustifySection: 'boolean',
  wysiwygListsSection: 'boolean',
  wysiwygLinksSection: 'boolean',
  wysiwygShowCodeSection: 'boolean',
  wysiwygUndoRedoSection: 'boolean',
  wysiwygFixed: 'boolean',
  wysiwygFixedOffsetTop: 'number',
  wysiwygTextareaName: 'string',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Wysiwyg {
  constructor(element, options = {}) {
    this._element = element;
    this._content = '';
    this._toolbar = '';
    this._toolbarToggler = '';
    this._textarea = '';
    this._options = this._getConfig(options);
    this._isCodeShown = false;
    this._toolsWidth = [];
    this._selection = {};
    this._UUID = this._randomUUID();

    if (this._element) {
      this._init();
      Data.setData(element, DATA_KEY, this);
    }
  }

  // Getters

  // Public
  dispose() {
    Data.removeData(this._element, DATA_KEY);

    EventHandler.off(window, EVENT_RESIZE);
    EventHandler.off(this._content, EVENT_INPUT);

    SelectorEngine.find(SELECTOR_COMMAND, this._element).forEach((el) => {
      EventHandler.off(el, EVENT_CLICK);
    });

    if (this._toolbarToggler) {
      EventHandler.off(
        SelectorEngine.findOne(SELECTOR_DROPDOWN_IN_TOOLBAR_TOGGLER),
        EVENT_DROPDOWN_HIDE
      );
      EventHandler.off(
        SelectorEngine.findOne(SELECTOR_DROPDOWN_IN_TOOLBAR_TOGGLER),
        EVENT_MOUSEDOWN
      );
    }

    this._element = null;
    this._options = null;
    this._isCodeShown = null;
    this._toolbarToggler = null;
    this._toolsWidth = null;
    this._selection = null;
    this._UUID = null;
    this._textarea = null;
  }

  getCode() {
    return this._content.innerHTML;
  }

  // Private
  _init() {
    const { initMDB, Ripple, Dropdown, Tooltip } = mdb;
    initMDB({ Ripple, Dropdown, Tooltip });

    Manipulator.setDataAttribute(this._element, 'uuid', this._UUID);

    const initialContent = this._element.innerHTML;
    const wrapper = document.createElement(SELECTOR_DIV);

    wrapper.innerHTML = create.contentDiv();

    const content = SelectorEngine.children(wrapper, SELECTOR_CONTENT)[0];

    this._element.innerHTML = '';
    this._element.insertAdjacentHTML(
      'beforebegin',
      create.textarea(this._options.wysiwygTextareaName, this._UUID)
    );
    this._element.insertAdjacentHTML('beforeend', create.toolBar(this._options));
    this._element.append(content);

    this._content = SelectorEngine.findOne(SELECTOR_CONTENT, this._element);
    this._toolbar = SelectorEngine.findOne(SELECTOR_TOOLBAR, this._element);
    this._textarea = SelectorEngine.prev(this._element, SELECTOR_TEXTAREA)[0];

    this._content.innerHTML = initialContent;
    this._textarea.value = initialContent;
    this._updateToolbar();

    // init input`s
    SelectorEngine.find(SELECTOR_FORM_OUTLINE, this._toolbar).forEach((formOutline) => {
      new mdb.Input(formOutline).init();
    });

    const actionHandlers = SelectorEngine.find(
      `${SELECTOR_TOOLBAR_GROUP}:not(${SELECTOR_TOOLBAR_TOGGLER}) ${SELECTOR_COMMAND}`,
      this._element
    );
    const linkSectionDropdowns = SelectorEngine.find(SELECTOR_LINKS_SECTION, this._element);

    this._initTooltips(this._toolbar);
    this._initDropdowns(this._toolbar);
    this._onActionButtonClick(actionHandlers);
    this._onInput();
    this._onWindowResize();
    this._onBlur();
    this._onOpenDropdown(linkSectionDropdowns);
  }

  _onInput() {
    EventHandler.on(this._content, EVENT_INPUT, () => {
      this._textarea.value = this._content.innerHTML;
    });
  }

  _onWindowResize() {
    EventHandler.on(window, EVENT_RESIZE, this._updateToolbar.bind(this));
  }

  _onActionButtonClick(actionHandlers) {
    actionHandlers.forEach((handler) => {
      EventHandler.on(handler, EVENT_MOUSEDOWN, (e) => {
        e.preventDefault();

        const command = Manipulator.getDataAttribute(handler, 'cmd');
        const isInsertLinkCommand = command === 'insertlink';
        const isInsertPictureCommand = command === 'insertpicture';
        const isCloseDropdownCommand = command === 'close-dropdown';

        if (isInsertLinkCommand || isInsertPictureCommand || isCloseDropdownCommand) {
          const dropdownElement = handler.closest(SELECTOR_DROPDOWN_MENU).previousElementSibling;
          const dropdown = mdb.Dropdown.getInstance(dropdownElement);
          dropdown.hide();

          if (this._toolbarToggler) {
            const toolbarDropdown = SelectorEngine.parents(
              this._toolbarToggler,
              SELECTOR_DROPDOWN
            )[0];
            EventHandler.off(toolbarDropdown, EVENT_DROPDOWN_HIDE);

            const dropdownInstance = mdb.Dropdown.getInstance(this._toolbarToggler);
            dropdownInstance.hide();

            this._onCloseDropdown(toolbarDropdown);
          }
        }

        if (isCloseDropdownCommand) {
          return;
        }

        this._performAction(e.target);

        //* focus back editable div.
        this._content.focus();
      });
    });
  }

  _onBlur() {
    EventHandler.on(this._content, EVENT_BLUR, () => {
      const selection = document.getSelection();

      this._selection.focusOffset = selection.focusOffset;
      this._selection.focusNode = selection.focusNode;
      this._selection.anchorOffset = selection.anchorOffset;
      this._selection.anchorNode = selection.anchorNode;
    });
  }

  _onOpenDropdown(elements) {
    elements.forEach((element) => {
      EventHandler.on(element, EVENT_DROPDOWN_SHOW, (e) => {
        const selection = document.getSelection();

        if (!selection.baseNode) {
          this._content.focus();
        }

        const url = selection.baseNode.parentElement.href;
        const description = selection.toString();
        const dropdownMenu = e.target.nextElementSibling;
        const commandHandler = SelectorEngine.findOne(SELECTOR_COMMAND, dropdownMenu);
        const command = Manipulator.getDataAttribute(commandHandler, 'cmd');
        const isInsertPictureCommand = command === 'insertpicture';

        if (url) {
          const urlInput = SelectorEngine.findOne(SELECTOR_INPUT_TYPE_URL, dropdownMenu);
          urlInput.value = url;
        }

        if (!isInsertPictureCommand) {
          const descriptionInput = SelectorEngine.findOne(SELECTOR_INPUT_TYPE_TEXT, dropdownMenu);
          descriptionInput.value = description;
        }

        dropdownMenu.querySelectorAll(SELECTOR_INPUT_IN_FORM_OUTLINE).forEach((input) => {
          input.dispatchEvent(new Event('blur'));
        });
      });
    });
  }

  _onCloseDropdown(element) {
    EventHandler.on(element, EVENT_DROPDOWN_HIDE, (e) => {
      const clickedElement = document.activeElement;
      const isClickedOnSubmenu = SelectorEngine.parents(clickedElement, SELECTOR_DROPDOWN_MENU)[0];
      // The 'isToolbarToggler' variable needs to be declared in a specific way to prevent issues with hiding dropdowns on the second click when using the 'contains' method.
      const isToolbarToggler = e.target.parentElement.parentElement.classList.contains(
        TOOLBAR_TOGGLER_CLASS
      );

      if (isClickedOnSubmenu && isToolbarToggler) {
        e.preventDefault();
      }
    });
  }

  _isContentFocused() {
    const focusedElement = document.activeElement;
    const closestWysiwyg = focusedElement
      ? SelectorEngine.parents(focusedElement, SELECTOR_WYSIWYG)[0]
      : '';
    const focusedElementUUID = closestWysiwyg
      ? Manipulator.getDataAttribute(closestWysiwyg, 'uuid')
      : '';

    return focusedElementUUID === this._UUID;
  }

  _updateToolbar() {
    const contentWidth = this._content.offsetWidth;
    const tools = SelectorEngine.find(
      `${SELECTOR_TOOLBAR_GROUP}:not(${SELECTOR_TOOLBAR_TOGGLER})`,
      this._element
    );
    let toolsWidth = 0;

    if (this._toolbarToggler) {
      toolsWidth += this._toolbarToggler.offsetWidth;
    }

    tools.forEach((el, i) => {
      const isHidden = el.classList.contains(HIDE_CLASS);

      toolsWidth += el.offsetWidth || this._toolsWidth[i];

      if (contentWidth < toolsWidth && !isHidden) {
        this._toolsWidth[i] = el.offsetWidth;

        Manipulator.addClass(el, HIDE_CLASS);

        if (!this._toolbarToggler) {
          this._createToolbarToggler();
        }

        this._updateToolbarTogglerMenu();
      } else if (contentWidth > toolsWidth && isHidden) {
        Manipulator.removeClass(el, HIDE_CLASS);
        this._updateToolbarTogglerMenu();
      }
    });
  }

  _randomUUID() {
    let d = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      // eslint-disable-next-line no-bitwise
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      // eslint-disable-next-line eqeqeq, no-bitwise
      return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  _createToolbarToggler() {
    this._toolbar.insertAdjacentHTML(
      'beforeend',
      create.toolbarToggler(this._options.wysiwygTranslations)
    );

    this._toolbarToggler = SelectorEngine.findOne(
      SELECTOR_DROPDOWN_TOGGLE_IN_TOOLBAR_TOGGLER,
      this._toolbar
    );

    const toolbarDropdown = SelectorEngine.parents(this._toolbarToggler, SELECTOR_DROPDOWN)[0];

    this._initDropdowns(toolbarDropdown);
    this._onCloseDropdown(toolbarDropdown);
    this._updateToolbar();
  }

  _updateToolbarTogglerMenu() {
    const toolbarMenu = SelectorEngine.findOne(
      SELECTOR_DROPDOWN_MENU_IN_TOOLBAR_TOGGLER,
      this._element
    );
    const hiddenTools = SelectorEngine.find(SELECTOR_HIDDEN_TOOL, this._element);

    toolbarMenu.innerHTML = '';

    hiddenTools.forEach((el) => {
      const toolNode = SelectorEngine.children(el, SELECTOR_DIV)[0].cloneNode(true);

      toolbarMenu.appendChild(toolNode);
    });

    const actionHandlers = SelectorEngine.find(SELECTOR_ACTION_HANDLER, toolbarMenu);

    const linkSectionDropdowns = SelectorEngine.find(
      `${SELECTOR_LINKS_SECTION}:not(${HIDE_CLASS})`,
      this._element
    );

    this._onOpenDropdown(linkSectionDropdowns);
    this._onActionButtonClick(actionHandlers);
    this._initDropdowns(toolbarMenu);
    this._initTooltips(toolbarMenu);

    if (toolbarMenu.childNodes.length === 0) {
      this._removeToolbarToggler();
    }
  }

  _initDropdowns(element) {
    SelectorEngine.find(SELECTOR_DATA_TOGGLE_DROPDOWN, element).map((el) => {
      let instance = mdb.Dropdown.getInstance(el);

      if (!instance) {
        instance = new mdb.Dropdown(el);
      }

      return instance;
    });
  }

  _initTooltips(element) {
    // init tooltips
    SelectorEngine.find(SELECTOR_DATA_TOOLTIP, element).forEach((el) => {
      let instance = mdb.Tooltip.getInstance(el);

      if (!instance) {
        instance = new mdb.Tooltip(el, {
          trigger: 'manual',
        });
      }

      el.addEventListener(EVENT_MOUSE_ENTER, (e) => {
        const isDropdown = SelectorEngine.findOne(SELECTOR_DATA_TOGGLE_DROPDOWN, e.target);
        const isOpen = isDropdown ? isDropdown.classList.contains(SELECTOR_SHOW) : false;

        if (!isOpen) {
          instance.show();
        }
      });

      el.addEventListener(EVENT_MOUSE_LEAVE, () => {
        instance.hide();
      });
    });
  }

  _removeToolbarToggler() {
    this._toolbarToggler.closest(SELECTOR_TOOLBAR_TOGGLER).remove();
    this._toolbarToggler = '';
  }

  _performAction(element) {
    if (!this._isContentFocused()) {
      // select proper content div and move caret to end of text
      this._content.focus();
      document.execCommand('selectAll', false, null);
      document.getSelection().collapseToEnd();
    }

    const commandHandler = element.closest(SELECTOR_COMMAND);
    let command = Manipulator.getDataAttribute(commandHandler, 'cmd');
    let argument = Manipulator.getDataAttribute(commandHandler, 'arg');

    if (command === 'insertlink' || command === 'insertpicture') {
      const dropdown = element.closest(SELECTOR_DROPDOWN_MENU);
      const urlInput = SelectorEngine.findOne(SELECTOR_INPUT_TYPE_URL, dropdown);
      const descriptionInput = SelectorEngine.findOne(SELECTOR_INPUT_TYPE_TEXT, dropdown);
      const selection = document.getSelection();
      const { anchorNode, anchorOffset, focusNode, focusOffset } = this._selection;

      if (descriptionInput) {
        argument = `<a href="${urlInput.value}" target="_blank">${descriptionInput.value}</a>`;
        descriptionInput.value = '';
      } else {
        argument = `<img src="${urlInput.value}" target="_blank" class="img-fluid" />`;
      }

      command = 'insertHTML';
      selection.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
      urlInput.value = '';
    }

    if (command === 'toggleHTML') {
      if (this._isCodeShown) {
        this._content.innerHTML = this._content.textContent;
        this._content.classList.remove(SHOW_HTML_CLASS);
        this._isCodeShown = false;
        Manipulator.removeClass(commandHandler, ACTIVE_CLASS);
      } else {
        this._content.textContent = this._content.innerHTML;
        this._content.classList.add(SHOW_HTML_CLASS);
        this._isCodeShown = true;
        Manipulator.addClass(commandHandler, ACTIVE_CLASS);
      }
      return;
    }
    document.execCommand(command, false, argument);
  }

  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._element);

    config = {
      ...DEFAULT_OPTIONS,
      ...dataAttributes,
      ...config,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    return config;
  }

  // Static
  static get NAME() {
    return NAME;
  }

  static jQueryInterface(config, options) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose|hide/.test(config)) {
        return;
      }

      if (!data) {
        data = new Wysiwyg(this, _config);
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
  let instance = Wysiwyg.getInstance(el);
  if (!instance) {
    instance = new Wysiwyg(el);
  }

  return instance;
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .Wysiwyg to jQuery only if jQuery is present
 */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = Wysiwyg.jQueryInterface;
    $.fn[NAME].Constructor = Wysiwyg;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Wysiwyg.jQueryInterface;
    };
  }
});

export default Wysiwyg;
