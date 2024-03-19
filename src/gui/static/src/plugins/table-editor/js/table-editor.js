import FocusTrap from './mdb/util/focusTrap';
import PerfectScrollbar from './mdb/perfect-scrollbar';
import { getjQuery, typeCheckConfig, onDOMContentLoaded } from './mdb/util/index';
import Data from './mdb/dom/data';
import EventHandler from './mdb/dom/event-handler';
import Manipulator from './mdb/dom/manipulator';
import SelectorEngine from './mdb/dom/selector-engine';
import tableTemplate from './table/html/table'; //eslint-disable-line
import { getModalContent, getModal } from './table/html/modal';
import {
  search,
  sort,
  paginate,
  getCSSValue,
  formatRows,
  formatColumns,
  getRowIndex,
} from './table/util';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'tableEditor';
const DATA_KEY = `mdb.${NAME}`;

const CLASS_EDITED_ROW = 'edited-row';
const CLASS_EDIT_MODE = 'edited-table';
const CLASS_FIXED_CELL = 'fixed-cell';
const CLASS_TABLE_EDITOR = 'table-editor';

const SELECTOR_ADD_BTN = '[data-mdb-add-entry]';
const SELECTOR_BODY = '.table-editor__inner';
const SELECTOR_CELL = 'td';
const SELECTOR_DELETE_BTN = '.delete-button';
const SELECTOR_DISCARD_BTN = '.discard-button';
const SELECTOR_EDIT_BTN = '.edit-button';
const SELECTOR_EDIT_MODAL = '.table-editor .modal';
const SELECTOR_HEAD = 'thead';
const SELECTOR_HEADER = 'th';
const SELECTOR_INPUT = 'input';
const SELECTOR_INPUT_SELECT = '.table-editor__input-select';
const SELECTOR_INPUT_WRAPPER = '.form-outline';
const SELECTOR_MODAL_BODY = '.modal-body';
const SELECTOR_MODAL_HEADER = '.modal-header';
const SELECTOR_MODAL_SAVE_BTN = '.modal-save-button';
const SELECTOR_MODAL_DISCARD_BTN = '.modal-discard-button';
const SELECTOR_PAGINATION_RIGHT = '.table-editor__pagination-right';
const SELECTOR_PAGINATION_LEFT = '.table-editor__pagination-left';
const SELECTOR_PAGINATION_START = '.table-editor__pagination-start';
const SELECTOR_PAGINATION_END = '.table-editor__pagination-end';
const SELECTOR_PAGINATION_NAV = '.table-editor__pagination-nav';
const SELECTOR_POPCONFIRM_TOGGLE = '.popconfirm-toggle';
const SELECTOR_ROW = 'tr';
const SELECTOR_SAVE_BTN = '.save-button';
const SELECTOR_SEARCH_FIELD = '[data-mdb-search]';
const SELECTOR_SELECT = '.table-editor__select';
const SELECTOR_SORT_ICON = '.table-editor__sort-icon';
const SELECTOR_TABLE_BODY = 'tbody';

const SELECTOR_DATA_INIT = '[data-mdb-table-editor-init]';

const EVENT_ADD = 'add.mdb.tableEditor';
const EVENT_DELETE = 'delete.mdb.tableEditor';
const EVENT_RENDER = 'render.mdb.tableEditor';
const EVENT_START_EDIT = 'edit.mdb.tableEditor';
const EVENT_EXIT_EDITOR = 'editorExit.mdb.tableEditor';
const EVENT_UPDATE = 'update.mdb.tableEditor';
const EVENT_OPEN_EDITOR = 'editorOpen.mdb.tableEditor';

const SELECT_VALUE_CHANGED_EVENT = 'valueChanged.mdb.select';
const POPCONFIRM_CONFIRM_EVENT = 'confirm.mdb.popconfirm';

const DEFAULT_COLUMN = {
  columnIndex: 0,
  defaultValue: null,
  editable: true,
  field: '',
  fixed: false,
  inputType: 'text',
  label: '',
  options: null,
  sort: true,
  width: null,
};

