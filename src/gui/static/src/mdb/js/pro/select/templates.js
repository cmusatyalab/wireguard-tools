import { element } from '../../mdb/util/index';
import Manipulator from '../../mdb/dom/manipulator';
import allOptionsSelected from './util';

const preventKeydown = (event) => {
  if (event.code === 'Tab' || event.code === 'Esc') {
    return;
  }

  event.preventDefault();
};

export function getWrapperTemplate(id, config, label) {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('id', id);
  wrapper.classList.add('select-wrapper');

  const formOutline = element('div');
  Manipulator.addClass(formOutline, 'form-outline');
  formOutline.setAttribute('data-mdb-input-init', '');

  if (config.formWhite) {
    Manipulator.addClass(formOutline, 'form-white');
  }

  const input = element('input');
  const role = config.filter ? 'combobox' : 'listbox';
  const multiselectable = config.multiple ? 'true' : 'false';
  const disabled = config.disabled ? 'true' : 'false';
  Manipulator.addClass(input, 'form-control');
  Manipulator.addClass(input, 'select-input');

  if (config.size === 'sm') {
    Manipulator.addClass(input, 'form-control-sm');
  }

  if (config.size === 'lg') {
    Manipulator.addClass(input, 'form-control-lg');
  }

  input.setAttribute('type', 'text');
  input.setAttribute('role', role);
  input.setAttribute('aria-multiselectable', multiselectable);
  input.setAttribute('aria-disabled', disabled);
  input.setAttribute('aria-haspopup', 'true');
  input.setAttribute('aria-expanded', false);

  if (config.tabIndex) {
    input.setAttribute('tabIndex', config.tabIndex);
  }

  if (config.disabled) {
    input.setAttribute('disabled', '');
  }

  if (config.placeholder !== '') {
    input.setAttribute('placeholder', config.placeholder);
  }

  if (config.validation) {
    Manipulator.addStyle(input, { 'pointer-events': 'none', 'caret-color': 'transparent' });
    Manipulator.addStyle(formOutline, { cursor: 'pointer' });
  } else {
    input.setAttribute('readonly', 'true');
  }

  if (config.validation) {
    input.setAttribute('required', 'true');
    input.setAttribute('aria-required', 'true');
    input.addEventListener('keydown', preventKeydown);
  }

  const validFeedback = element('div');
  Manipulator.addClass(validFeedback, 'valid-feedback');
  const validFeedBackText = document.createTextNode(`${config.validFeedback}`);
  validFeedback.appendChild(validFeedBackText);

  const invalidFeedback = element('div');
  Manipulator.addClass(invalidFeedback, 'invalid-feedback');
  const invalidFeedBackText = document.createTextNode(`${config.invalidFeedback}`);
  invalidFeedback.appendChild(invalidFeedBackText);

  const clearBtn = element('span');
  Manipulator.addClass(clearBtn, 'select-clear-btn');
  const clearBtnText = document.createTextNode('\u2715');
  clearBtn.appendChild(clearBtnText);
  clearBtn.setAttribute('tabindex', '0');

  const arrow = element('span');
  Manipulator.addClass(arrow, 'select-arrow');

  formOutline.appendChild(input);

  if (label) {
    formOutline.appendChild(label);
  }

  if (config.validation) {
    formOutline.appendChild(validFeedback);
    formOutline.appendChild(invalidFeedback);
  }

  if (config.clearButton) {
    formOutline.appendChild(clearBtn);
  }

  formOutline.appendChild(arrow);

  wrapper.appendChild(formOutline);
  return wrapper;
}

export function getDropdownTemplate(
  id,
  config,
  width,
  height,
  selectAllOption,
  options,
  customContent
) {
  const dropdownContainer = document.createElement('div');
  dropdownContainer.classList.add('select-dropdown-container');

  dropdownContainer.setAttribute('id', `${id}`);
  dropdownContainer.style.width = `${width}px`;

  const dropdown = document.createElement('div');
  dropdown.setAttribute('tabindex', 0);
  dropdown.classList.add('select-dropdown');

  const optionsWrapper = element('div');
  Manipulator.addClass(optionsWrapper, 'select-options-wrapper');
  optionsWrapper.style.maxHeight = `${height}px`;

  const optionsList = getOptionsListTemplate(options, selectAllOption, config);

  optionsWrapper.appendChild(optionsList);

  if (config.filter) {
    dropdown.appendChild(getFilterTemplate(config.searchPlaceholder));
  }

  dropdown.appendChild(optionsWrapper);

  if (customContent) {
    dropdown.appendChild(customContent);
  }

  dropdownContainer.appendChild(dropdown);

  return dropdownContainer;
}

export function getOptionsListTemplate(options, selectAllOption, config) {
  const optionsList = element('div');
  Manipulator.addClass(optionsList, 'select-options-list');

  let optionsNodes;

  if (config.multiple) {
    optionsNodes = getMultipleOptionsNodes(options, selectAllOption, config);
  } else {
    optionsNodes = getSingleOptionsNodes(options, config);
  }

  optionsNodes.forEach((node) => {
    optionsList.appendChild(node);
  });

  return optionsList;
}

