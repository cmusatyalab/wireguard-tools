import { typeCheckConfig, getjQuery, onDOMContentLoaded, element } from './mdb/util/index';
import Data from './mdb/dom/data';
import Manipulator from './mdb/dom/manipulator';
import SelectorEngine from './mdb/dom/selector-engine';
import EventHandler from './mdb/dom/event-handler';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'organization-chart';
const DATA_KEY = `mdb.${NAME}`;

const CLASSNAME_TABLE = `${NAME}-table`;
const CLASSNAME_CONTENT = `${NAME}-content`;
const CLASSNAME_LINES_TOP = `${NAME}-lines-top`;
const CLASSNAME_LINES_DOWN = `${NAME}-lines`;
const CLASSNAME_LINE = `${NAME}-line`;
const CLASSNAME_CHILDREN = `${NAME}-children`;
const CLASSNAME_ICON_CLICKED = `${NAME}-icon-clicked`;
const CLASSNAME_CHART_HIDE = `${NAME}-hide`;

const SELECTOR_CONTENT = `.${CLASSNAME_CONTENT}`;
const SELECTOR_LINES_TOP = `.${CLASSNAME_LINES_TOP}`;
const SELECTOR_LINES_DOWN = `.${CLASSNAME_LINES_DOWN}`;
const SELECTOR_CHILDREN = `.${CLASSNAME_CHILDREN}`;

const DEFAULT_OPTIONS = {
  data: {},
  switchHeaderText: false,
};
const OPTIONS_TYPE = {
  data: 'Object',
  switchHeaderText: 'boolean',
};

