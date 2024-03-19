import { typeCheckConfig, getUID, element, getjQuery, onDOMContentLoaded } from './mdb/util/index';
import Data from './mdb/dom/data';
import Manipulator from './mdb/dom/manipulator';
import EventHandler from './mdb/dom/event-handler';
import SelectorEngine from './mdb/dom/selector-engine';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'transfer';
const DATA_KEY = `mdb.${NAME}`;
const EVENT_KEY = `.${DATA_KEY}`;

const DefaultType = {
  titleSource: 'string',
  titleTarget: 'string',
  dataSource: 'array',
  dataTarget: 'array',
  search: 'boolean',
  pagination: 'boolean',
  elementsPerPage: 'number',
  oneWay: 'boolean',
  toSourceArrow: 'string',
  toTargetArrow: 'string',
  selectAll: 'boolean',
  noDataText: 'string',
};

const Default = {
  titleSource: 'Source',
  titleTarget: 'Target',
  dataSource: [],
  dataTarget: [],
  search: false,
  pagination: false,
  elementsPerPage: 5,
  oneWay: false,
  toSourceArrow: '',
  toTargetArrow: '',
  selectAll: true,
  noDataText: 'No Data',
};

const EVENT_LIST_CHANGE = `listChange${EVENT_KEY}`;
const EVENT_SEARCH = `search${EVENT_KEY}`;
const EVENT_ITEM_SELECTED = `itemSelected${EVENT_KEY}`;

class Transfer {
  constructor(element, options) {
    this._element = element;
    this._options = this._getConfig(options);
    this._dataSource = this._getData(this._options.dataSource);
    this._dataTarget = this._getData(this._options.dataTarget);
    this._filteredDataSource = this._dataSource;
    this._filteredDataTarget = this._dataTarget;
    this._sourceCurrentPage = 1;
    this._targetCurrentPage = 1;

    if (this._element) {
      Data.setData(element, DATA_KEY, this);
      this._setup();
    }
  }

  // getters
  static get NAME() {
    return NAME;
  }

  // public
  dispose() {
    Data.removeData(this._element, DATA_KEY);
    this._element = null;
  }

  getTarget() {
    return this.dataTarget;
  }

  getSource() {
    return this.dataSource;
  }

  // private
  _getConfig(options) {
    const config = {
      ...Default,
      ...Manipulator.getDataAttributes(this._element),
      ...options,
    };

    typeCheckConfig(NAME, config, DefaultType);

    return config;
  }

  _getData(data) {
    const newData = [];
    data.forEach((singleObj) => {
      const newObj = {
        ...singleObj,
        id: getUID('data-mdb-'),
        data: singleObj.data,
        checked: !!singleObj.checked,
        disabled: !!singleObj.disabled,
        customId: singleObj.customId || null,
      };

      newData.push(newObj);
    });

    return newData;
  }

  _setup() {
    const { initMDB, Ripple, Input } = mdb;

    this._element.appendChild(this._createSourceContainer());
    this._element.appendChild(this._createArrows());
    this._element.appendChild(this._createTargetContainer());

    initMDB({ Ripple });

    this._element.querySelectorAll('.form-outline').forEach((formOutline) => {
      Input.getOrCreateInstance(formOutline).update();
    });
  }

  _createSourceContainer() {
    const { titleSource, pagination } = this._options;

    const sourceContainer = element('div');
    sourceContainer.className = 'transfer-source-container transfer-container';

    const NAME_OF_CONTAINER = 'source';
    sourceContainer.appendChild(
      this._createHeader(this._dataSource, titleSource, NAME_OF_CONTAINER)
    );
    if (this._options.search) {
      sourceContainer.appendChild(this._createSearchBox(NAME_OF_CONTAINER));
    }
    sourceContainer.appendChild(this._createBody(this._dataSource));
    if (pagination) {
      sourceContainer.appendChild(this._createFooter(NAME_OF_CONTAINER));
    }

    return sourceContainer;
  }