const TYPE_COLUMN_FIELDS = {
  columnIndex: 'number',
  defaultValue: '(string|null)',
  editable: 'boolean',
  field: 'string',
  fixed: '(boolean|string)',
  inputType: 'string',
  label: 'string',
  options: '(array|null)',
  width: '(number|null)',
  sort: 'boolean',
};

const DEFAULT_OPTIONS = {
  actionHeader: 'Actions',
  actionPosition: 'end',
  bordered: false,
  borderless: false,
  borderColor: null,
  cancelText: 'Cancel',
  confirm: false,
  confirmText: 'Delete',
  confirmMessage: 'Are you sure you want to delete this entry?',
  color: null,
  dark: false,
  defaultValue: '',
  editItemHeader: 'Edit item',
  entries: 10,
  entriesOptions: [10, 25, 50, 200],
  fixedHeader: false,
  fullPagination: false,
  hover: false,
  loaderClass: 'bg-primary',
  loading: false,
  loadingMessage: 'Loading results...',
  maxWidth: null,
  maxHeight: null,
  mode: 'inline',
  newItemHeader: 'New item',
  noFoundMessage: 'No matching results found',
  pagination: true,
  saveText: 'Save',
  sm: false,
  striped: false,
  rowsText: 'Rows per page:',
};

