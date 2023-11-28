import { element } from '../../mdb/util/index';
import Manipulator from '../../mdb/dom/manipulator';
import { sanitizeHtml, DefaultWhitelist } from '../../mdb/util/sanitizer';

const CLASS_NAME_AUTOCOMPLETE_DROPDOWN_CONTAINER = 'autocomplete-dropdown-container';
const CLASS_NAME_AUTOCOMPLETE_DROPDOWN = 'autocomplete-dropdown';
const CLASS_NAME_AUTOCOMPLETE_ITEMS_LIST = 'autocomplete-items-list';
const CLASS_NAME_AUTOCOMPLETE_ITEM = 'autocomplete-item';
const CLASS_NAME_LOADER = 'autocomplete-loader';
const CLASS_NAME_SPINNER_BORDER = 'spinner-border';
const CLASS_NAME_NO_RESULTS = 'autocomplete-item autocomplete-no-results';

// eslint-disable-next-line import/prefer-default-export
export function getDropdownTemplate(settings) {
  const { id, items, width, options } = settings;

  const dropdownContainer = element('div');
  Manipulator.addClass(dropdownContainer, CLASS_NAME_AUTOCOMPLETE_DROPDOWN_CONTAINER);
  Manipulator.addStyle(dropdownContainer, { width: `${width}px` });
  dropdownContainer.setAttribute('id', id);

  const dropdown = element('div');
  Manipulator.addClass(dropdown, CLASS_NAME_AUTOCOMPLETE_DROPDOWN);

  const itemsList = element('ul');
  const listHeight = options.listHeight;
  Manipulator.addClass(itemsList, CLASS_NAME_AUTOCOMPLETE_ITEMS_LIST);
  Manipulator.addStyle(itemsList, { maxHeight: `${listHeight}px` });
  itemsList.setAttribute('role', 'listbox');

  const itemsListTemplate = getItemsTemplate(items, options);

  itemsList.innerHTML = itemsListTemplate;

  dropdown.appendChild(itemsList);
  dropdownContainer.appendChild(dropdown);

  return dropdownContainer;
}

export function getItemsTemplate(items = [], options) {
  const displayValue = options.displayValue;
  const itemContent = options.itemContent;
  return `
    ${items
      .map((item, index) => {
        const content =
          typeof itemContent === 'function'
            ? sanitizeHtml(itemContent(item), DefaultWhitelist, null)
            : displayValue(item);
        return `<li data-mdb-index="${index}" role="option" class="${CLASS_NAME_AUTOCOMPLETE_ITEM}">${content}</li>`;
      })
      .join('')}
  `;
}

export function getLoaderTemplate() {
  const container = element('div');
  Manipulator.addClass(container, CLASS_NAME_LOADER);
  Manipulator.addClass(container, CLASS_NAME_SPINNER_BORDER);
  container.setAttribute('role', 'status');

  const content = '<span class="sr-only">Loading...</span>';
  container.innerHTML = content;

  return container;
}

export function getNoResultsTemplate(message) {
  return `<li class="${CLASS_NAME_NO_RESULTS}">${message}</li>`;
}