const NEWNODE_TEMPLATE = `
  <tbody>
    <tr class="organization-chart-content"></tr>
    <tr class="organization-chart-lines-top"></tr>
    <tr class="organization-chart-lines"></tr>
    <tr class="organization-chart-children"></tr>
  </tbody>
`;

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class OrganizationChart {
  constructor(element, options = {}) {
    this._element = element;
    this._options = options;
    this._data = this._options.data;
    this._firstElement = null;

    this._init();

    if (this._element) {
      Data.setData(element, DATA_KEY, this);
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
    this._options = null;
    this._data = null;
    this._firstElement = null;
  }

  // Private
  _init() {
    this._buildStructure();
  }

  _appendIcon(newNode, contentDiv) {
    const newIcon = document.createElement('a');
    newIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';

    this._handleHiding(newNode, newIcon);

    contentDiv.appendChild(newIcon);
  }

  _buildStructure() {
    this._buildNode(this._element, this._data);

    if (this._data.children) {
      this._buildLevels(this._firstElement, this._data.children);
    }
  }

  _buildNode(parentNode, node) {
    const newNode = element('table');
    newNode.classList.add(CLASSNAME_TABLE);
    newNode.innerHTML = NEWNODE_TEMPLATE;

    const contentTd = element('td');
    this._insertContent(contentTd, node, newNode);

    if (node.children) {
      const childrenNumber = node.children.length;
      contentTd.setAttribute('colspan', childrenNumber * 2);

      this._drawTopLine(newNode, childrenNumber);

      if (childrenNumber > 1) {
        this._drawLines(newNode, childrenNumber);
      }
    }

    const contentTr = SelectorEngine.findOne(SELECTOR_CONTENT, newNode);
    contentTr.appendChild(contentTd);

    const childrenTr = SelectorEngine.findOne(SELECTOR_CHILDREN, newNode);

    if (parentNode === this._element) {
      this._firstElement = childrenTr;
    }

    parentNode.appendChild(newNode);

    return childrenTr;
  }

  _buildLevels(parentNode, childrenNodes) {
    childrenNodes.forEach((node) => {
      const newTd = element('td');
      newTd.setAttribute('colspan', 2);
      parentNode.appendChild(newTd);
      const childrenTr = this._buildNode(newTd, node);

      if (node.children) {
        this._buildLevels(childrenTr, node.children);
      }
    });
  }

  _drawTopLine(newNode, childrenNumber) {
    const topLineTr = SelectorEngine.findOne(SELECTOR_LINES_TOP, newNode);

    const topLineTd = element('td');

    topLineTd.setAttribute('colspan', childrenNumber * 2);
    const topLineDiv = element('div');

    if (childrenNumber === 1) {
      topLineDiv.style.height = '40px';
    }

    topLineTd.appendChild(topLineDiv);
    topLineTr.appendChild(topLineTd);
  }

  _drawLines(newNode, childrenNumber) {
    const linesTr = SelectorEngine.findOne(SELECTOR_LINES_DOWN, newNode);

    for (let i = 0; i < childrenNumber * 2; i++) {
      const lineTd = element('td');

      Manipulator.addClass(lineTd, CLASSNAME_LINE);

      if (i % 2) {
        Manipulator.addStyle(lineTd, { borderRightColor: 'transparent' });
      }

      const isBorderline = i === 0 || i === childrenNumber * 2 - 1;
      if (isBorderline) {
        Manipulator.addStyle(lineTd, { borderTop: 'none' });
      }

      linesTr.appendChild(lineTd);
    }
  }

  _handleHiding(newNode, button) {
    EventHandler.on(button, 'click', () => {
      const hiddenTrs = [...newNode.querySelector('tbody').children];
      hiddenTrs.shift();

      if (Manipulator.hasClass(hiddenTrs[1], CLASSNAME_CHART_HIDE)) {
        this._animationIn(hiddenTrs);
      } else {
        this._animationOut(hiddenTrs);
      }

      const icon = button.querySelector('i');
      Manipulator.toggleClass(icon, CLASSNAME_ICON_CLICKED);
    });
  }

  _animationIn(hiddenTrs) {
    hiddenTrs.forEach((tr, i) => {
      if (i === 2) {
        EventHandler.one(tr, 'transitionstart', () => {
          Manipulator.removeClass(tr, CLASSNAME_CHART_HIDE);
        });

        tr.style.transform = null;
        tr.style.visibility = null;
        tr.style.opacity = null;
      } else {
        Manipulator.removeClass(tr, CLASSNAME_CHART_HIDE);
      }
    });
  }

  _animationOut(hiddenTrs) {
    hiddenTrs.forEach((tr, i) => {
      if (i === 2) {
        tr.style.transition = '0.2s ease-out';
        tr.style.transform = 'translateY(-100px)';
        tr.style.opacity = 0;

        EventHandler.one(tr, 'transitionend', () => {
          Manipulator.addClass(tr, CLASSNAME_CHART_HIDE);
        });
      } else {
        Manipulator.addClass(tr, CLASSNAME_CHART_HIDE);
      }
    });
  }

  _insertContent(td, node, newNode) {
    let headerText = node.label;
    let bottomText = node.name;

    if (this._options.switchHeaderText) {
      headerText = node.name;
      bottomText = node.label;
    }

    const ADVANCED_TEMPLATE = `
      <div class="card">
        <div class="card-header">${headerText}</div>
        <div class="card-body">
          <img src="${node.avatar}" alt="" >
          <p class="card-text">${bottomText}</p>
        </div>
      </div>
    `;

    const NORMAL_TEMPLATE = `
      <div class="organization-chart-node">   
        <p>${node.label}</p>
      </div>
    `;

    if (node.name) {
      td.innerHTML = ADVANCED_TEMPLATE;
      const card = td.querySelector('.card');
      Manipulator.addClass(card, 'organization-card');
    } else {
      td.innerHTML = NORMAL_TEMPLATE;
    }

    const contentDiv = td.querySelector('div');

    if (node.children) {
      this._appendIcon(newNode, contentDiv);
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
        data = new OrganizationChart(this, _config);
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
 * jQuery
 * ------------------------------------------------------------------------
 * add .OrganizationChart to jQuery only if jQuery is present
 */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = OrganizationChart.jQueryInterface;
    $.fn[NAME].Constructor = OrganizationChart;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return OrganizationChart.jQueryInterface;
    };
  }
});

export default OrganizationChart;