const TYPE_OPTIONS = {
  actionHeader: 'string',
  actionPosition: 'string',
  bordered: 'boolean',
  borderless: 'boolean',
  borderColor: '(string|null)',
  cancelText: 'string',
  color: '(string|null)',
  confirm: 'boolean',
  defaultValue: 'string',
  editItemHeader: 'string',
  entries: 'number',
  entriesOptions: 'array',
  fixedHeader: 'boolean',
  fullPagination: 'boolean',
  hover: 'boolean',
  loaderClass: 'string',
  loading: 'boolean',
  loadingMessage: 'string',
  maxWidth: '(null|number|string)',
  maxHeight: '(null|number|string)',
  mode: 'string',
  newItemHeader: 'string',
  noFoundMessage: 'string',
  pagination: 'boolean',
  rowsText: 'string',
  saveText: 'string',
  sm: 'boolean',
  striped: 'boolean',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class TableEditor {
  constructor(element, data = {}, options = {}) {
    this._element = element;

    this._options = this._getOptions(options);

    this._addBtn = this._getDOMElement(SELECTOR_ADD_BTN);
    this._searchField = this._getDOMElement(SELECTOR_SEARCH_FIELD);

    // sorting
    this._sortField = null;
    this._sortOrder = null;
    this._sortReverse = false;

    // search
    this._search = '';
    this._searchColumn = null;

    // pagination
    this._activePage = 0;
    this._paginationLeft = null;
    this._paginationRight = null;
    this._paginationStart = null;
    this._paginationEnd = null;
    this._select = null;
    this._selectInstance = null;

    // data
    this._columns = this._getColumns(data.columns);
    this._rows = this._getRows(data.rows);

    // edit mode
    this._editMode = false;
    this._selectedIndex = null;
    this._tempRow = null;
    this._newRow = null;

    // mode
    this._inline = this._options.mode !== 'modal';
    this._modalInstance = null;
    this._modal = null;
    this._timeout = null;

    this._popconfirmInstances = [];

    if (this._element) {
      Data.setData(element, DATA_KEY, this);

      this._perfectScrollbar = null;
      this._focusTrap = null;

      this._setup();
    }
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  get rows() {
    return this._rows.map((row, index) => {
      const output = {
        rowIndex: index,
      };

      this._columns.forEach((column) => {
        output[column.field] =
          row[column.field] === null
            ? column.defaultValue || this._options.defaultValue
            : row[column.field];
      });

      return output;
    });
  }

  get searchResult() {
    return search(this.rows, this._search, this._searchColumn);
  }

  get emptyRow() {
    // New row should initialize with default values (general or specific for each column)
    const row = {};

    this._columns.forEach((column) => {
      row[column.field] = column.defaultValue || this._options.defaultValue;
    });

    return row;
  }

  get computedRows() {
    let result = [...this.searchResult];

    if (this._sortOrder) {
      result = sort({ rows: result, field: this._sortField, order: this._sortOrder });
    }

    if (this._options.pagination) {
      result = paginate({
        rows: result,
        entries: this._options.entries,
        activePage: this._activePage,
      });
    }

    if (this._newRow && this._inline) {
      return [this._newRow, ...result];
    }

    return result;
  }

  get pages() {
    return Math.ceil(this.searchResult.length / this._options.entries) || 1;
  }

  get navigationText() {
    const firstVisibleEntry = this._activePage * this._options.entries;
    return `${firstVisibleEntry + 1} - ${this.computedRows.length + firstVisibleEntry} of ${
      this.searchResult.length
    }`;
  }

  get selectedRow() {
    return SelectorEngine.findOne(`tr[data-mdb-index="${this._selectedIndex}"]`, this._element);
  }

  get editElement() {
    return this._inline
      ? this.selectedRow
      : SelectorEngine.findOne(SELECTOR_EDIT_MODAL, this._element);
  }

  get modalHeader() {
    return this._newRow ? this._options.newItemHeader : this._options.editItemHeader;
  }

  get classNames() {
    return [
      CLASS_TABLE_EDITOR,
      this._options.color,
      this._options.borderColor && `border-${this._options.borderColor}`,
      this._options.dark && 'dark',
      this._options.hover && 'hover',
      this._options.bordered && 'bordered',
      this._options.borderless && 'borderless',
      this._options.sm && 'sm',
      this._options.striped && 'striped',
      this._options.loading && 'loading',
    ].filter((className) => className);
  }

  get tableOptions() {
    return {
      columns: this._columns,
      rows: this.computedRows,
      inline: this._inline,
      confirm: this._options.confirm,
      noFoundMessage: this._options.noFoundMessage,
      loading: this._options.loading,
      loaderClass: this._options.loaderClass,
      loadingMessage: this._options.loadingMessage,
      editMode: this._editMode,
      editedRow: this._selectedIndex,
      dark: this._options.dark,
      action: {
        header: this._options.actionHeader,
        position: this._options.actionPosition,
        fixed: this._options.actionFixed,
      },
      pagination: {
        enable: this._options.pagination,
        text: this.navigationText,
        entries: this._options.entries,
        entriesOptions: this._options.entriesOptions,
        fullPagination: this._options.fullPagination,
        rowsText: this._options.rowsText,
      },
    };
  }

  // Public

  add(customRow = {}) {
    this._newRow = { ...this.emptyRow, ...customRow, rowIndex: -1 };

    this._renderRows();

    this._editRow(-1);
  }

  dispose() {
    clearTimeout(this._timeout);

    if (this._options.confirm) {
      this._popconfirmInstances.forEach((instance) => instance.dispose());
    }

    if (this._modalInstance) {
      this._modalInstance.dispose();
    }

    if (this._selectInstance) {
      this._selectInstance.dispose();
    }

    Data.removeData(this._element, DATA_KEY);

    this._removeEventListeners();

    this._perfectScrollbar.destroy();

    this._element = null;
  }

  search(string, column) {
    this._search = string;

    this._searchColumn = column;

    this._activePage = 0;

    if (this._options.pagination) {
      this._toggleDisableState();
    }

    this._renderRows();
  }

  update(data, options = {}) {
    if (data && data.rows) {
      this._rows = data.rows;
    }

    if (data && data.columns) {
      this._columns = data.columns;
    }

    this._clearClassList(options);

    this._options = this._getOptions({ ...this._options, ...options });

    this._setup();
  }

  // Private

  _changeActivePage(index) {
    this._activePage = index;

    this._toggleDisableState();

    this._renderRows();
  }

  _clearClassList(options) {
    if (this._options.color && options.color) {
      Manipulator.removeClass(this._element, this._options.color);
    }

    if (this._options.borderColor && options.borderColor) {
      Manipulator.removeClass(this._element, `border-${this._options.borderColor}`);
    }

    ['dark', 'hover', 'bordered', 'borderless', 'sm', 'striped', 'loading'].forEach((option) => {
      if (this._options[option] && !options[option]) {
        Manipulator.removeClass(this._element, option);
      }
    });
  }

  _createModal() {
    this._modal = getModal(this._options.saveText, this._options.cancelText, this._options.dark);

    this._element.appendChild(this._modal);
    this._modalInstance = new mdb.Modal(this._modal, { backdrop: 'static', keyboard: false });

    this._setupModalButtons();
  }

  _deleteRow(index) {
    const removedRow = { ...this._rows[index] };

    const deleteEvent = EventHandler.trigger(this._element, EVENT_DELETE, { row: removedRow });
    if (deleteEvent.defaultPrevented) {
      deleteEvent.preventDefault();
      return;
    }

    this._rows = this._rows.filter((_, i) => i !== index);

    this._renderRows();

    this._refreshPagination();

    this._triggerUpdate(removedRow, 'delete');
  }

  _disableDOMElements() {
    [this._addBtn, this._searchField]
      .filter((el) => el)
      .forEach((el) => {
        el.setAttribute('disabled', true);
      });
  }

  _editRow(index) {
    const openEditorEvent = EventHandler.trigger(this._element, EVENT_OPEN_EDITOR);
    if (openEditorEvent.defaultPrevented) {
      openEditorEvent.preventDefault();
      return;
    }

    this._editMode = true;

    this._selectedIndex = index;
    this._tempRow = this._newRow || { ...this._rows[this._selectedIndex] };

    this._disableDOMElements();

    this._renderRows();

    this._setEditClassName();

    if (!this._inline) {
      this._setModalBody();
      this._modalInstance.show();
    }

    this._setInputs();

    this._setFocusTrap();
  }

  _enableDOMElements() {
    [this._addBtn, this._searchField]
      .filter((el) => el)
      .forEach((el) => {
        el.removeAttribute('disabled');
      });
  }

  _exitEditMode() {
    this._selectedIndex = null;
    this._tempRow = null;
    this._editMode = false;

    this._focusTrap = null;
    this._newRow = null;

    this._renderRows();

    Manipulator.removeClass(this._element, CLASS_EDIT_MODE);

    this._enableDOMElements();

    if (!this._inline) {
      this._modalInstance.hide();
    }

    EventHandler.trigger(this._element, EVENT_EXIT_EDITOR);
  }

  _getColumns(columns = []) {
    const head = SelectorEngine.findOne(SELECTOR_HEAD, this._element);

    if (!head) {
      return formatColumns(columns, DEFAULT_COLUMN, TYPE_COLUMN_FIELDS);
    }

    const headerRow = SelectorEngine.findOne(SELECTOR_ROW, head);

    const headers = SelectorEngine.find(SELECTOR_HEADER, headerRow).map((cell) => ({
      label: cell.innerHTML,
      ...Manipulator.getDataAttributes(cell),
    }));

    return formatColumns([...headers, ...columns], DEFAULT_COLUMN, TYPE_COLUMN_FIELDS);
  }

  _getDOMElement(selector) {
    return SelectorEngine.find(selector).find((el) => {
      const id = Manipulator.getDataAttribute(el, 'target');
      return SelectorEngine.findOne(id) === this._element;
    });
  }

  _getOptions(options) {
    const config = {
      ...DEFAULT_OPTIONS,
      ...Manipulator.getDataAttributes(this._element),
      ...options,
    };

    if (typeof config.entriesOptions === 'string') {
      config.entriesOptions = JSON.parse(config.entriesOptions);
    }

    typeCheckConfig(NAME, config, TYPE_OPTIONS);
    return config;
  }

  _getRows(rows = []) {
    const body = SelectorEngine.findOne(SELECTOR_TABLE_BODY, this._element);

    if (!body) {
      return formatRows(rows, this._columns);
    }

    const tableRows = SelectorEngine.find(SELECTOR_ROW, body).map((row) => {
      return SelectorEngine.find(SELECTOR_CELL, row).map((cell) => cell.innerHTML);
    });

    return formatRows([...tableRows, ...rows], this._columns);
  }

  _renderTable() {
    this._element.innerHTML = tableTemplate(this.tableOptions).table;

    EventHandler.trigger(this._element, EVENT_RENDER);

    this._setupActionButtons();
  }

  _saveChanges() {
    const tempRowCopy = { ...this._tempRow };

    let action = '';

    if (this._newRow) {
      const addEvent = EventHandler.trigger(this._element, EVENT_ADD, { row: tempRowCopy });
      if (addEvent.defaultPrevented) {
        addEvent.preventDefault();
        return;
      }

      action = 'add';
      this._rows.push(tempRowCopy);
    } else {
      const editEvent = EventHandler.trigger(this._element, EVENT_START_EDIT, { row: tempRowCopy });
      if (editEvent.defaultPrevented) {
        editEvent.preventDefault();
        return;
      }

      action = 'edit';
      this._rows[this._selectedIndex] = tempRowCopy;
    }

    this._triggerUpdate(tempRowCopy, action);

    this._refreshPagination();

    this._exitEditMode();
  }

  _setEditClassName() {
    if (this._editMode && this._inline) {
      Manipulator.addClass(this.selectedRow, CLASS_EDITED_ROW);
      Manipulator.addClass(this._element, CLASS_EDIT_MODE);
    }
  }

  _setClassNames() {
    this.classNames.forEach((className) => {
      Manipulator.addClass(this._element, className);
    });
  }

  _setActiveSortIcon(active) {
    SelectorEngine.find(SELECTOR_SORT_ICON, this._element).forEach((icon) => {
      const angle = this._sortOrder === 'desc' && icon === active ? 180 : 0;

      Manipulator.style(icon, {
        transform: `rotate(${angle}deg)`,
      });

      if (icon === active && this._sortOrder) {
        Manipulator.addClass(icon, 'active');
      } else {
        Manipulator.removeClass(icon, 'active');
      }
    });
  }

  _setEntries(e) {
    this._options = this._getOptions({ ...this._options, entries: Number(e.target.value) });

    if (this._activePage > this.pages - 1) {
      this._activePage = this.pages - 1;
    }

    this._toggleDisableState();

    this._renderRows();
  }

  _setFocusTrap() {
    // set a delay to ensure focusing input after modal's transition
    const delay = this._inline ? 0 : 200;

    this._timeout = setTimeout(() => {
      this._focusTrap = new FocusTrap(this.editElement);
      this._focusTrap.trap();

      const firstInput = SelectorEngine.findOne(SELECTOR_INPUT, this.editElement);

      if (firstInput) {
        firstInput.focus();
      }
    }, delay);
  }

  _setInputs() {
    SelectorEngine.find(SELECTOR_INPUT_WRAPPER, this._element).forEach((element) => {
      new mdb.Input(element).init();
    });

    SelectorEngine.find(SELECTOR_INPUT_SELECT, this._element).forEach((element) => {
      new mdb.Select(element); // eslint-disable-line
    });

    SelectorEngine.find(SELECTOR_INPUT, this.editElement).forEach((input) => {
      input.addEventListener('input', (e) => this._updateValue(e));
    });

    SelectorEngine.find(SELECTOR_INPUT_SELECT, this.editElement).forEach((select) => {
      select.addEventListener(SELECT_VALUE_CHANGED_EVENT, (e) => {
        this._updateValue(e);
      });
    });
  }

  _setModalBody() {
    const content = getModalContent(
      this._tempRow,
      this._columns,
      this.modalHeader,
      this._options.dark
    );

    SelectorEngine.findOne(SELECTOR_MODAL_BODY, this._modal).innerHTML = content.body;
    SelectorEngine.findOne(SELECTOR_MODAL_HEADER, this._modal).innerHTML = content.header;
  }

  _setup() {
    const { initMDB, Ripple } = mdb;
    initMDB({ Ripple });

    this._setClassNames();

    this._renderTable();

    if (this._options.pagination) {
      this._setupPagination();
    }

    if (this._options.selectable) {
      this._setupSelectable();
    }

    this._setupScroll();

    this._setupSort();

    if (!this._inline) {
      this._createModal();
    }

    if (this._options.loading) {
      this._disableDOMElements();
    } else {
      this._enableDOMElements();
    }
  }

  _setupModalButtons() {
    EventHandler.on(
      SelectorEngine.findOne(SELECTOR_MODAL_SAVE_BTN, this.editElement),
      'click',
      () => this._saveChanges()
    );

    EventHandler.on(
      SelectorEngine.findOne(SELECTOR_MODAL_DISCARD_BTN, this.editElement),
      'click',
      () => this._exitEditMode()
    );
  }

  _setupActionButtons() {
    if (this._editMode) {
      EventHandler.on(SelectorEngine.findOne(SELECTOR_SAVE_BTN, this.editElement), 'click', () =>
        this._saveChanges()
      );

      EventHandler.on(SelectorEngine.findOne(SELECTOR_DISCARD_BTN, this.editElement), 'click', () =>
        this._exitEditMode()
      );
    } else {
      SelectorEngine.find(SELECTOR_EDIT_BTN, this._element).forEach((button) => {
        button.addEventListener('click', () => this._editRow(getRowIndex(button)));
      });

      SelectorEngine.find(SELECTOR_DELETE_BTN, this._element).forEach((button) => {
        button.addEventListener('click', () => {
          this._deleteRow(getRowIndex(button));
        });
      });

      // Popconfirm
      if (this._options.confirm) {
        this._popconfirmInstances = SelectorEngine.find(
          SELECTOR_POPCONFIRM_TOGGLE,
          this._element
        ).map((button) => {
          button.addEventListener(POPCONFIRM_CONFIRM_EVENT, () =>
            this._deleteRow(getRowIndex(button))
          );

          return new mdb.Popconfirm(button, {
            message: this._options.confirmMessage,
            cancelText: this._options.cancelText,
            okText: this._options.confirmText,
          });
        });
      }
    }
  }

  _setupScroll() {
    const datatableBody = SelectorEngine.findOne(SELECTOR_BODY, this._element);
    const style = {
      overflow: 'auto',
      position: 'relative',
    };

    if (this._options.maxHeight) {
      style.maxHeight = getCSSValue(this._options.maxHeight);
    }

    if (this._options.maxWidth) {
      const width = getCSSValue(this._options.maxWidth);

      style.maxWidth = width;

      Manipulator.style(this._element, { maxWidth: width });
    }

    Manipulator.style(datatableBody, style);

    if (this._options.fixedHeader) {
      SelectorEngine.find(SELECTOR_HEADER, this._element).forEach((header) => {
        Manipulator.addClass(header, CLASS_FIXED_CELL);

        Manipulator.addClass(header, this._options.color);
      });
    }

    this._perfectScrollbar = new PerfectScrollbar(datatableBody);
  }

  _updateValue(e) {
    const wrapper =
      SelectorEngine.closest(e.target, SELECTOR_CELL) ||
      SelectorEngine.closest(e.target, '.table-editor_input-wrapper');

    const field = Manipulator.getDataAttribute(wrapper, 'field');

    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

    this._tempRow[field] = value;
  }

  _setupSort() {
    SelectorEngine.find(SELECTOR_SORT_ICON, this._element).forEach((icon) => {
      const field = Manipulator.getDataAttribute(icon, 'sort');
      const [header] = SelectorEngine.parents(icon, SELECTOR_HEADER);
      Manipulator.style(header, { cursor: 'pointer' });

      EventHandler.on(header, 'click', () => {
        if (this._sortField === field && this._sortOrder === 'asc') {
          this._sortOrder = 'desc';
        } else if (this._sortField === field && this._sortOrder === 'desc') {
          this._sortOrder = null;
        } else {
          this._sortOrder = 'asc';
        }

        this._sortField = field;

        this._activePage = 0;

        this._toggleDisableState();

        this._renderRows();

        this._setActiveSortIcon(icon);
      });
    });
  }

  _setupPagination() {
    this._paginationRight = SelectorEngine.findOne(SELECTOR_PAGINATION_RIGHT, this._element);

    this._paginationLeft = SelectorEngine.findOne(SELECTOR_PAGINATION_LEFT, this._element);

    this._setupPaginationSelect();

    EventHandler.on(this._paginationRight, 'click', () =>
      this._changeActivePage(this._activePage + 1)
    );

    EventHandler.on(this._paginationLeft, 'click', () =>
      this._changeActivePage(this._activePage - 1)
    );

    if (this._options.fullPagination) {
      this._paginationStart = SelectorEngine.findOne(SELECTOR_PAGINATION_START, this._element);

      this._paginationEnd = SelectorEngine.findOne(SELECTOR_PAGINATION_END, this._element);

      EventHandler.on(this._paginationStart, 'click', () => this._changeActivePage(0));

      EventHandler.on(this._paginationEnd, 'click', () => this._changeActivePage(this.pages - 1));
    }

    this._toggleDisableState();
  }

  _setupPaginationSelect() {
    this._select = SelectorEngine.findOne(SELECTOR_SELECT, this._element);

    if (this._selectInstance) {
      this._selectInstance.dispose();
    }

    this._selectInstance = new mdb.Select(this._select);

    EventHandler.on(this._select, SELECT_VALUE_CHANGED_EVENT, (e) => this._setEntries(e));
  }

  _removeEventListeners() {
    if (this._options.pagination) {
      EventHandler.off(this._paginationRight, 'click');

      EventHandler.off(this._paginationLeft, 'click');

      EventHandler.off(this._select, SELECT_VALUE_CHANGED_EVENT);

      if (this._options.fullPagination) {
        EventHandler.off(this._paginationStart, 'click');

        EventHandler.off(this._paginationEnd, 'click');
      }
    }

    SelectorEngine.find(SELECTOR_SORT_ICON, this._element).forEach((icon) => {
      const [header] = SelectorEngine.parents(icon, SELECTOR_HEADER);

      EventHandler.off(header, 'click');
    });
  }

  _refreshPagination() {
    if (this.pages < this._activePage + 1) {
      this._changeActivePage(this.pages - 1);
    }

    this._toggleDisableState();
  }

  _renderRows() {
    const body = SelectorEngine.findOne(SELECTOR_TABLE_BODY, this._element);

    if (this._options.pagination) {
      const navigation = SelectorEngine.findOne(SELECTOR_PAGINATION_NAV, this._element);

      navigation.innerText = this.navigationText;
    }

    body.innerHTML = tableTemplate(this.tableOptions).rows;

    EventHandler.trigger(this._element, EVENT_RENDER);

    this._setupActionButtons();
  }

  _toggleDisableState() {
    if (this._activePage === 0 || this._options.loading) {
      this._paginationLeft.setAttribute('disabled', true);

      if (this._options.fullPagination) {
        this._paginationStart.setAttribute('disabled', true);
      }
    } else {
      this._paginationLeft.removeAttribute('disabled');

      if (this._options.fullPagination) {
        this._paginationStart.removeAttribute('disabled');
      }
    }

    if (this._activePage === this.pages - 1 || this._options.loading) {
      this._paginationRight.setAttribute('disabled', true);

      if (this._options.fullPagination) {
        this._paginationEnd.setAttribute('disabled', true);
      }
    } else {
      this._paginationRight.removeAttribute('disabled');

      if (this._options.fullPagination) {
        this._paginationEnd.removeAttribute('disabled');
      }
    }
  }

  _triggerUpdate(updatedRow, action) {
    EventHandler.trigger(this._element, EVENT_UPDATE, {
      row: updatedRow,
      action,
    });
  }

  static jQueryInterface(config, param1, param2) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose/.test(config)) {
        return;
      }

      if (!data) {
        data = new TableEditor(this, _config, param1);
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

/**
 * ------------------------------------------------------------------------
 * Data Api implementation - auto initialization
 * ------------------------------------------------------------------------
 */

SelectorEngine.find(SELECTOR_DATA_INIT).forEach((datatable) => {
  let instance = TableEditor.getInstance(datatable);
  if (!instance) {
    instance = new TableEditor(datatable);
  }

  return instance;
});

SelectorEngine.find(SELECTOR_ADD_BTN).forEach((button) => {
  button.addEventListener('click', () => {
    const target = Manipulator.getDataAttribute(button, 'target');
    const instance = TableEditor.getInstance(SelectorEngine.findOne(target));

    if (!instance) {
      return;
    }

    instance.add();
  });
});

SelectorEngine.find(SELECTOR_SEARCH_FIELD).forEach((field) => {
  field.addEventListener('input', (e) => {
    const target = Manipulator.getDataAttribute(field, 'target');
    const instance = TableEditor.getInstance(SelectorEngine.findOne(target));

    if (!instance) {
      return;
    }

    instance.search(e.target.value);
  });
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .datatable to jQuery only if jQuery is present
 */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = TableEditor.jQueryInterface;
    $.fn[NAME].Constructor = TableEditor;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return TableEditor.jQueryInterface;
    };
  }
});
export default TableEditor;
