import { getjQuery, typeCheckConfig, element, getUID, onDOMContentLoaded } from './mdb/util/index';
import Data from './mdb/dom/data';
import Manipulator from './mdb/dom/manipulator';
import SelectorEngine from './mdb/dom/selector-engine';
import EventHandler from './mdb/dom/event-handler';
import {
  ENTER,
  DOWN_ARROW,
  UP_ARROW,
  TAB,
  RIGHT_ARROW,
  LEFT_ARROW,
  HOME,
  END,
} from './mdb/util/keycodes';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'treeview';
const DATA_KEY = 'mdb.treeview';

const EVENT_ITEM_SELECTED = 'itemSelected.mdb.treeview';
const EVENT_ITEM_ACTIVE = 'itemActive.mdb.treeview';
const EVENT_HIDE_COLLAPSE = 'hide.bs.collapse';
const EVENT_SHOW_COLLAPSE = 'show.bs.collapse';

const SELECTOR_INNER_ULS = 'ul:not([role="tree"])';
const SELECTOR_ICON_SPAN = 'span[aria-label="toggle"]';
const SELECTOR_TOGGLER_ICON = 'i';
const SELECTOR_CHECKBOX = 'input[type="checkbox"]';

const SELECTOR_DATA_INIT = '[data-mdb-treeview-init]';

const CLASSNAME_TREEVIEW = 'treeview';
const CLASSNAME_COLLAPSE = 'collapse';
const CLASSNAME_SHOW = 'show';
const CLASSNAME_FORM_INPUT = 'form-check-input';
const CLASSNAME_SELECTED = 'active';
const CLASSNAME_CATEGORY = 'treeview-category';
const CLASSNAME_LINE = 'treeview-line';
const CLASSNAME_DISABLED = 'treeview-disabled';

const COLORS = ['primary', 'secondary', 'warning', 'success', 'info', 'danger', 'light', 'dark'];

const COLLAPSE_ANIMATION_DURATION = 351;

const DefaultType = {
  structure: '(null|array)',
  openOnClick: 'boolean',
  selectable: 'boolean',
  accordion: 'boolean',
  rotationAngle: 'number',
  treeviewColor: 'string',
  line: 'boolean',
  treeviewDuration: '(null|number)',
};

const Default = {
  structure: null,
  openOnClick: true,
  selectable: false,
  accordion: false,
  rotationAngle: 90,
  treeviewColor: 'primary',
  line: false,
  treeviewDuration: null,
};

class Treeview {
  constructor(element, data) {
    this._element = element;

    if (this._element) {
      Data.setData(element, DATA_KEY, this);
    }

    this._options = this._getConfig(data);

    this._innerLists = [];

    this._stringCollection = new Map();

    this._init();

    this._checkboxes = SelectorEngine.find(SELECTOR_CHECKBOX, this._mainList);

    this._listElements = SelectorEngine.find('li', this._mainList);
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  get parsedDOM() {
    return this._parseDOM(this._element);
  }

  get selectedItems() {
    return SelectorEngine.find(SELECTOR_CHECKBOX, this._mainList)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => {
        const [parent] = SelectorEngine.parents(checkbox, 'li');

        return parent;
      });
  }

  // Public

  dispose() {
    Data.removeData(this._element, DATA_KEY);

    this._checkboxes.forEach((checkbox) => {
      EventHandler.off(checkbox, 'change');
      EventHandler.off(checkbox, 'mousedown');
    });

    this._listElements.forEach((item) => {
      EventHandler.off(item, 'click');
      EventHandler.off(item, 'mouseover');
      EventHandler.off(item, 'mouseout');
      EventHandler.off(item, 'keydown');
    });

    // collapse

    this._innerLists.forEach((list) => {
      list.collapse.dispose();

      const [toggler] = SelectorEngine.parents(list.toggler, 'a');

      EventHandler.off(toggler, 'click');
    });

    this._element = null;
  }

  collapse() {
    SelectorEngine.find('ul', this._mainList).forEach((el) => {
      if (Manipulator.hasClass(el, CLASSNAME_SHOW)) {
        const { collapse } = this._getInnerList(el);

        collapse.hide();
      }
    });
  }

  expand(ID) {
    const target = SelectorEngine.findOne(`#${ID}`, this._mainList);

    const parents = SelectorEngine.parents(target, SELECTOR_INNER_ULS);

    [target, ...parents].forEach((el) => {
      if (!Manipulator.hasClass(el, CLASSNAME_SHOW)) {
        const { collapse } = this._getInnerList(el);

        collapse.show();
      }
    });
  }