  _createArrows() {
    const arrowsContainer = element('div');
    arrowsContainer.className = 'transfer-arrows-container transfer-container';

    arrowsContainer.appendChild(this._createToSourceArrow());
    arrowsContainer.appendChild(this._createToTargetArrow());

    return arrowsContainer;
  }

  _createTargetContainer() {
    const { titleTarget, pagination } = this._options;

    const targetContainer = element('div');
    targetContainer.className = 'transfer-target-container transfer-container';

    const NAME_OF_CONTAINER = 'target';
    targetContainer.appendChild(
      this._createHeader(this._dataTarget, titleTarget, NAME_OF_CONTAINER)
    );
    if (this._options.search) {
      targetContainer.appendChild(this._createSearchBox(NAME_OF_CONTAINER));
    }
    targetContainer.appendChild(this._createBody(this._dataTarget));
    if (pagination) {
      targetContainer.appendChild(this._createFooter(NAME_OF_CONTAINER));
    }

    return targetContainer;
  }

  _createHeader(itemsList, titleText, containerName) {
    const { selectAll } = this._options;

    const containerHeader = element('div');
    containerHeader.className = 'transfer-container-header';

    const selectAllDivContainer = element('div');
    selectAllDivContainer.className = 'transfer-header-select-all-container';
    const checkboxID = getUID('transfer-check-');

    if (selectAll) {
      selectAllDivContainer.appendChild(this._createSelectAll(containerName, checkboxID));
    }
    selectAllDivContainer.appendChild(this._createTitle(titleText, checkboxID));
    containerHeader.appendChild(selectAllDivContainer);
    containerHeader.appendChild(this._createQuantity(itemsList));

    return containerHeader;
  }

  _createSelectAll(containerName, checkboxID) {
    const selectAll = element('input');
    selectAll.setAttribute('type', 'checkbox');
    selectAll.className = 'transfer-header-select-all form-check-input';
    selectAll.setAttribute('data-mdb-select-all', false);
    selectAll.id = checkboxID;

    EventHandler.on(selectAll, 'click', (e) => {
      const dataToToggle = containerName === 'target' ? this._dataTarget : this._dataSource;
      this._toggleSelection(e.target, dataToToggle);
      this._updateInfo();
    });

    return selectAll;
  }

  _toggleSelection(selectAll, itemsList) {
    const checkboxChecked = selectAll.getAttribute('data-mdb-select-all') === 'true';

    if (checkboxChecked) {
      selectAll.setAttribute('data-mdb-select-all', 'false');
      selectAll.checked = false;
      this._unselectAll(selectAll, itemsList);
    } else {
      selectAll.setAttribute('data-mdb-select-all', 'true');
      selectAll.checked = true;
      this._selectAll(selectAll, itemsList);
    }
  }

  _selectAll(selectAll, itemsList) {
    const container = SelectorEngine.parents(selectAll, '.transfer-container')[0];
    const itemsEl = SelectorEngine.find('.transfer-body-item input', container);
    itemsEl.forEach((item) => {
      if (!item.classList.contains('transfer-body-item-checkbox-disabled')) {
        item.checked = 'true';
        item.setAttribute('data-mdb-checked', 'true');
      }
    });

    itemsList.forEach((item) => {
      if (!item.disabled) {
        item.checked = true;
      }
    });
  }

  _unselectAll(selectAll, itemsList) {
    const container = SelectorEngine.parents(selectAll, '.transfer-container')[0];
    const itemsEl = SelectorEngine.find('.transfer-body-item > input', container);
    itemsEl.forEach((item) => {
      item.checked = false;
      item.setAttribute('data-mdb-checked', 'false');
    });

    itemsList.forEach((item) => {
      item.checked = false;
    });
  }

  _createTitle(titleText, checkboxID) {
    const title = element('label');
    title.className = 'form-check-label';
    title.textContent = titleText;
    title.setAttribute('for', checkboxID);

    return title;
  }

  _createQuantity(itemsList) {
    const quantity = element('span');
    quantity.className = 'transfer-header-quantity';

    let currentChecked = 0;
    itemsList.forEach((singleData) => {
      if (singleData.checked) {
        currentChecked++;
      }
    });

    quantity.innerHTML = `<span class="current-checked">${currentChecked}</span>/
    <span class="transfer-header-full-quantity">${itemsList.length}</span>`;

    return quantity;
  }

