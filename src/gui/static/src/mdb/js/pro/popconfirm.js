import { createPopper } from '@popperjs/core';
import { element, typeCheckConfig, getUID, isRTL } from '../mdb/util/index';
import Data from '../mdb/dom/data';
import EventHandler from '../mdb/dom/event-handler';
import SelectorEngine from '../mdb/dom/selector-engine';
import Manipulator from '../mdb/dom/manipulator';
import { ESCAPE } from '../mdb/util/keycodes';
import BaseComponent from '../free/base-component';
import { bindCallbackEventsIfNeeded } from '../autoinit/init';
import FocusTrap from '../mdb/util/focusTrap';
import ScrollBarHelper from '../bootstrap/mdb-prefix/util/scrollbar';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'popconfirm';
const DATA_KEY = 'mdb.popconfirm';
const SELECTOR_POPCONFIRM_BODY = '.popconfirm';
const EVENT_KEY = `.${DATA_KEY}`;
const EVENT_CANCEL = `cancel${EVENT_KEY}`;
const EVENT_CONFIRM = `confirm${EVENT_KEY}`;

const DefaultType = {
  popconfirmMode: 'string',
  message: 'string',
  cancelText: 'string',
  okText: 'string',
  okClass: 'string',
  popconfirmIcon: 'string',
  cancelLabel: 'string',
  confirmLabel: 'string',
};