  filter(phrase) {
    this.collapse();

    setTimeout(() => {
      this._stringCollection.forEach((text, node) => {
        const stringToSearch = this._normalize(phrase);

        const stringToCheck = this._normalize(text);

        if (stringToCheck.includes(stringToSearch)) {
          let ul;

          if (Manipulator.hasClass(node, CLASSNAME_CATEGORY)) {
            [ul] = SelectorEngine.parents(node, 'ul');
          } else {
            ul = SelectorEngine.findOne('ul', node);
          }

          const isExpanded = Manipulator.hasClass(ul, CLASSNAME_SHOW);
          const hasChildren = SelectorEngine.children(node, 'ul').length > 0;

          if (!isExpanded && hasChildren) {
            const id = ul.getAttribute('id');

            this.expand(id);
          }
        }
      });
    }, COLLAPSE_ANIMATION_DURATION);
  }

  // Private

  _init() {
    const { initMDB, Collapse } = mdb;
    initMDB({ Collapse });

    if (this._options.structure) {
      this._initJS();
    } else {
      this._initDOM();
    }

    EventHandler.on(this._element, 'keydown', (e) => {
      const { keyCode } = e;

      if (keyCode === TAB) {
        return;
      }

      if (keyCode === DOWN_ARROW) {
        e.preventDefault();

        this._handleHomeKey();
      }
    });
  }

  _initJS() {
    this._generateMainList();

    Manipulator.addClass(this._element, CLASSNAME_TREEVIEW);

    this._options.structure.forEach((treeNode) => this._generateTree(treeNode, this._mainList));

    this._initDOM();
  }

  _initDOM() {
    this._setupMainList();

    this.parsedDOM.forEach((treeNode) => this._setupTree(treeNode, 1, this._mainList));

    this._setupUIElement(this._element, { tabindex: '0' });

    if (this._options.treeviewColor) {
      this._setupColors();
    }
  }

  _setupColors() {
    const colorClass = COLORS.includes(this._options.treeviewColor)
      ? `treeview-${this._options.treeviewColor}`
      : 'treeview-primary';

    return Manipulator.addClass(this._element, colorClass);
  }

  _getInnerList(ul) {
    return this._innerLists.find((list) => list.element === ul);
  }

  _generateTree(treeNode, parent) {
    const { name, children, show, id, icon, disabled } = treeNode;

    const li = element('li');

    if (children) {
      this._generateGroupItem({ li, name, children, show, id, icon, disabled });
    } else {
      if (disabled) {
        Manipulator.addClass(li, CLASSNAME_DISABLED);
      }

      li.innerHTML = name;
      if (id) {
        this._setupUIElement(li, { id });
      }
    }

    parent.appendChild(li);
  }

  _generateGroupItem({ li, name, children, show, id, icon, disabled }) {
    const a = element('a');
    const ul = element('ul');

    a.innerHTML = name;

    if (disabled) {
      Manipulator.addClass(a, CLASSNAME_DISABLED);
    }

    li.appendChild(a);
    li.appendChild(ul);

    if (show) {
      Manipulator.addClass(ul, CLASSNAME_SHOW);
    }

    if (id) {
      this._setupUIElement(ul, { id });
    }

    if (icon) {
      const toggler = element('span');
      this._setupUIElement(toggler, { 'aria-label': 'toggle' });
      toggler.innerHTML = icon;

      a.insertBefore(toggler, a.firstChild);
    }

    children.forEach((childNode) => this._generateTree(childNode, ul));
  }

  _generateMainList() {
    this._mainList = element('ul');

    this._element.appendChild(this._mainList);
  }

  _setupMainList() {
    this._mainList = SelectorEngine.findOne('ul', this._element);

    this._setupUIElement(this._mainList, { role: 'tree' });
  }

  _setupTree(treeNode, level, parent) {
    const { node, children } = treeNode;

    this._setupTreeItem(node, level);

    this._setupUIElement(node, { tabindex: '-1' });

    if (children.length > 0) {
      this._setupGroupItem(node, children, level, parent);
    }
  }

  _setupTreeItem(el, level) {
    this._setupUIElement(el, { 'aria-level': level, role: 'tree-item' });

    if (this._options.selectable) {
      this._setupCheckbox(el);
    }

    const selector = this._getSelector(el);

    Manipulator.addClass(selector, CLASSNAME_CATEGORY);

    EventHandler.on(el, 'keydown', (e) => this._handleKeyboardNavigation(e, el));

    if (!Manipulator.hasClass(selector, CLASSNAME_DISABLED)) {
      EventHandler.on(selector, 'click', (e) => this._handleItemClick(e, selector));
    }
  }