  _createSearchBox(containerName) {
    const formOutline = element('div');
    formOutline.className = 'form-outline transfer-search-outline';
    formOutline.setAttribute('data-mdb-input-init', '');
    formOutline.style.width = 'auto';

    const searchInput = element('input');
    searchInput.setAttribute('type', 'search');
    searchInput.className = 'transfer-search form-control';
    searchInput.id = `transfer-search-${containerName}`;

    this._addEventsHandlers('input', searchInput, containerName);

    const label = element('label');
    label.className = 'form-label';
    label.textContent = 'Search';
    label.setAttribute('for', `transfer-search-${containerName}`);

    formOutline.appendChild(searchInput);
    formOutline.appendChild(label);

    new mdb.Input(formOutline).init();

    return formOutline;
  }

  _addEventsHandlers(event, el, containerName) {
    EventHandler.on(el, event, (e) => {
      const searchKey = e.target.value;

      EventHandler.trigger(this._element, EVENT_SEARCH, { searchValue: searchKey });

      this._findInList(searchKey, containerName);
      this._createFilteredList(containerName);
    });
  }

  _findInList(searchKey, containerName) {
    const isSource = containerName === 'source';
    const data = isSource ? this._dataSource : this._dataTarget;

    const filteredData = data.filter((item) => {
      const lowerText = item.data.toLowerCase();
      const lowerKey = searchKey.toLowerCase();
      return lowerText.includes(lowerKey) ? item : false;
    });

    if (isSource) {
      this._filteredDataSource = filteredData;
    } else {
      this._filteredDataTarget = filteredData;
    }
  }

  _createFilteredList(containerName) {
    const isSource = containerName === 'source';
    const filteredData = isSource ? this._filteredDataSource : this._filteredDataTarget;

    const container = isSource
      ? SelectorEngine.findOne('.transfer-source-container > .transfer-body', this._element)
      : SelectorEngine.findOne('.transfer-target-container > .transfer-body', this._element);

    const items = SelectorEngine.find('.transfer-body-item', container);

    items.forEach((item) => {
      container.removeChild(item);
    });

    const currentPage = isSource ? this._sourceCurrentPage : this._targetCurrentPage;

    if (this._options.pagination) {
      const endIndex = currentPage * this._options.elementsPerPage;
      const startIndex = endIndex - this._options.elementsPerPage;

      filteredData.forEach((data, index) => {
        if (index >= startIndex && index < endIndex) {
          container.appendChild(this._createBodyItem(data));
        }
      });
    } else {
      filteredData.forEach((data) => {
        container.appendChild(this._createBodyItem(data));
      });
    }
  }

  _createBody(itemsList) {
    const containerBody = element('ul');
    containerBody.className = 'transfer-body';

    if (!itemsList.length) {
      containerBody.appendChild(this._createNoData());
      containerBody.classList.add('transfer-body-no-data');

      return containerBody;
    }

    itemsList.forEach((item, index) => {
      if (this._options.pagination) {
        if (index < this._options.elementsPerPage) {
          containerBody.appendChild(this._createBodyItem(item));
        }
      } else {
        containerBody.appendChild(this._createBodyItem(item));
      }
    });

    return containerBody;
  }

  _createNoData() {
    const noData = element('div');
    noData.className = 'transfer-body-no-data';
    noData.innerHTML = `
    <i class="far fa-folder-open transfer-no-data-mdb-icon"></i>
    <span>${this._options.noDataText}</span>`;

    return noData;
  }

  _createBodyItem(item) {
    const bodyItem = element('li');
    bodyItem.className = 'transfer-body-item';

    bodyItem.appendChild(this._createItemCheckbox(item));
    bodyItem.appendChild(this._createItemText(item));

    return bodyItem;
  }