const Default = {
  popconfirmMode: 'inline',
  message: 'Are you sure?',
  cancelText: 'Cancel',
  okText: 'OK',
  okClass: 'btn-primary',
  popconfirmIcon: '',
  cancelLabel: 'Cancel',
  confirmLabel: 'Confirm',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Popconfirm extends BaseComponent {
  constructor(element, options) {
    super(element);

    this._options = this._getConfig(options);
    this._cancelButtonTemplate = this._getCancelButtonTemplate();
    this._popper = null;
    this._cancelButton = '';
    this._confirmButton = '';
    this._isOpen = false;
    this._uid = this._element.id ? `popconfirm-${this._element.id}` : getUID('popconfirm-');
    this._focusTrap = null;
    this._scrollBar = new ScrollBarHelper();

    this._clickHandler = this.open.bind(this);

    this._escapeKeydownHandler = this._handleEscapeKey.bind(this);
    this._outsideClickHandler = this._handleOutsideClick.bind(this);

    EventHandler.on(this._element, 'click', this._clickHandler);

    Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
    bindCallbackEventsIfNeeded(this.constructor);
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  get container() {
    return SelectorEngine.findOne(`#${this._uid}`);
  }

  get popconfirmBody() {
    return SelectorEngine.findOne(SELECTOR_POPCONFIRM_BODY, this.container);
  }

  // Public

  dispose() {
    if (this._isOpen || this.container !== null) {
      this.close();
    }

    EventHandler.off(this._element, 'click', this._clickHandler);
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    // timeout is needed to avoid the issue with popper
    const timeout = this._isOpen && this._options.popconfirmMode === 'inline' ? 155 : 0;
    setTimeout(() => {
      super.dispose();
    }, timeout);
  }

  open() {
    if (this._isOpen) {
      return;
    }
    if (this._options.popconfirmMode === 'inline') {
      this._openPopover(this._getPopoverTemplate());
    } else {
      this._openModal(this._getModalTemplate());
      this._scrollBar.hide();
    }

    this._handleCancelButtonClick();
    this._handleConfirmButtonClick();
    this._listenToEscapeKey();
    this._listenToOutsideClick();
  }

  close() {
    if (!this._isOpen) {
      return;
    }

    if (this._popper !== null || SelectorEngine.findOne('.popconfirm-popover') !== null) {
      EventHandler.on(
        this.popconfirmBody,
        'transitionend',
        this._handlePopconfirmTransitionEnd.bind(this)
      );
      Manipulator.removeClass(this.popconfirmBody, 'show');
    } else {
      const tempElement = SelectorEngine.findOne('.popconfirm-backdrop');
      Manipulator.removeClass(this.popconfirmBody, 'show');
      document.body.removeChild(tempElement);
      this._isOpen = false;
    }

    this._removeFocusTrap();
    this._scrollBar.reset();

    this._element.focus();

    EventHandler.off(document, 'click', this._outsideClickHandler);
    EventHandler.off(document, 'keydown', this._escapeKeydownHandler);
  }

  _setFocusTrap(element) {
    this._focusTrap = new FocusTrap(element, {
      event: 'keydown',
      condition: (event) => event.key === 'Tab',
    });

    this._focusTrap.trap();

    const cancelButton = SelectorEngine.findOne('#popconfirm-button-cancel', element);
    const confirmButton = SelectorEngine.findOne('#popconfirm-button-confirm', element);

    if (cancelButton) {
      cancelButton.focus();
    } else {
      confirmButton.focus();
    }
  }

  _removeFocusTrap() {
    if (this._focusTrap) {
      this._focusTrap.disable();
      this._focusTrap = null;
    }
  }

  _handlePopconfirmTransitionEnd(event) {
    if (event.target !== this.popconfirmBody) {
      return;
    }

    const popoverTemplate = SelectorEngine.findOne('.popconfirm-popover');
    EventHandler.off(this.popconfirmBody, 'transitionend');

    if (this._isOpen && event && event.propertyName === 'opacity') {
      this._popper.destroy();

      if (popoverTemplate) {
        document.body.removeChild(popoverTemplate);
      }

      this._isOpen = false;
    }
  }

  // Private

  _getPopoverTemplate() {
    const popover = element('div');
    const popconfirmTemplate = this._getPopconfirmTemplate();
    Manipulator.addClass(popover, 'popconfirm-popover');
    Manipulator.addClass(popover, 'shadow-2');
    popover.id = this._uid;
    popover.innerHTML = popconfirmTemplate;
    return popover;
  }

  _getModalTemplate() {
    const modal = element('div');
    const popconfirmTemplate = this._getPopconfirmTemplate();
    Manipulator.addClass(modal, 'popconfirm-modal');
    Manipulator.addClass(modal, 'shadow-2');
    modal.id = this._uid;
    modal.innerHTML = popconfirmTemplate;
    return modal;
  }

  _getPopconfirmTemplate() {
    return `<div class="popconfirm">
      <p class="popconfirm-message">
      ${this._getMessageIcon()}
      <span class="popconfirm-message-text">${this._options.message}</span>
      </p>
      <div class="popconfirm-buttons-container">
      ${this._cancelButtonTemplate}
      <button type="button" id="popconfirm-button-confirm" data-mdb-ripple-init
      aria-label="${this._options.confirmLabel}"
      class="btn ${this._options.okClass} btn-sm">${this._options.okText}</button>
      </div>
    </div>`;
  }

  _getConfig(config) {
    config = {
      ...Default,
      ...Manipulator.getDataAttributes(this._element),
      ...config,
    };
    typeCheckConfig(NAME, config, DefaultType);
    return config;
  }

  _getCancelButtonTemplate() {
    if (this._options.cancelText === '' || this._options.cancelText === ' ') {
      return '';
    }
    return `<button type="button" id="popconfirm-button-cancel" aria-label="${this._options.cancelLabel}"
    class="btn btn-secondary btn-sm" data-mdb-ripple-init >${this._options.cancelText}</button>`;
  }

  _getMessageIcon() {
    if (this._options.popconfirmIcon === '') {
      return '';
    }
    return `<span class="popconfirm-icon-container"><i class="${this._options.popconfirmIcon}"></i></span>`;
  }

  _openPopover(template) {
    this._popper = createPopper(this._element, template, {
      placement: this._translatePositionValue(),
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 5],
          },
        },
      ],
    });
    document.body.appendChild(template);

    setTimeout(() => {
      Manipulator.addClass(this.popconfirmBody, 'fade');
      Manipulator.addClass(this.popconfirmBody, 'show');
      this._isOpen = true;

      this._setFocusTrap(this.container);
    }, 0);
  }

  _openModal(template) {
    const backdrop = element('div');
    Manipulator.addClass(backdrop, 'popconfirm-backdrop');
    document.body.appendChild(backdrop);
    backdrop.appendChild(template);
    Manipulator.addClass(this.popconfirmBody, 'show');
    this._isOpen = true;

    this._setFocusTrap(this.container);
  }

  _handleCancelButtonClick() {
    const container = this.container;
    this._cancelButton = SelectorEngine.findOne('#popconfirm-button-cancel', container);
    if (this._cancelButton !== null) {
      EventHandler.on(this._cancelButton, 'click', () => {
        this.close();
        EventHandler.trigger(this._element, EVENT_CANCEL);
      });
    }
  }

  _handleConfirmButtonClick() {
    const container = this.container;
    this._confirmButton = SelectorEngine.findOne('#popconfirm-button-confirm', container);
    EventHandler.on(this._confirmButton, 'click', () => {
      this.close();
      EventHandler.trigger(this._element, EVENT_CONFIRM);
    });
  }

  _listenToEscapeKey() {
    EventHandler.on(document, 'keydown', this._escapeKeydownHandler);
  }

  _handleEscapeKey(event) {
    if (event.keyCode === ESCAPE) {
      if (this._isOpen) {
        EventHandler.trigger(this._element, EVENT_CANCEL);
      }
      this.close();
    }
  }

  _listenToOutsideClick() {
    EventHandler.on(document, 'click', this._outsideClickHandler);
  }

  _handleOutsideClick(event) {
    const container = this.container;
    const isContainer = event.target === container;
    const isContainerContent = container && container.contains(event.target);
    const isElement = event.target === this._element;
    const isElementContent = this._element && this._element.contains(event.target);
    if (!isContainer && !isContainerContent && !isElement && !isElementContent) {
      if (this._isOpen) {
        EventHandler.trigger(this._element, EVENT_CANCEL);
      }
      this.close();
    }
  }

  _translatePositionValue() {
    switch (this._options.position) {
      // left, right as default
      case 'top left':
        return isRTL ? 'top-start' : 'top-end';
      case 'top':
        return 'top';
      case 'top right':
        return isRTL ? 'top-end' : 'top-start';
      case 'bottom left':
        return isRTL ? 'bottom-start' : 'bottom-end';
      case 'bottom':
        return 'bottom';
      case 'bottom right':
        return isRTL ? 'bottom-end' : 'bottom-start';
      case 'left':
        return isRTL ? 'right' : 'left';
      case 'left top':
        return isRTL ? 'right-end' : 'left-end';
      case 'left bottom':
        return isRTL ? 'right-start' : 'left-start';
      case 'right':
        return isRTL ? 'left' : 'right';
      case 'right top':
        return isRTL ? 'left-end' : 'right-end';
      case 'right bottom':
        return isRTL ? 'left-start' : 'right-start';
      case undefined:
        return 'bottom';
      default:
        return this._options.position;
    }
  }

  // Static

  static jQueryInterface(config, options) {
    return this.each(function () {
      const data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose/.test(config)) {
        return;
      }

      if (!data) {
        // eslint-disable-next-line consistent-return
        return new Popconfirm(this, _config);
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

export default Popconfirm;