  _setupGroupItem(el, children, level, parent) {
    const a = SelectorEngine.findOne('a', el);

    const ul = SelectorEngine.findOne('ul', el);

    if (this._options.line) {
      Manipulator.addClass(ul, CLASSNAME_LINE);
    }

    let ID;

    if (!ul.hasAttribute('id')) {
      ID = getUID('level-');
    } else {
      ID = ul.getAttribute('id');
    }

    const toggler = this._setupToggler(ID, a);

    this._setupUIElement(ul, { id: ID, role: 'group' });

    this._setupUIElement(a, { role: 'button', tabindex: '-1' });

    // Collapse

    this._setupCollapse(ul, toggler, parent);

    children.forEach((childNode) => this._setupTree(childNode, level + 1, ul));
  }

  _setupCollapse(ul, toggler, parent) {
    const show = Manipulator.hasClass(ul, CLASSNAME_SHOW);
    Manipulator.removeClass(ul, CLASSNAME_SHOW);

    const collapseInstance = new mdb.Collapse(ul, {
      parent: this._options.accordion ? parent : '',
      toggle: show,
    });

    if (show) {
      this._rotateIcon(toggler, 90);
    }

    EventHandler.on(ul, EVENT_SHOW_COLLAPSE, (e) => {
      e.stopPropagation();

      this._rotateIcon(toggler, this._options.rotationAngle);
    });

    EventHandler.on(ul, EVENT_HIDE_COLLAPSE, (e) => {
      e.stopPropagation();

      this._rotateIcon(toggler, 0);

      // Collapse inner lists

      SelectorEngine.find('ul', ul).forEach((list) => {
        mdb.Collapse.getInstance(list).hide();
      });
    });

    // Inner lists
    this._innerLists.push({
      element: ul,
      collapse: collapseInstance,
      toggler,
    });
  }

  _createCheckbox() {
    const checkbox = element('input');

    this._setupUIElement(checkbox, { type: 'checkbox' }, ['mx-1', CLASSNAME_FORM_INPUT]);

    return checkbox;
  }

  _setupCheckbox(el) {
    const checkbox = this._createCheckbox();

    const selector = this._getSelector(el);

    if (Manipulator.hasClass(selector, CLASSNAME_DISABLED)) {
      checkbox.setAttribute('disabled', true);

      const childListElements = SelectorEngine.find('li', el);

      childListElements.forEach((child) => {
        const selector = this._getSelector(child);

        Manipulator.addClass(selector, CLASSNAME_DISABLED);
      });
    }

    if (selector.nodeName === 'A') {
      Manipulator.style(selector, {
        marginLeft: '-1rem',
      });
    }

    selector.insertBefore(checkbox, selector.firstChild);
    EventHandler.on(checkbox, 'mousedown', (e) => this._handleInputChange(e, el));
    EventHandler.on(checkbox, 'change', (e) => this._handleInputChange(e, el));
  }

  _handleKeyboardNavigation(e, el) {
    const { keyCode } = e;
    const isTreeviewEvent = [
      UP_ARROW,
      DOWN_ARROW,
      ENTER,
      HOME,
      END,
      RIGHT_ARROW,
      LEFT_ARROW,
    ].includes(keyCode);

    if (!isTreeviewEvent) {
      return;
    }

    e.stopPropagation();

    if (keyCode === TAB) {
      return;
    }

    e.preventDefault();

    switch (keyCode) {
      case ENTER:
        this._handleEnterKey(el);
        break;

      case HOME:
        this._handleHomeKey();
        break;

      case END: {
        const children = SelectorEngine.children(this._mainList, 'li');

        const lastChild = children[children.length - 1];

        this._handleEndKey(lastChild);

        break;
      }

      case RIGHT_ARROW:
        this._handleRightArrow(el);
        break;

      case LEFT_ARROW:
        this._handleLeftArrow(el);
        break;

      case DOWN_ARROW:
        this._handleDownArrow(el);
        break;

      case UP_ARROW:
        this._handleUpArrow(el);
        break;

      default:
        return;
    }
  }

  _handleHomeKey() {
    const li = SelectorEngine.findOne('li', this._mainList);

    const selector = this._getSelector(li);

    selector.focus();
  }