  _createItemCheckbox(item) {
    const checkbox = element('input');
    checkbox.setAttribute('type', 'checkbox');
    checkbox.className = `transfer-body-item-checkbox form-check-input ${
      item.disabled ? 'transfer-body-item-checkbox-disabled' : ''
    }`;
    checkbox.id = item.id;
    checkbox.checked = item.checked;
    checkbox.disabled = item.disabled;
    checkbox.setAttribute('data-mdb-checked', item.checked);

    EventHandler.on(checkbox, 'click', () => {
      this._toggleCheckbox(checkbox, item);
      this._updateInfo();

      EventHandler.trigger(this._element, EVENT_ITEM_SELECTED, { item });
    });

    return checkbox;
  }

  _toggleCheckbox(checkbox, item) {
    const checked = checkbox.getAttribute('data-mdb-checked');

    if (checked === 'true') {
      checkbox.setAttribute('data-mdb-checked', 'false');
      item.checked = false;
    } else {
      checkbox.setAttribute('data-mdb-checked', 'true');
      item.checked = true;
    }
  }

  _createItemText(item) {
    const text = element('label');
    text.className = `transfer-body-item-text form-check-label ${
      item.disabled ? 'transfer-body-item-text-disabled' : ''
    }`;
    text.setAttribute('for', item.id);
    text.textContent = item.data;

    return text;
  }

  _createFooter(containerName) {
    const containerFooter = element('div');
    containerFooter.className = 'transfer-footer';

    containerFooter.appendChild(this._createArrowPrev(containerName));
    containerFooter.appendChild(this._createCurrentPageNum(containerName));
    containerFooter.appendChild(this._createArrowNext(containerName));

    return containerFooter;
  }

  _createArrowPrev(containerName) {
    const arrowPrevPage = element('button');
    Manipulator.setDataAttribute(arrowPrevPage, 'rippleInit', '');
    arrowPrevPage.className = 'btn btn-outline-primary btn-floating btn-sm transfer-footer-arrow';
    arrowPrevPage.innerHTML = '<i class="fas fa-angle-left"></i>';

    EventHandler.on(arrowPrevPage, 'click', () => {
      this._prevPageUpdate(containerName);
      this._reloadPage(containerName);
    });

    return arrowPrevPage;
  }

  _prevPageUpdate(containerName) {
    const isSource = containerName === 'source';
    const currentPageNumber = isSource ? this._sourceCurrentPage : this._targetCurrentPage;
    const isFirstPage = currentPageNumber === 1;

    const numOfPrevPage = isFirstPage ? 1 : currentPageNumber - 1;

    if (isSource) this._sourceCurrentPage = numOfPrevPage;
    else this._targetCurrentPage = numOfPrevPage;
  }

  _reloadPage(containerName) {
    const isSource = containerName === 'source';
    const container = isSource
      ? SelectorEngine.findOne('.transfer-source-container > .transfer-body', this._element)
      : SelectorEngine.findOne('.transfer-target-container > .transfer-body', this._element);

    const items = SelectorEngine.find('.transfer-body-item', container);

    items.forEach((item) => {
      container.removeChild(item);
    });

    this._createPage(isSource, container);
    this._reloadNumOfPage(isSource);
  }

  _createPage(isSource, container) {
    const searchBoxExist = this._options.search;
    const searchBox = isSource
      ? SelectorEngine.findOne('.transfer-source-container .transfer-search', this._element)
      : SelectorEngine.findOne('.transfer-target-container .transfer-search', this._element);
    const valueInSearchBox = searchBoxExist && searchBox.value;

    const dataOriginal = isSource ? this._dataSource : this._dataTarget;
    const dataFiltered = isSource ? this._filteredDataSource : this._filteredDataTarget;
    const itemsList = valueInSearchBox ? dataFiltered : dataOriginal;
    const currentPage = isSource ? this._sourceCurrentPage : this._targetCurrentPage;
    const endIndex = currentPage * this._options.elementsPerPage;
    const startIndex = endIndex - this._options.elementsPerPage;

    itemsList.forEach((data, index) => {
      if (index >= startIndex && index < endIndex) {
        container.appendChild(this._createBodyItem(data));
      }
    });
  }

