import { typeCheckConfig } from './mdb/util/index';
import Data from './mdb/dom/data';
import Manipulator from './mdb/dom/manipulator';
import SelectorEngine from './mdb/dom/selector-engine';
import EventHandler from './mdb/dom/event-handler';

import {
  getExpandables,
  expandingArrow,
  getNestedRows,
  getFirstNestedRows,
  hideAllNestedRows,
  showAllNestedRows,
  appendPaddings,
  wrapCellDataInDivs,
  getExpandablesFromFirstNest,
} from './utils/utils';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'treetable';
const DATA_KEY = 'mdb.treetable';

const DEFAULT_OPTIONS = {};
const OPTIONS_TYPE = {};

const SELECTOR_TABLEBODY = `.${NAME} tbody`;
const SELECTOR_TABLEROW = `.${NAME} tr`;
const SELECTOR_TABLECELL = `.${NAME} td`;
const SELECTOR_BUTTON = 'button';
const SELECTOR_CELL = 'td';
const EVENT_EXPAND = `expand.mdb.${NAME}`;
const EVENT_COLLAPSE = `collapse.mdb.${NAME}`;

// const EVENT_KEY = `.${DATA_KEY}`;

const SELECTOR_DATA_INIT = '[data-mdb-treetable-init]';

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Treetable {
  constructor(element, options = {}) {
    this.name = NAME;
    this._element = element;
    if (options.fromJSON) {
      this._element.appendChild(this._changeTableObjectIntoHTML(options.fromJSON));
    }
    this._tbody = SelectorEngine.findOne(SELECTOR_TABLEBODY);
    this._options = this._getConfig(options);
    if (this._element) {
      this._expandables = getExpandables(this._element);
      this._rows = SelectorEngine.find(SELECTOR_TABLEROW, this._element);
      Data.setData(element, DATA_KEY, this);
      this._init();
    }
  }

  // Getters
  get options() {
    const config = {
      ...DEFAULT_OPTIONS,
      ...Manipulator.getDataAttributes(this._element),
      ...this._options,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    return config;
  }

  // Public
  dispose() {
    Data.removeData(this._element, DATA_KEY);
    this._element = null;
    this._expandables.forEach((expandable) => {
      const expandingArrowButton = SelectorEngine.findOne(SELECTOR_BUTTON, expandable);
      EventHandler.off(expandingArrowButton, 'click');
    });
  }

  expandAll() {
    const depthOneExpandables = this._expandables.filter(
      (expandable) => Manipulator.getDataAttribute(expandable, 'depth') === 1
    );
    depthOneExpandables.forEach((expandable) => {
      if (!expandable.nextElementSibling.classList.contains('hidden')) {
        return;
      }
      const actualDepth = Manipulator.getDataAttributes(expandable).depth;
      const expandablesFromFirstNest = getExpandablesFromFirstNest(
        this._expandables,
        actualDepth + 1
      );
      const tableRow = SelectorEngine.closest(expandable, SELECTOR_TABLEROW);
      const nestedRows = getNestedRows(tableRow, actualDepth);
      const firstRows = getFirstNestedRows(tableRow, 'tr[data-depth]');

      const expandingArrowButton = SelectorEngine.findOne(SELECTOR_BUTTON, expandable);
      this._collapse(nestedRows, firstRows, expandablesFromFirstNest, expandingArrowButton);
    });
  }

  collapseAll() {
    const depthOneExpandables = this._expandables.filter(
      (expandable) => Manipulator.getDataAttribute(expandable, 'depth') === 1
    );
    depthOneExpandables.forEach((expandable) => {
      if (expandable.nextElementSibling.classList.contains('hidden')) {
        return;
      }
      const actualDepth = Manipulator.getDataAttributes(expandable).depth;
      const expandablesFromFirstNest = getExpandablesFromFirstNest(
        this._expandables,
        actualDepth + 1
      );
      const tableRow = SelectorEngine.closest(expandable, SELECTOR_TABLEROW);
      const nestedRows = getNestedRows(tableRow, actualDepth);
      const firstRows = getFirstNestedRows(tableRow, 'tr[data-depth]');
      const expandingArrowButton = SelectorEngine.findOne(SELECTOR_BUTTON, expandable);
      this._collapse(nestedRows, firstRows, expandablesFromFirstNest, expandingArrowButton);
    });
  }

  // Private
  _init() {
    this._render();
    this._listenersSetup();
  }

  _listenersSetup() {
    this._expandables.forEach((expandable) => {
      const actualDepth = Manipulator.getDataAttributes(expandable).depth;
      const nestedRows = getNestedRows(
        SelectorEngine.closest(expandable, SELECTOR_TABLEROW),
        actualDepth
      );
      const expandablesFromFirstNest = getExpandablesFromFirstNest(nestedRows, actualDepth + 1);

      const firstRows = getFirstNestedRows(
        SelectorEngine.closest(expandable, SELECTOR_TABLEROW),
        'tr[data-depth]'
      );
      const expandingArrowButton = SelectorEngine.findOne(SELECTOR_BUTTON, expandable);

      EventHandler.on(expandingArrowButton, 'click', () => {
        this._collapse(nestedRows, firstRows, expandablesFromFirstNest, expandingArrowButton);
      });
    });
  }

  _render() {
    appendPaddings(this._rows);
    this._expandables.forEach((expandable) => {
      const firstCell = SelectorEngine.findOne(SELECTOR_CELL, expandable);
      if (!firstCell.querySelector('button')) {
        expandingArrow.insertDownButton(firstCell);
      }
    });
    wrapCellDataInDivs(SelectorEngine.find(SELECTOR_TABLECELL, this._element));
  }

  _setArrowsPositionInRow(rows) {
    rows.forEach((row) => {
      const button = SelectorEngine.find(SELECTOR_BUTTON, row);
      if (button) {
        button[0].innerHTML = expandingArrow.rightArrow;
      }
    });
  }

  _setArrowPosition(nestedRows, element) {
    if (!nestedRows.every((x) => x.classList.contains('hidden'))) {
      element.innerHTML = expandingArrow.downArrow;
    } else {
      element.innerHTML = expandingArrow.rightArrow;
    }
  }

  _getConfig(options) {
    const config = {
      ...DEFAULT_OPTIONS,
      ...Manipulator.getDataAttributes(this._element),
      ...options,
    };
    typeCheckConfig(NAME, config, OPTIONS_TYPE);
    return config;
  }

  _collapse(nestedRows, firstRows, expandablesFromFirstNest, element) {
    if (!nestedRows.every((x) => x.classList.contains('hidden'))) {
      hideAllNestedRows(nestedRows);
      this._setArrowPosition(nestedRows, element);
      EventHandler.trigger(element, EVENT_COLLAPSE, { firstRows, nestedRows });
    } else {
      showAllNestedRows(firstRows);
      showAllNestedRows(expandablesFromFirstNest);
      this._setArrowPosition(nestedRows, element);
      this._setArrowsPositionInRow(expandablesFromFirstNest);
      EventHandler.trigger(element, EVENT_EXPAND, { firstRows, nestedRows });
    }
  }

  _changeTableObjectIntoHTML(data) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('treetable');
    wrapper.insertAdjacentHTML(
      'beforeend',
      '<table class="table"><thead><tr></tr></thead><tbody></tbody></table>'
    );

    const tableBody = SelectorEngine.findOne('tbody', wrapper);
    const tableHead = SelectorEngine.findOne('thead tr', wrapper);

    const renderHead = (data) => {
      tableHead.insertAdjacentHTML('beforeend', '<tr></tr>');

      data.forEach((el) => {
        tableHead.insertAdjacentHTML('beforeend', `<th>${el}</th>`);
      });
    };

    const renderRow = (element, deep) => {
      tableBody.insertAdjacentHTML('beforeend', '<tr></tr>');
      const tr = SelectorEngine.find('tr', tableBody);

      element.data.forEach((el) => {
        tr[tr.length - 1].insertAdjacentHTML('beforeend', `<td>${el}</td>`);
      });

      if (deep) {
        tr[tr.length - 1].dataset.depth = deep;
      }
    };

    const render = (el, deep) => {
      const keys = Object.keys(el);

      const haveChild = keys.find((el) => {
        return el === 'children';
      });

      if (haveChild) {
        renderRow(el, deep);
        el.children.forEach((el) => {
          render(el, deep + 1);
        });
      } else {
        renderRow(el);
      }
    };

    renderHead(data.columns);

    data.row.forEach((el) => {
      render(el, 1);
    });
    return wrapper;
  }

  // Static
  static get NAME() {
    return NAME;
    ///
  }

  static jQueryInterface(config, param1, param2) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose/.test(config)) {
        return;
      }

      if (!data) {
        data = new Treetable(this, _config, param1);
      }

      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config](param1, param2);
      }
    });
  }

  static getInstance(element) {
    return Data.getData(element, DATA_KEY);
  }
}

SelectorEngine.find(SELECTOR_DATA_INIT).forEach((treetable) => {
  let instance = Treetable.getInstance(treetable);
  if (!instance) {
    instance = new Treetable(treetable);
  }
});

export default Treetable;
