import { typeCheckConfig, getjQuery, getUID, onDOMContentLoaded } from './mdb/util/index';
import Data from './mdb/dom/data';
import Manipulator from './mdb/dom/manipulator';
import SelectorEngine from './mdb/dom/selector-engine';

import WORDS from './words';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'dummy';
const DATA_KEY = `mdb.${NAME}`;

const SELECTOR_DATA_INIT = '[data-mdb-dummy-init]';
const SELECTOR_DUMMY_CREATED = `[data-mdb-${NAME}-created]`;

const DEFAULT_OPTIONS = {
  dummyText: 20,
  dummyImg: '150',
  dummyList: 5,
  dummyTable: '5,5',
  dummyCopy: null,
  dummyRepeat: 1,
  dummyTemplate: 'h1,p,table,h2,p,form,blockquote,img,ul',
  dummyColor: null,
  dummyTextColor: null,
  dummyImgText: null,
};
const OPTIONS_TYPE = {
  dummyText: '(null || number)',
  dummyImg: '(null || string)',
  dummyList: '(null || number)',
  dummyTable: '(null || string)',
  dummyCopy: '(null || string)',
  dummyRepeat: '(null || number)',
  dummyTemplate: '(null || string)',
  dummyColor: '(null || string)',
  dummyTextColor: '(null || string)',
  dummyImgText: '(null || string)',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Dummy {
  constructor(element, options = {}) {
    this._element = element;
    this._jsOptions = options;
    this._options = this._getConfig(options);

    this._tag = null;
    this._dummyAttributes = [];

    if (this._element) {
      Data.setData(element, DATA_KEY, this);
      this._init();
    }
  }

  // Public
  dispose() {
    Data.removeData(this._element, DATA_KEY);

    const dummyCreated = SelectorEngine.find(SELECTOR_DUMMY_CREATED);

    dummyCreated.forEach((dummy) => {
      dummy.parentNode.removeChild(dummy);
    });

    this._element.innerHTML = '';

    this._element = null;
  }

  init() {
    this._init();
  }

  // Private
  _getConfig(options) {
    let attributes = Manipulator.getDataAttributes(this._element);

    // default options allows to pass null/empty attributes se we can check if we have to create e.g. dummy text with default values
    // in case of that we don't want to overwrite default values with null
    attributes = this._cleanObjectFromNulls(attributes);
    options = this._cleanObjectFromNulls(options);

    const config = {
      ...DEFAULT_OPTIONS,
      ...attributes,
      ...options,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    return config;
  }

  _getImageSize() {
    // in case someone pass only one argument JS will think its a number and .split method will crash
    let [width, height] = `${this._options.dummyImg}`.split(',');

    // prevent size crashes when user passes sizes like "200 , 200"
    width = width ? width.trim() : width;
    height = height ? height.trim() : height;

    if (width === '100%') {
      // get element original width
      width = parseInt(this._element.getAttribute('width'), 10) || this._element.offsetWidth;

      // or element parent original width
      width = width || (this._element.parentNode && this._element.parentNode.offsetWidth);
    }

    if (height === '100%') {
      height = parseInt(this._element.getAttribute('height'), 10) || this._element.offsetHeight;

      height = height || (this._element.parentNode && this._element.parentNode.offsetHeight);
    }

    height = height || width;

    return [width, height];
  }

  _getColor(attr) {
    return this._options[attr] ? `/${this._options[attr].split('#')[1]}` : '';
  }

  _setDummyAttributes() {
    let attributes = null;

    if (Object.keys(this._jsOptions).length !== 0 && this._jsOptions.constructor === Object) {
      attributes = this._jsOptions;
    } else {
      attributes = Manipulator.getDataAttributes(this._element);
    }

    Object.keys(attributes).forEach((key) => {
      this._dummyAttributes.push(key);
    });
  }

  _init() {
    const { initMDB, Ripple } = mdb;
    initMDB({ Ripple });

    this._tag = this._element.tagName.toLowerCase();

    this._setDummyAttributes();

    this._startDummyFactory();
  }

  _startDummyFactory() {
    const tagProperties = [
      'dummyText',
      'dummyImg',
      'dummyList',
      'dummyTable',
      'dummyCopy',
      'dummyRepeat',
      'dummyTemplate',
    ];

    let hasTagAttribute = false;

    tagProperties.forEach((prop) => {
      if (this._dummyAttributes.includes(prop)) {
        hasTagAttribute = true;
      }
    });

    // case for when only class="dummy" has been added to element
    if (!hasTagAttribute) {
      this._matchDummyWithTag();
      return;
    }

    this._dummyAttributes.forEach((attr) => {
      switch (attr) {
        case 'dummyTemplate':
          this._createDummyTemplate();
          break;
        case 'dummyText':
          this._createDummyText();
          break;
        case 'dummyImg':
          this._createDummyImg();
          break;
        case 'dummyList':
          this._createDummyList();
          break;
        case 'dummyTable':
          this._createDummyTable();
          break;
        case 'dummyCopy':
          this._createDummyCopy();
          break;
        case 'dummyRepeat':
          this._createDummyRepeat();
          break;
        default:
          return;
      }
    });
  }

  _matchDummyWithTag(tag) {
    const caseTag = tag || this._tag;

    switch (caseTag) {
      case 'img':
        this._createDummyImg();
        break;
      case 'ul':
      case 'ol':
        this._createDummyList();
        break;
      case 'table':
        this._createDummyTable();
        break;
      default:
        this._createDummyText();
        break;
    }
  }

  _determineDummyElement(tag) {
    let el = this._element;

    if (this._tag !== tag) {
      const element = document.createElement(tag);

      this._element.appendChild(element);

      Manipulator.setDataAttribute(element, 'dummyCreated', '');

      el = element;
    }

    return el;
  }

  _createDummyText() {
    this._element[this._tag === 'input' ? 'value' : 'innerHTML'] += this._generateDummyText();

    if (this._options.dummyTextColor) {
      Manipulator.addStyle(this._element, { color: this._options.dummyTextColor });
    }

    this._removeAttribute('data-mdb-dummy-text');
  }

  _generateDummyText(length) {
    const dummyTextLength = length || this._options.dummyText;

    const getWord = () => {
      return WORDS[Math.floor(Math.random() * WORDS.length)];
    };

    let text = getWord();
    text = text.charAt(0).toUpperCase() + text.slice(1);

    while (text.length < dummyTextLength) {
      text += ` ${getWord()}`;
    }

    text = text.slice(0, dummyTextLength);
    return text;
  }

  _generateMultipleTextTags(tag, length = 5, dummyTextLength = this._options.dummyText) {
    let tags = '';

    for (let i = 0; i < length; i++) {
      // eslint-disable-next-line
      tags += `<${tag} data-mdb-dummy-created>${this._generateDummyText(dummyTextLength)}</${tag}>`;
    }

    return tags;
  }

  _createDummyImg() {
    const element = this._determineDummyElement('img');
    const query = this._generateQueryString();

    element.src = query;

    Manipulator.addStyle(element, { maxWidth: '100%' });

    this._removeAttribute('data-mdb-dummy-img');
  }

  _generateQueryString() {
    const [width, height] = this._getImageSize();
    const bgColor = this._getColor('dummyColor');
    const dummyTextColor = this._getColor('dummyTextColor');
    const text = this._generateTextFromData();
    const query = `${width}x${height}${bgColor}${dummyTextColor}${text}`;

    return `https://place-hold.it/${query}`;
  }

  _generateTextFromData() {
    // data-mdb-text can be null which means user wants text to be generated
    let text = '';

    if (this._dummyAttributes.includes('dummyImgText')) {
      text = `?text=${
        this._options.dummyImgText !== null ? this._options.dummyImgText : this._generateDummyText()
      }`;
      text = text.split(' ').join('+');
    }

    return text;
  }

  _createDummyList() {
    const element = this._determineDummyElement('ul');

    const listTemplate = this._generateMultipleTextTags('li', this._options.dummyList);

    element.innerHTML = listTemplate;

    this._removeAttribute('data-mdb-dummy-list');
  }

  _createDummyTable() {
    const element = this._determineDummyElement('table');
    const template = this._generateTableTemplate();

    if (!element.classList.contains('table')) {
      Manipulator.addClass(element, 'table');
    }
    element.innerHTML = template;

    this._removeAttribute('data-mdb-dummy-table');
  }

  _generateTableTemplate() {
    let [rows, cols] = `${this._options.dummyTable}`.split(',');

    rows = rows ? rows.trim() : rows;
    cols = cols ? cols.trim() : cols;

    cols = cols || rows;

    const dummyColumns = new Array(Number(cols)).fill(this._generateDummyText());
    const dummyRow = new Array(Number(cols)).fill(this._generateDummyText());
    const dummyRows = new Array(Number(rows)).fill(dummyRow);
    const tableHTMLTemplate = `
      <thead>
        <tr>
          ${dummyColumns.map((col) => `<th>${col}</th>`).join('')}
        </tr>
      </thead>
        <tbody>${dummyRows
          .map((row) => {
            return `<tr>${row.map((cell) => `<td>${cell}</td>`).join(' ')}</tr>`;
          })
          .join(' ')}
      </tbody>
    `;

    return tableHTMLTemplate;
  }

  _createDummyCopy() {
    let originalElement = SelectorEngine.findOne(this._options.dummyCopy);

    if (!originalElement) {
      originalElement = {
        outerHTML: `<p class="note note-warning"><strong>Element <code>${this._options.dummyCopy}</code> not found</strong></p>`,
      };
    }

    this._element.innerHTML =
      originalElement[
        originalElement.tagName === 'SCRIPT' || originalElement.tagName === 'TEMPLATE'
          ? 'innerHTML'
          : 'outerHTML'
      ];

    this._removeAttribute('data-mdb-dummy-copy');

    // prevents from having two elements with same ID
    if (this._options.dummyCopy.startsWith('#')) {
      const copy = SelectorEngine.findOne(this._options.dummyCopy, this._element);
      copy.removeAttribute('id');
    }
  }

  _createDummyRepeat() {
    if (!this._element.innerHTML) {
      this._matchDummyWithTag();
    }

    this._removeAttribute('data-mdb-dummy-repeat');

    const dummies = SelectorEngine.find(SELECTOR_DATA_INIT, this._element);

    if (dummies.length > 0) {
      dummies.forEach((dummy) => {
        // eslint-disable-next-line no-new
        new Dummy(dummy);
      });
    }

    for (let i = 0; i < this._options.dummyRepeat; i++) {
      const element = document.createElement(this._tag);

      this._element.parentNode.insertBefore(element, this._element.nextSibling);

      element.outerHTML = this._element.outerHTML;

      Manipulator.setDataAttribute(element, 'dummyCreated', '');
    }

    // will find only dummies that were created by dummyRepeat
    const dummyRepeats = SelectorEngine.find(
      `${this._tag}${SELECTOR_DATA_INIT} + ${this._tag}${SELECTOR_DATA_INIT}`,
      this._element.parentNode
    );
    dummyRepeats.forEach((dummy) => {
      Manipulator.setDataAttribute(dummy, 'dummyCreated', '');
      if (dummy.id === this._element.id) {
        dummy.removeAttribute('id');
      }
    });
  }

  _createDummyTemplate() {
    const dataTemplate = this._element.getAttribute('data-mdb-dummy-template');
    const template = dataTemplate || this._options.dummyTemplate;
    const tags = this._generateTemplateString(template);

    Manipulator.addClass(this._element, 'container');

    this._element.innerHTML = tags;

    this._initializeComponents(template);

    this._removeAttribute('data-mdb-dummy-template');
  }

  _generateTemplateString(templateString) {
    let tags = templateString.split(',');

    const nonDummyTags = {
      a: () => `<a href="#" style="margin-bottom: 1rem"/>${this._generateDummyText()}</a>`,
      img: () => {
        this._options.dummyImg = '100%,700';
        return `<img src=${this._generateQueryString()} style="max-width:100%; margin-bottom: 1rem"/>`;
      },
      ul: () => `<ul>${this._generateMultipleTextTags('li', 5)}</ul>`,
      ol: () => `<ol>${this._generateMultipleTextTags('li', 5)}</ol>`,
      table: () => `<table class="table">${this._generateTableTemplate()}</table>`,
      select: () => `<select class="select">${this._generateMultipleTextTags('option')}</select>`,
      button: () =>
        `<button class="btn btn-primary my-3" data-mdb-ripple-init>${this._generateDummyText(
          10
        )}</button>`,
      input: () => {
        const id = getUID('dummy-input-');
        const inputTemplate = `
          <div class="form-outline">
            <input type="text" id="${id}" class="form-control" />
            <label class="form-label" for="${id}">${this._generateDummyText()}</label>
          </div>
        `;
        return inputTemplate;
      },
      textarea: () => {
        const id = getUID('dummy-textarea-');
        const inputTemplate = `
          <div class="form-outline">
            <textarea type="text" id="${id}" class="form-control" rows="4"></textarea>
            <label class="form-label" for="${id}">${this._generateDummyText()}</label>
          </div>
        `;
        return inputTemplate;
      },
      form: () =>
        `<section class="p-4 d-flex justify-content-center mb-4">
          <form action="#" style="width: 100%; max-width:26rem">${this._generateTemplateString(
            'input,textarea,select,button'
          )}
          </form>
        </section>
      `,
      blockquote: () =>
        `<figure>
        <blockquote class="blockquote">
          <p>
          ${this._generateDummyText(50)}
          </p>
        </blockquote>
        <figcaption class="blockquote-footer">
          ${this._generateDummyText(
            10
          )}<cite title="Source Title"> ${this._generateDummyText()}</cite>
        </figcaption>
      </figure>`,
    };

    tags = tags
      .map((tag) => tag.trim().toLowerCase())
      // eslint-disable-next-line no-confusing-arrow
      .map((tag) =>
        nonDummyTags[tag] ? nonDummyTags[tag]() : this._generateMultipleTextTags(tag, 1, 100)
      )
      .join('');

    return tags;
  }

  _initializeComponents(template) {
    const tags = template.split(',');

    const initInput = () => {
      SelectorEngine.find('.form-outline', this._element).forEach((formOutline) => {
        new mdb.Input(formOutline).init();
      });
    };
    const initSelect = () => {
      SelectorEngine.find('select', this._element).forEach((select) => {
        // eslint-disable-next-line no-new
        new mdb.Select(select);
      });
    };

    tags.forEach((tag) => {
      switch (tag) {
        case 'input':
          initInput();
          break;
        case 'select':
          initSelect();
          break;
        case 'form':
          initInput();
          initSelect();
          break;
        default:
          return;
      }
    });

    SelectorEngine.find('.form-outline', this._element).forEach((formOutline) => {
      Manipulator.addStyle(formOutline, { marginBottom: '1rem' });
    });
  }

  _cleanObjectFromNulls(obj) {
    const propNames = Object.getOwnPropertyNames(obj);
    for (let i = 0; i < propNames.length; i++) {
      const propName = propNames[i];
      if (obj[propName] === null || obj[propName] === undefined) {
        delete obj[propName];
      }
    }

    return obj;
  }

  _removeAttribute(attr) {
    // attribute can be emtpy/null which Manipulator will treat as if there is no attribute
    if (this._element.hasAttribute(attr)) {
      this._element.removeAttribute(attr);
    }
  }

  // Static
  static get NAME() {
    return NAME;
  }

  static jQueryInterface(config, options) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose/.test(config)) {
        return;
      }

      if (!data) {
        data = new Dummy(this, _config);
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
  let instance = Dummy.getInstance(el);
  if (!instance) {
    instance = new Dummy(el);
  }

  return instance;
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .Dummy to jQuery only if jQuery is present
 */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = Dummy.jQueryInterface;
    $.fn[NAME].Constructor = Dummy;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Dummy.jQueryInterface;
    };
  }
});

export default Dummy;