  _reloadNumOfPage(isSource) {
    const sourceFooter = SelectorEngine.findOne(
      '.transfer-source-container .transfer-footer-current-page',
      this._element
    );
    const targetFooter = SelectorEngine.findOne(
      '.transfer-target-container .transfer-footer-current-page',
      this._element
    );

    const numOfPageEl = isSource ? sourceFooter : targetFooter;

    numOfPageEl.textContent = isSource ? this._sourceCurrentPage : this._targetCurrentPage;
  }

  _createCurrentPageNum(containerName) {
    const currentPageNum = element('span');
    currentPageNum.className = 'transfer-footer-current-page';
    currentPageNum.textContent =
      containerName === 'source' ? this._sourceCurrentPage : this._targetCurrentPage;

    return currentPageNum;
  }

  _createArrowNext(containerName) {
    const arrowNextPage = element('button');
    Manipulator.setDataAttribute(arrowNextPage, 'rippleInit', '');
    arrowNextPage.className = 'btn btn-outline-primary btn-floating btn-sm transfer-footer-arrow';
    arrowNextPage.innerHTML = '<i class="fas fa-angle-right"></i>';

    EventHandler.on(arrowNextPage, 'click', () => {
      this._nextPageUpdate(containerName);
      this._reloadPage(containerName);
    });

    return arrowNextPage;
  }

  _nextPageUpdate(containerName) {
    const isSource = containerName === 'source';
    const currentPageNumber = isSource ? this._sourceCurrentPage : this._targetCurrentPage;

    const searchBoxExist = this._options.search;
    const searchBox = isSource
      ? SelectorEngine.findOne('.transfer-source-container .transfer-search', this._element)
      : SelectorEngine.findOne('.transfer-target-container .transfer-search', this._element);
    const valueInSearchBox = searchBoxExist && searchBox.value;

    const dataOriginal = isSource ? this._dataSource : this._dataTarget;
    const dataFiltered = isSource ? this._filteredDataSource : this._filteredDataTarget;

    const dataLen = valueInSearchBox ? dataFiltered.length : dataOriginal.length;
    const numOfLastPage = dataLen === 0 ? 1 : Math.ceil(dataLen / this._options.elementsPerPage);

    const numOfNextPage =
      currentPageNumber === numOfLastPage ? numOfLastPage : currentPageNumber + 1;

    if (isSource) this._sourceCurrentPage = numOfNextPage;
    else this._targetCurrentPage = numOfNextPage;
  }

  _createToSourceArrow() {
    const toSourceArrow = element('button');
    Manipulator.setDataAttribute(toSourceArrow, 'rippleInit', '');
    toSourceArrow.className = 'btn btn-primary transfer-arrows-arrow';
    toSourceArrow.textContent = '<';

    EventHandler.on(toSourceArrow, 'click', () => {
      const targetContainer = SelectorEngine.findOne(
        '.transfer-target-container > .transfer-body',
        this._element
      );
      const sourceContainer = SelectorEngine.findOne(
        '.transfer-source-container > .transfer-body',
        this._element
      );
      const els = SelectorEngine.find('[data-mdb-checked="true"]', targetContainer);

      this._handleSendToSource();
      this._removeItems(els, targetContainer);
      this._uncheckItems(els);
      this._addItems(els, sourceContainer);
      this._updateInfo();
      if (this._options.pagination) {
        this._targetCurrentPage = 1;
        this._reloadPage('source');
        this._reloadPage('target');
      }
      if (this._options.search) {
        this._targetCurrentPage = 1;
        this._filteredDataTarget = this._dataTarget;
        this._createFilteredList('target');
        this._clearSearchBoxes();
      }
    });

    if (this._options.oneWay) {
      toSourceArrow.setAttribute('disabled', true);
    }

    return toSourceArrow;
  }