  _handleRightArrow(el) {
    const ul = SelectorEngine.findOne('ul', el);

    if (ul) {
      const id = ul.getAttribute('id');

      this.expand(id);
    } else {
      return;
    }
  }

  _handleLeftArrow(el) {
    const ul = SelectorEngine.findOne('ul', el);

    if (ul) {
      const { collapse } = this._getInnerList(ul);

      collapse.hide();
    } else {
      return;
    }
  }

  _handleEndKey(lastChild) {
    const ul = SelectorEngine.findOne('ul', lastChild);

    let lastItem = lastChild;

    if (ul && Manipulator.hasClass(ul, CLASSNAME_SHOW)) {
      const nextChildren = SelectorEngine.children(ul, 'li');

      const nextLastChild = nextChildren[nextChildren.length - 1];

      lastItem = nextLastChild;

      this._handleEndKey(nextLastChild);
    } else {
      const selector = this._getSelector(lastItem);

      selector.focus();
    }
  }

  _handleEnterKey(el) {
    const selector = this._getSelector(el);

    if (Manipulator.hasClass(selector, CLASSNAME_DISABLED)) {
      return;
    }

    const listElements = SelectorEngine.find('li', this._mainList);

    listElements.forEach((el) => {
      Manipulator.removeClass(el, CLASSNAME_SELECTED);

      const a = SelectorEngine.findOne('a', el);

      if (a) {
        Manipulator.removeClass(a, CLASSNAME_SELECTED);
      }
    });

    Manipulator.addClass(selector, CLASSNAME_SELECTED);
  }

  _handleUpArrow(el) {
    const [prevEl] = SelectorEngine.prev(el, 'li');

    if (!prevEl) {
      const [prevParent] = SelectorEngine.parents(el, 'li');

      if (!prevParent) {
        return;
      }

      const selector = this._getSelector(prevParent);

      selector.focus();

      return;
    }

    const prevUl = SelectorEngine.findOne('ul', prevEl);

    if (prevUl) {
      if (Manipulator.hasClass(prevUl, CLASSNAME_SHOW)) {
        const prevUlChildren = SelectorEngine.children(prevUl, 'li');

        const lastChild = prevUlChildren[prevUlChildren.length - 1];

        lastChild.focus();

        return;
      }
    }

    const selector = this._getSelector(prevEl);

    selector.focus();
  }

  _handleDownArrow(el) {
    let nextEl;

    const elUl = SelectorEngine.findOne('ul', el);

    if (elUl) {
      if (!Manipulator.hasClass(elUl, CLASSNAME_SHOW)) {
        [nextEl] = SelectorEngine.next(el, 'li');

        if (!nextEl) {
          return;
        }

        const selector = this._getSelector(nextEl);

        selector.focus();
      } else {
        nextEl = SelectorEngine.findOne('li', elUl);

        if (!nextEl) {
          return;
        }

        const selector = this._getSelector(nextEl);

        selector.focus();
      }
    } else {
      [nextEl] = SelectorEngine.next(el, 'li');

      if (!nextEl) {
        const [parentEl] = SelectorEngine.parents(el, 'li');

        const [sibling] = SelectorEngine.next(parentEl, 'li');

        if (!sibling) {
          return;
        }

        const selector = this._getSelector(sibling);

        selector.focus();

        return;
      }

      const selector = this._getSelector(nextEl);

      selector.focus();
    }
  }

  _handleInputChange(e, el) {
    let checked = e.target.checked;

    const isCollapse = Manipulator.getDataAttributes(e.target.parentNode).mdbToggle === 'collapse';

    if (isCollapse) {
      checked = !checked;
    }

    const parents = SelectorEngine.parents(el, 'li');

    const [firstParent] = parents;

    const parentCheckbox = SelectorEngine.findOne(SELECTOR_CHECKBOX, firstParent);

    if (firstParent && !parentCheckbox.checked && checked) {
      parents.forEach((parent) => {
        const parentInput = SelectorEngine.findOne(SELECTOR_CHECKBOX, parent);
        const childrenCheckboxes = SelectorEngine.find(SELECTOR_CHECKBOX, parent);
        const isEveryChildChecked = childrenCheckboxes.every((checkbox, index) => {
          if (index === 0) {
            return true;
          }
          return checkbox.checked;
        });

        if (isEveryChildChecked) {
          parentInput.checked = true;
        }
      });
    }

    if (firstParent && parentCheckbox.checked && !checked) {
      parents.forEach((parent) => {
        const parentInput = SelectorEngine.findOne(SELECTOR_CHECKBOX, parent);

        parentInput.checked = false;
      });
    }

    const childCheckboxes = SelectorEngine.find(SELECTOR_CHECKBOX, el);

    childCheckboxes.forEach((checkbox) => {
      if (!checkbox.disabled) {
        checkbox.checked = checked;
      }
    });

    EventHandler.trigger(this._element, EVENT_ITEM_SELECTED, {
      items: this.selectedItems,
    });
  }

