import SelectorEngine from '../../mdb/dom/selector-engine';
import Manipulator from '../../mdb/dom/manipulator';

const SELECTOR_FORM_CHECK_INPUT = '.form-check-input';

const CLASS_NAME_SELECTED = 'selected';
const CLASS_NAME_ACITVE = 'active';

class SelectOption {
  constructor(
    id,
    nativeOption,
    multiple,
    value,
    label,
    selected,
    disabled,
    hidden,
    secondaryText,
    groupId,
    icon
  ) {
    this.id = id;
    this.nativeOption = nativeOption;
    this.multiple = multiple;
    this.value = value;
    this.label = label;
    this.selected = selected;
    this.disabled = disabled;
    this.hidden = hidden;
    this.secondaryText = secondaryText;
    this.groupId = groupId;
    this.icon = icon;
    this.node = null;
    this.active = false;
  }

  select() {
    if (this.multiple) {
      this._selectMultiple();
    } else {
      this._selectSingle();
    }
  }

  _selectSingle() {
    if (!this.selected) {
      Manipulator.addClass(this.node, CLASS_NAME_SELECTED);
      this.node.setAttribute('aria-selected', true);
      this.selected = true;

      if (this.nativeOption) {
        this.nativeOption.selected = true;
      }
    }
  }

  _selectMultiple() {
    if (!this.selected) {
      const checkbox = SelectorEngine.findOne(SELECTOR_FORM_CHECK_INPUT, this.node);
      checkbox.checked = true;
      Manipulator.addClass(this.node, CLASS_NAME_SELECTED);
      this.node.setAttribute('aria-selected', true);
      this.selected = true;

      if (this.nativeOption) {
        this.nativeOption.selected = true;
      }
    }
  }

  deselect() {
    if (this.multiple) {
      this._deselectMultiple();
    } else {
      this._deselectSingle();
    }
  }

  _deselectSingle() {
    if (this.selected) {
      Manipulator.removeClass(this.node, CLASS_NAME_SELECTED);
      this.node.setAttribute('aria-selected', false);
      this.selected = false;

      if (this.nativeOption) {
        this.nativeOption.selected = false;
      }
    }
  }

  _deselectMultiple() {
    if (this.selected) {
      const checkbox = SelectorEngine.findOne(SELECTOR_FORM_CHECK_INPUT, this.node);
      checkbox.checked = false;
      Manipulator.removeClass(this.node, CLASS_NAME_SELECTED);
      this.node.setAttribute('aria-selected', false);
      this.selected = false;

      if (this.nativeOption) {
        this.nativeOption.selected = false;
      }
    }
  }

  setNode(node) {
    this.node = node;
  }

  setActiveStyles() {
    if (!this.active && !this.multiple) {
      this.active = true;
      Manipulator.addClass(this.node, CLASS_NAME_ACITVE);
    }
  }

  removeActiveStyles() {
    if (this.active) {
      this.active = false;
      Manipulator.removeClass(this.node, CLASS_NAME_ACITVE);
    }
  }
}

export default SelectOption;