  _handleSendToSource() {
    const itemsToSend = [];
    this._dataTarget.forEach((item) => {
      if (item.checked) {
        itemsToSend.push(item);
      }
    });

    EventHandler.trigger(this._element, EVENT_LIST_CHANGE, { sentItems: itemsToSend });

    this._dataTarget = this._dataTarget.filter((item) => {
      const isNotCheck = !item.checked;
      item.checked = false;
      return isNotCheck;
    });
    this._dataSource = [...this._dataSource, ...itemsToSend];
  }

  _removeItems(els, parent) {
    els.forEach((el) => {
      parent.removeChild(el.parentNode);
    });
  }

  _uncheckItems(els = []) {
    els.forEach((el) => {
      el.setAttribute('data-mdb-checked', false);
      el.checked = false;
    });

    const checkAllEls = SelectorEngine.find('.transfer-header-select-all', this._element);

    checkAllEls.forEach((checkbox) => {
      checkbox.setAttribute('data-mdb-select-all', 'false');
      checkbox.checked = false;
    });
  }

  _addItems(els, parent) {
    els.forEach((el) => {
      parent.appendChild(el.parentNode);
    });
  }

  _createToTargetArrow() {
    const toTargetArrow = element('button');
    Manipulator.setDataAttribute(toTargetArrow, 'rippleInit', '');
    toTargetArrow.className = 'btn btn-primary transfer-arrows-arrow';
    toTargetArrow.textContent = '>';

    EventHandler.on(toTargetArrow, 'click', () => {
      const targetContainer = SelectorEngine.findOne(
        '.transfer-target-container > .transfer-body',
        this._element
      );
      const sourceContainer = SelectorEngine.findOne(
        '.transfer-source-container > .transfer-body',
        this._element
      );
      const els = SelectorEngine.find('[data-mdb-checked="true"]', sourceContainer);

      this._handleSendToTarget();
      this._removeItems(els, sourceContainer);
      this._uncheckItems(els);
      this._addItems(els, targetContainer);
      this._updateInfo();
      if (this._options.pagination) {
        this._sourceCurrentPage = 1;
        this._reloadPage('source');
        this._reloadPage('target');
      }
      if (this._options.search) {
        this._sourceCurrentPage = 1;
        this._filteredDataSource = this._dataSource;
        this._createFilteredList('source');
        this._clearSearchBoxes();
      }
    });

    return toTargetArrow;
  }

  _handleSendToTarget() {
    const itemsToSend = [];
    this._dataSource.forEach((item) => {
      if (item.checked) itemsToSend.push(item);
    });

    EventHandler.trigger(this._element, EVENT_LIST_CHANGE, { sentItems: itemsToSend });

    this._dataSource = this._dataSource.filter((item) => {
      const isNotCheck = !item.checked;
      item.checked = false;
      return isNotCheck;
    });
    this._dataTarget = [...this._dataTarget, ...itemsToSend];
  }

  _updateInfo() {
    this._updateNoData();
    this._updateCurrentInStockNumber();
    this._updateSelectedItemsNumber();
  }

  _updateNoData() {
    const dataInSource = !!this._dataSource.length;
    const dataInTarget = !!this._dataTarget.length;
    const bodySource = SelectorEngine.findOne(
      '.transfer-source-container .transfer-body',
      this._element
    );

    const bodyTarget = SelectorEngine.findOne(
      '.transfer-target-container .transfer-body',
      this._element
    );

    if (dataInSource) {
      bodySource.classList.remove('transfer-body-no-data');
      const noDataEl = SelectorEngine.findOne('.transfer-body-no-data', bodySource);
      if (noDataEl) bodySource.removeChild(noDataEl);
    } else {
      bodySource.classList.add('transfer-body-no-data');
      const noDataEl = SelectorEngine.findOne('.transfer-body-no-data', bodySource);
      if (!noDataEl) bodySource.appendChild(this._createNoData());
    }

    if (dataInTarget) {
      bodyTarget.classList.remove('transfer-body-no-data');

      const noDataEl = SelectorEngine.findOne('.transfer-body-no-data', bodyTarget);
      if (noDataEl) bodyTarget.removeChild(noDataEl);
    } else {
      bodyTarget.classList.add('transfer-body-no-data');
      const noDataEl = SelectorEngine.findOne('.transfer-body-no-data', bodyTarget);
      if (!noDataEl) bodyTarget.appendChild(this._createNoData());
    }
  }