  _handleItemClick(e, el) {
    e.stopPropagation();

    const listElements = SelectorEngine.find('li', this._mainList);

    listElements.forEach((el) => {
      Manipulator.removeClass(el, CLASSNAME_SELECTED);

      const a = SelectorEngine.findOne('a', el);

      if (a) {
        Manipulator.removeClass(a, CLASSNAME_SELECTED);
      }
    });

    Manipulator.addClass(el, CLASSNAME_SELECTED);

    EventHandler.trigger(this._element, EVENT_ITEM_ACTIVE, {
      item: el,
    });
  }

  _setupToggler(id, a) {
    const span = SelectorEngine.findOne(SELECTOR_ICON_SPAN, a);

    if (span) {
      const selector = this._options.openOnClick ? a : span;

      Manipulator.setDataAttribute(selector, 'collapseInit', '');
      this._setupUIElement(selector, {
        'data-mdb-toggle': CLASSNAME_COLLAPSE,
        'data-mdb-target': `#${id}`,
      });

      return span;
    }

    return this._createToggler(id, a);
  }

  _createToggler(id, a) {
    const toggler = element('span');

    const selector = this._options.openOnClick ? a : toggler;

    this._setupUIElement(toggler, { 'aria-label': 'toggle' });

    toggler.innerHTML = '<i class="fas fa-angle-right mx-1"></i>';

    Manipulator.setDataAttribute(selector, 'collapseInit', '');
    this._setupUIElement(selector, {
      'data-mdb-toggle': CLASSNAME_COLLAPSE,
      'data-mdb-target': `#${id}`,
    });

    a.insertBefore(toggler, a.firstChild);

    return toggler;
  }

  _parseDOM(el) {
    const [list] = SelectorEngine.children(el, 'ul');

    if (!list) return [];

    return SelectorEngine.children(list, 'li').map((node) => {
      const children = this._parseDOM(node);

      const item = {
        name: node.innerText ? node.innerText.split('\n')[0] : '',
        node,
        children,
      };

      if (item.children.length > 0) {
        const a = SelectorEngine.findOne('a', node);

        item.name = a.innerText ? a.innerText.split('\n')[0] : '';
      }

      this._stringCollection.set(item.node, item.name);

      return item;
    });
  }

  _rotateIcon(toggler, angle) {
    const toggleIcon = SelectorEngine.findOne(SELECTOR_TOGGLER_ICON, toggler);

    if (toggleIcon) {
      Manipulator.style(toggleIcon, {
        transform: `rotate(${angle}deg)`,
      });
    }
  }

  _setupUIElement(el, attrs = {}, classnames = []) {
    const attributeNames = Object.keys(attrs);

    attributeNames.forEach((name) => {
      const value = attrs[name];

      el.setAttribute(name, value);
    });

    classnames.forEach((name) => {
      Manipulator.addClass(el, name);
    });
  }

  _getSelector(el) {
    const a = SelectorEngine.findOne('a', el);

    return a || el;
  }

  _normalize(string) {
    return string.trim().toLowerCase();
  }

  _getConfig(options) {
    const config = {
      ...Default,
      ...Manipulator.getDataAttributes(this._element),
      ...options,
    };
    typeCheckConfig(NAME, config, DefaultType);
    return config;
  }

  // Static

  static getInstance(element) {
    return Data.getData(element, DATA_KEY);
  }

  static jQueryInterface(config) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;
      if (!data) {
        data = new Treeview(this, _config);
      }
      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config](this);
      }
    });
  }
}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation - auto initialization
 * ------------------------------------------------------------------------
 */

SelectorEngine.find(SELECTOR_DATA_INIT).forEach((treeview) => {
  let instance = Treeview.getInstance(treeview);
  if (!instance) {
    instance = new Treeview(treeview);
  }
  return instance;
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = Treeview.jQueryInterface;
    $.fn[NAME].Constructor = Treeview;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Treeview.jQueryInterface;
    };
  }
});

export default Treeview;