export function getFilterTemplate(placeholder) {
  const inputGroup = element('div');
  Manipulator.addClass(inputGroup, 'input-group');
  const input = element('input');
  Manipulator.addClass(input, 'form-control');
  Manipulator.addClass(input, 'select-filter-input');
  input.placeholder = placeholder;
  input.setAttribute('role', 'searchbox');
  input.setAttribute('type', 'text');

  inputGroup.appendChild(input);

  return inputGroup;
}

function getSingleOptionsNodes(options, config) {
  const nodes = getOptionsNodes(options, config);
  return nodes;
}

function getMultipleOptionsNodes(options, selectAllOption, config) {
  let selectAllNode = null;

  if (config.selectAll) {
    selectAllNode = createSelectAllNode(selectAllOption, options, config);
  }
  const optionsNodes = getOptionsNodes(options, config);
  const nodes = selectAllNode ? [selectAllNode, ...optionsNodes] : optionsNodes;
  return nodes;
}

function getOptionsNodes(options, config) {
  const nodes = [];

  options.forEach((option) => {
    const isOptionGroup = option.hasOwnProperty('options');
    if (isOptionGroup) {
      const group = createOptionGroupTemplate(option, config);
      nodes.push(group);
    } else {
      nodes.push(createOptionTemplate(option, config));
    }
  });

  return nodes;
}

function createSelectAllNode(option, options, config) {
  const isSelected = allOptionsSelected(options);
  const optionNode = element('div');
  Manipulator.addClass(optionNode, 'select-option');
  Manipulator.addClass(optionNode, 'select-all-option');
  Manipulator.addStyle(optionNode, { height: `${config.optionHeight}px` });
  optionNode.setAttribute('role', 'option');
  optionNode.setAttribute('aria-selected', isSelected);

  if (isSelected) {
    Manipulator.addClass(optionNode, 'selected');
  }

  optionNode.appendChild(getOptionContentTemplate(option, config));
  option.setNode(optionNode);

  return optionNode;
}

function createOptionTemplate(option, config) {
  if (option.node) {
    return option.node;
  }

  const optionNode = element('div');
  Manipulator.addClass(optionNode, 'select-option');
  Manipulator.addStyle(optionNode, { height: `${config.optionHeight}px` });
  Manipulator.setDataAttribute(optionNode, 'id', option.id);
  optionNode.setAttribute('role', 'option');
  optionNode.setAttribute('aria-selected', option.selected);
  optionNode.setAttribute('aria-disabled', option.disabled);

  if (option.selected) {
    Manipulator.addClass(optionNode, 'selected');
  }

  if (option.disabled) {
    Manipulator.addClass(optionNode, 'disabled');
  }

  if (option.hidden) {
    Manipulator.addClass(optionNode, 'd-none');
  }

  optionNode.appendChild(getOptionContentTemplate(option, config));

  if (option.icon) {
    optionNode.appendChild(getOptionIconTemplate(option));
  }

  option.setNode(optionNode);

  return optionNode;
}

function getOptionContentTemplate(option, config) {
  const content = element('span');
  Manipulator.addClass(content, 'select-option-text');

  const label = document.createTextNode(option.label);

  if (config.multiple) {
    content.appendChild(getCheckboxTemplate(option));
  }

  content.appendChild(label);

  if (option.secondaryText || typeof option.secondaryText === 'number') {
    content.appendChild(getSecondaryTextTemplate(option.secondaryText));
  }

  return content;
}

function getSecondaryTextTemplate(text) {
  const span = element('span');
  Manipulator.addClass(span, 'select-option-secondary-text');
  const textContent = document.createTextNode(text);
  span.appendChild(textContent);
  return span;
}

function getCheckboxTemplate(option) {
  const checkbox = element('input');
  checkbox.setAttribute('type', 'checkbox');
  Manipulator.addClass(checkbox, 'form-check-input');

  const label = element('label');

  if (option.selected) {
    checkbox.setAttribute('checked', true);
  }

  if (option.disabled) {
    checkbox.setAttribute('disabled', true);
  }

  checkbox.appendChild(label);
  return checkbox;
}

function getOptionIconTemplate(option) {
  const container = element('span');
  Manipulator.addClass(container, 'select-option-icon-container');
  const image = element('img');
  Manipulator.addClass(image, 'select-option-icon');
  Manipulator.addClass(image, 'rounded-circle');
  image.src = option.icon;

  container.appendChild(image);
  return container;
}

function createOptionGroupTemplate(optionGroup, config) {
  const group = element('div');
  Manipulator.addClass(group, 'select-option-group');
  group.setAttribute('role', 'group');
  group.setAttribute('id', optionGroup.id);

  if (optionGroup.hidden) {
    Manipulator.addClass(group, 'd-none');
  }

  const label = element('label');
  Manipulator.addClass(label, 'select-option-group-label');
  Manipulator.addStyle(label, { height: `${config.optionHeight}px` });
  label.setAttribute('for', optionGroup.id);
  label.textContent = optionGroup.label;

  group.appendChild(label);

  optionGroup.options.forEach((option) => {
    group.appendChild(createOptionTemplate(option, config));
  });

  return group;
}

export function getFakeValueTemplate(value) {
  const fakeValue = element('div');
  fakeValue.textContent = value;
  Manipulator.addClass(fakeValue, 'form-label');
  Manipulator.addClass(fakeValue, 'select-fake-value');

  return fakeValue;
}