  _updateCurrentInStockNumber() {
    const targetContainer = SelectorEngine.findOne('.transfer-target-container', this._element);
    const sourceContainer = SelectorEngine.findOne('.transfer-source-container', this._element);

    const quantityTarget = SelectorEngine.findOne(
      '.transfer-header-full-quantity',
      targetContainer
    );

    const quantitySource = SelectorEngine.findOne(
      '.transfer-header-full-quantity',
      sourceContainer
    );

    quantitySource.textContent = this._dataSource.length;
    quantityTarget.textContent = this._dataTarget.length;
  }

  _updateSelectedItemsNumber() {
    this._selectedInSource();
    this._selectedInTarget();
  }

  _selectedInSource() {
    let numberSelectedInSource = 0;
    let numberDisabledInSource = 0;

    this._dataSource.forEach((data) => {
      if (data.checked) {
        numberSelectedInSource++;
      }

      if (data.disabled) {
        numberDisabledInSource++;
      }
    });

    const sourceCurrentCheckedEl = SelectorEngine.findOne(
      '.transfer-source-container .current-checked',
      this._element
    );

    const sourceSelectAll = SelectorEngine.findOne(
      '.transfer-source-container .transfer-header-select-all',
      this._element
    );

    sourceCurrentCheckedEl.textContent = numberSelectedInSource;
    const numOfSelectedEqualAllElsInSource =
      numberSelectedInSource === this._dataSource.length - numberDisabledInSource;
    const notOnlyDisabledLeftSource = this._dataSource.length !== numberDisabledInSource;

    if (
      numOfSelectedEqualAllElsInSource &&
      this._dataSource.length !== 0 &&
      notOnlyDisabledLeftSource
    ) {
      sourceSelectAll.checked = true;
      sourceSelectAll.setAttribute('data-mdb-select-all', 'true');
    } else {
      sourceSelectAll.checked = false;
      sourceSelectAll.setAttribute('data-mdb-select-all', 'false');
    }
  }

  _selectedInTarget() {
    let numberSelectedInTarget = 0;
    let numberDisabledInTarget = 0;

    this._dataTarget.forEach((data) => {
      if (data.checked) {
        numberSelectedInTarget++;
      }

      if (data.disabled) {
        numberDisabledInTarget++;
      }
    });

    const targetCurrentCheckedEl = SelectorEngine.findOne(
      '.transfer-target-container .current-checked',
      this._element
    );

    const targetSelectAll = SelectorEngine.findOne(
      '.transfer-target-container .transfer-header-select-all',
      this._element
    );

    targetCurrentCheckedEl.textContent = numberSelectedInTarget;
    const numOfSelectedEqualAllElsInTarget =
      numberSelectedInTarget === this._dataTarget.length - numberDisabledInTarget;
    const notOnlyDisabledLeftTarget = this._dataTarget.length !== numberDisabledInTarget;

    if (
      numOfSelectedEqualAllElsInTarget &&
      this._dataTarget.length !== 0 &&
      notOnlyDisabledLeftTarget
    ) {
      targetSelectAll.checked = true;
      targetSelectAll.setAttribute('data-mdb-select-all', 'true');
    } else {
      targetSelectAll.checked = false;
      targetSelectAll.setAttribute('data-mdb-select-all', 'false');
    }
  }

  _clearSearchBoxes() {
    const searchBoxes = SelectorEngine.find('.transfer-search', this._element);

    searchBoxes.forEach((searchBox) => {
      searchBox.value = '';
    });
  }

  // static
  static getInstance(element) {
    return Data.getData(element, DATA_KEY);
  }

  static jQueryInterface(config) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data) {
        data = new Transfer(this, _config);
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
 * jQuery
 * ------------------------------------------------------------------------
 * */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = Transfer.jQueryInterface;
    $.fn[NAME].Constructor = Transfer;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Transfer.jQueryInterface;
    };
  }
});

export default Transfer;
