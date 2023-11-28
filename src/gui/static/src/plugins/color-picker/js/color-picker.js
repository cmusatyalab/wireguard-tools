import { typeCheckConfig, getjQuery, onDOMContentLoaded } from './mdb/util/index';
import Data from './mdb/dom/data';
import Manipulator from './mdb/dom/manipulator';
import EventHandler from './mdb/dom/event-handler';
import SelectorEngine from './mdb/dom/selector-engine';
import create from './templates';
import { toString, colorFromString, getColors, hslaToRgba } from './utils';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'colorPicker';
const DATA_KEY = `mdb.${NAME}`;
const EVENT_KEY = `.${DATA_KEY}`;

const DEFAULT_OPTIONS = {
  colorPickerColorInputs: true,
  colorPickerChangeFormatBtn: true,
  colorPickerColorPalette: true,
  colorPickerCopyIcon: true,
  colorPickerSwatches: [],
  colorPickerSwatchesHeight: 0,
  colorPickerValue: '',
  colorPickerDisabled: false,
  colorPickerDropdown: false,
  colorPickerDisabledAlpha: false,
  colorPickerDisabledHue: false,
  colorPickerType: '',
};
const OPTIONS_TYPE = {
  colorPickerColorInputs: 'boolean',
  colorPickerChangeFormatBtn: 'boolean',
  colorPickerColorPalette: 'boolean',
  colorPickerCopyIcon: 'boolean',
  colorPickerSwatches: 'array',
  colorPickerSwatchesHeight: 'number',
  colorPickerValue: 'string',
  colorPickerDisabled: 'boolean',
  colorPickerDropdown: 'boolean',
  colorPickerDisabledAlpha: 'boolean',
  colorPickerDisabledHue: 'boolean',
  colorPickerType: 'string',
};

const COLOR_FORMATS = ['rgba', 'hsla', 'hsva', 'hex', 'cmyk'];
const DEFAULT_COLORS_OBJECT = {
  rgba: {
    r: 255,
    b: 0,
    g: 0,
    a: 1,
  },
  hsla: {
    h: 0,
    s: 1,
    l: 0.5,
    a: 1,
  },
  hsva: {
    h: 0,
    s: 1,
    v: 1,
    a: 1,
  },
  hex: '#FF0000FF',
  cmyk: {
    c: 0,
    m: 100,
    y: 100,
    k: 0,
  },
};
const ID_HUE_RANGE = 'hueRange';
const ID_ALPHA_RANGE = 'alphaRange';
const ID_HEX_INPUT = 'hex';
const ID_NEXT_FORMAT_BTN = 'next-format';
const ID_PREV_FORMAT_BTN = 'previous-format';
const ID_COPY_CODE_BTN = 'copy-code';

const CLASS_COLOR_INPUTS_WRAPPER = 'color-picker-color-inputs-wrapper';
const CLASS_CANVAS_WRAPPER = 'color-picker-canvas-wrapper';
const CLASS_COLOR_DOT = 'color-picker-color-dot';
const CLASS_CHANGE_VIEW_ICONS = 'color-picker-change-view-icons';
const CLASS_CANVAS_DOT = 'color-picker-canvas-dot';
const CLASS_COLOR_CONTROLS = 'color-picker-controls';
const CLASS_SWATCHES_COLOR = 'color-picker-swatches-color';
const CLASS_DISABLED = 'disabled';

const SELECTOR_DATA_INIT = '[data-mdb-color-picker-init]';
const SELECTOR_HUE_RANGE = `#${ID_HUE_RANGE}`;
const SELECTOR_ALPHA_RANGE = `#${ID_ALPHA_RANGE}`;
const SELECTOR_RANGE_INPUT = `.${CLASS_COLOR_CONTROLS} input`;
const SELECTOR_HEX_INPUT = `#${ID_HEX_INPUT}`;
const SELECTOR_COLOR_INPUT = `.${CLASS_COLOR_INPUTS_WRAPPER} input`;
const SELECTOR_NEXT_FORMAT_BTN = `#${ID_NEXT_FORMAT_BTN}`;
const SELECTOR_PREV_FORMAT_BTN = `#${ID_PREV_FORMAT_BTN}`;
const SELECTOR_COPY_CODE_BTN = `#${ID_COPY_CODE_BTN}`;
const SELECTOR_CANVAS = `.${CLASS_CANVAS_WRAPPER} canvas`;
const SELECTOR_CANVAS_DOT = `.${CLASS_CANVAS_DOT}`;
const SELECTOR_COLOR_DOT = `.${CLASS_COLOR_DOT}`;
const SELECTOR_CHANGE_VIEW_BTN = `.${CLASS_CHANGE_VIEW_ICONS} button`;
const SELECTOR_COLOR_INPUTS_LABEL = `.${CLASS_COLOR_INPUTS_WRAPPER} label`;
const SELECTOR_COLOR_INPUTS_WRAPPER = `.${CLASS_COLOR_INPUTS_WRAPPER}`;
const SELECTOR_SWATCHES_COLOR = `.${CLASS_SWATCHES_COLOR}`;
const SELECTOR_DROPDOWN = '[data-mdb-dropdown-init]';

const EVENT_INPUT = 'input';
const EVENT_CHANGE = `change${EVENT_KEY}`;
const EVENT_CLICK = `click${EVENT_KEY}`;
const EVENT_KEYDOWN = `keydown${EVENT_KEY}`;
const EVENT_MOUSEDOWN = `mousedown${EVENT_KEY}`;
const EVENT_MOUSEUP = `mouseup${EVENT_KEY}`;
const EVENT_MOUSEMOVE = `mousemove${EVENT_KEY}`;
const EVENT_DROPDOWN_SHOW = 'show.bs.dropdown';
const EVENT_DROPDOWN_HIDE = 'hide.bs.dropdown';
const EVENT_COLOR_CHANGED = `colorChanged${EVENT_KEY}`;
const EVENT_OPEN = `open${EVENT_KEY}`;
const EVENT_CLOSE = `close${EVENT_KEY}`;
/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class ColorPicker {
  constructor(element, options = {}) {
    this._element = element;
    this._options = this._getConfig(options);
    this._colors = DEFAULT_COLORS_OBJECT;
    this._currentFormat = 'hsla';
    this._currentFormatValue = '';
    this._isMouseDown = false;

    if (this._element) {
      this._init();
      Data.setData(element, DATA_KEY, this);
    }
  }

  // Public
  dispose() {
    Data.removeData(this._element, DATA_KEY);

    this._element = null;
    this._options = null;
    this._colors = null;
    this._currentFormat = null;
    this._currentFormatValue = null;
    this._isMouseDown = null;
  }

  // Private
  _getConfig(config) {
    config = {
      ...DEFAULT_OPTIONS,
      ...Manipulator.getDataAttributes(this._element),
      ...config,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    return config;
  }

  _init() {
    const { initMDB, Ripple, Dropdown } = mdb;
    initMDB({ Ripple, Dropdown });

    this._createColorPicker();
    this._updateColors();

    if (this._options.colorPickerColorPalette) {
      this._drawCanvas();
    }

    this._setDefaultValue();
    this._currentFormat = 'hsla';

    if (this._options.colorPickerType) {
      this._currentFormat = this._options.colorPickerType;
      const formatIndex = COLOR_FORMATS.indexOf(this._currentFormat);
      this._changeColorFormat(formatIndex);
    }

    this._updateColors();
    this._updatePicker();
    this._updateAlphaRangeBackground();

    if (this._options.colorPickerDisabled) {
      this._setDisable();
      return;
    }

    this._bindOnChangeRange();
    this._bindMouseEvents();
    this._bindSwatchesEvents();
  }

  _createColorPicker() {
    if (this._options.colorPickerDropdown) {
      create.dropdown(this._element);
      this._initDropdown();
      this._bindDropdownEvents();
    }

    if (this._options.colorPickerColorPalette) {
      this._element.insertAdjacentHTML('afterbegin', create.canvas());
      this._setCanvasMaxWidth();
    }

    this._element.insertAdjacentHTML('beforeend', create.pickerControls());

    if (this._options.colorPickerColorInputs) {
      this._element.insertAdjacentHTML('beforeend', create.pickerColorInputsWrapper());

      const wrapper = SelectorEngine.findOne(SELECTOR_COLOR_INPUTS_WRAPPER, this._element);

      wrapper.insertAdjacentHTML('beforeend', create.pickerColorInputs(['h', 's', 'l', 'a']));

      this._updateInputs();
      this._initInputs();
      this._bindOnInputChange();
    }

    if (this._options.colorPickerChangeFormatBtn) {
      const inputsWrapper = SelectorEngine.findOne(SELECTOR_COLOR_INPUTS_WRAPPER, this._element);

      inputsWrapper.insertAdjacentHTML('beforeend', create.changeViewIcons());

      this._bindChangeFormat();
    }

    if (this._options.colorPickerCopyIcon) {
      const inputsWrapper = SelectorEngine.findOne(SELECTOR_COLOR_INPUTS_WRAPPER, this._element);

      inputsWrapper.insertAdjacentHTML('beforeend', create.copyCodeIcon());

      this._bindCopyCodeToClipboard();
    }

    if (this._options.colorPickerSwatches.length) {
      const swatches = create.swatchesWrapper(this._options.colorPickerSwatches);

      if (this._options.colorPickerSwatchesHeight) {
        swatches.style.maxHeight = `${this._options.colorPickerSwatchesHeight}px`;
      }

      this._element.appendChild(swatches);
    }
  }

  _setDisable() {
    if (this._options.colorPickerColorInputs) {
      const inputs = SelectorEngine.find(SELECTOR_COLOR_INPUT, this._element);

      inputs.forEach((input) => {
        input.disabled = true;
      });
    }

    if (this._options.colorPickerChangeFormatBtn) {
      const btns = SelectorEngine.find(SELECTOR_CHANGE_VIEW_BTN, this._element);

      btns.forEach((btn) => {
        btn.classList.add(CLASS_DISABLED);
      });
    }

    if (this._options.colorPickerCopyIcon) {
      const btn = SelectorEngine.findOne(SELECTOR_COPY_CODE_BTN, this._element);

      btn.classList.add(CLASS_DISABLED);
    }

    const inputs = SelectorEngine.find(SELECTOR_RANGE_INPUT, this._element);

    inputs.forEach((input) => {
      input.disabled = true;
    });
  }

  _setCanvasMaxWidth() {
    const canvas = SelectorEngine.findOne(SELECTOR_CANVAS, this._element);

    this._element.style.maxWidth = `${canvas.width}px`;
  }

  _bindOnChangeRange() {
    const hueRange = SelectorEngine.findOne(SELECTOR_HUE_RANGE, this._element);
    const alphaRange = SelectorEngine.findOne(SELECTOR_ALPHA_RANGE, this._element);
    if (this._options.colorPickerDisabledHue) {
      hueRange.setAttribute('disabled', true);
    }
    if (this._options.colorPickerDisabledAlpha) {
      alphaRange.setAttribute('disabled', true);
    }

    EventHandler.on(hueRange, EVENT_INPUT, () => {
      this._colors.hsla.h = hueRange.value;
      this._updatePickersColorsAndPositions();
      this._updateAlphaRangeBackground();
    });

    EventHandler.on(alphaRange, EVENT_INPUT, () => {
      this._colors.hsla.a = alphaRange.value;
      this._updatePickersColorsAndPositions();
    });
  }

  _updatePickersColorsAndPositions() {
    this._updateColors();

    if (this._options.colorPickerColorPalette) {
      this._drawCanvas();
    }

    this._updateColorDot();
    this._updateInputs();
  }

  _bindOnInputChange() {
    if (this._currentFormat === 'hex') {
      const hexInput = SelectorEngine.findOne(SELECTOR_HEX_INPUT, this._element);

      EventHandler.on(hexInput, EVENT_INPUT, (e) => {
        this._currentFormatValue = e.target.value;
        this._updateColors(this._currentFormat, this._currentFormatValue);
        if (this._options.colorPickerColorPalette) {
          this._updateCanvasDot();
        }

        if (this._options.colorPickerColorPalette) {
          this._drawCanvas();
        }

        this._updateHueRange();
        this._updateAlphaRangeBackground();
        this._updateColorDot();
      });
    } else {
      const inputs = SelectorEngine.find(SELECTOR_COLOR_INPUT, this._element);

      inputs.forEach((input) => {
        EventHandler.on(input, EVENT_CHANGE, (e) => {
          const inputId = e.target.id;

          this._currentFormatValue[inputId] = Number(e.target.value);
          this._updateColors(this._currentFormat, this._currentFormatValue);
          if (this._options.colorPickerColorPalette) {
            this._updateCanvasDot();
          }

          if (this._options.colorPickerColorPalette) {
            this._drawCanvas();
          }

          this._updateHueRange();
          this._updateAlphaRangeBackground();
          this._updateAlphaRange();
          this._updateColorDot();
        });
      });
    }
  }

  _bindSwatchesEvents() {
    const swatches = SelectorEngine.find(SELECTOR_SWATCHES_COLOR, this._element);

    swatches.forEach((el) => {
      EventHandler.on(el, EVENT_CLICK, (e) => {
        const rgba = colorFromString(e.target.style.backgroundColor);

        this._updateColors(rgba.format, rgba);
        this._updatePicker();

        if (this._options.colorPickerColorPalette) {
          this._drawCanvas();
        }

        this._updateAlphaRangeBackground();
        this._updateHueRange();
        this._updateAlphaRange();
      });

      EventHandler.on(el, EVENT_KEYDOWN, (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();

          const color = colorFromString(e.target.style.backgroundColor);

          this._updateColors(color.format, color);
          this._updatePicker();

          if (this._options.colorPickerColorPalette) {
            this._drawCanvas();
          }

          this._updateAlphaRangeBackground();
          this._updateHueRange();
          this._updateAlphaRange();
        }
      });
    });
  }

  _bindDropdownEvents() {
    const dropdown = SelectorEngine.parents(this._element, '.dropdown')[0];

    EventHandler.on(dropdown, EVENT_CLICK, (e) => {
      e.stopPropagation();
    });

    EventHandler.on(dropdown, EVENT_DROPDOWN_SHOW, () => {
      EventHandler.trigger(this._element, EVENT_OPEN);
    });

    EventHandler.on(dropdown, EVENT_DROPDOWN_HIDE, () => {
      EventHandler.trigger(this._element, EVENT_CLOSE);
    });
  }

  _bindMouseEvents() {
    const canvas = SelectorEngine.findOne(SELECTOR_CANVAS, this._element);

    EventHandler.on(canvas, EVENT_MOUSEDOWN, (e) => {
      this._isMouseDown = true;

      const rgba = this._getRgbColorFromCanvas(e);
      rgba.a = this._colors.hsla.a;

      this._updateColors('rgba', rgba);
      this._updatePicker();
      this._updateAlphaRangeBackground();
    });

    EventHandler.on(canvas, EVENT_MOUSEMOVE, (e) => {
      if (this._isMouseDown) {
        const rgba = this._getRgbColorFromCanvas(e);
        rgba.a = this._colors.hsla.a;
        this._updateColors('rgba', rgba);
        this._updatePicker();
        this._updateAlphaRangeBackground();
      }
    });

    EventHandler.on(window, EVENT_MOUSEUP, () => {
      this._isMouseDown = false;
    });
  }

  _bindChangeFormat() {
    const btnNext = SelectorEngine.findOne(SELECTOR_NEXT_FORMAT_BTN, this._element);
    const btnPrev = SelectorEngine.findOne(SELECTOR_PREV_FORMAT_BTN, this._element);

    EventHandler.on(btnNext, EVENT_CLICK, () => {
      const formatIndex = COLOR_FORMATS.indexOf(this._currentFormat);
      this._changeColorFormat(formatIndex + 1);
    });

    EventHandler.on(btnPrev, EVENT_CLICK, () => {
      const formatIndex = COLOR_FORMATS.indexOf(this._currentFormat);
      this._changeColorFormat(formatIndex ? formatIndex - 1 : COLOR_FORMATS.length - 1);
    });
  }

  _bindCopyCodeToClipboard() {
    const btnCopy = SelectorEngine.findOne(SELECTOR_COPY_CODE_BTN, this._element);

    EventHandler.on(btnCopy, EVENT_CLICK, () => {
      this._copyCodeToClipboard();
    });
  }

  _setDefaultValue() {
    if (this._options.colorPickerValue) {
      const defaultValue = colorFromString(this._options.colorPickerValue);
      this._currentFormat = defaultValue.format;
      this._currentFormatValue = defaultValue;

      this._updateColors(this._currentFormat, this._currentFormatValue);
      this._updatePickersColorsAndPositions();
      this._updateAlphaRange();
      this._updateHueRange();
    }
  }

  _getRgbColorFromCanvas(e) {
    const canvas = SelectorEngine.findOne(SELECTOR_CANVAS, this._element);
    const x = e.offsetX;
    const y = e.offsetY;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(x, y, 1, 1).data;

    const r = imageData[0];
    const g = imageData[1];
    const b = imageData[2];

    return { r, g, b };
  }

  _updatePicker() {
    this._updateColorDot();
    this._updateInputs();

    if (this._options.colorPickerColorPalette) {
      this._updateCanvasDot();
    }
  }

  _updateColors(format = 'hsla', color = this._colors.hsla) {
    const colors = getColors(format, color);
    this._colors = colors;
  }

  _updateAlphaRangeBackground() {
    const alphaRange = SelectorEngine.findOne(SELECTOR_ALPHA_RANGE, this._element);
    const { r, g, b, a } = this._colors.rgba;

    alphaRange.style.setProperty(
      '--track-background',
      `linear-gradient(to right, transparent, rgba(${r},${g},${b}, ${a})`
    );
  }

  _copyCodeToClipboard() {
    const string = toString(this._currentFormat, this._currentFormatValue);
    navigator.clipboard.writeText(string);
  }

  _drawCanvas() {
    const canvas = SelectorEngine.findOne(SELECTOR_CANVAS, this._element);
    const hsla = {
      h: this._colors.hsla.h,
      s: 1,
      l: 0.5,
      a: 1,
    };

    const { r, g, b, a } = hslaToRgba(hsla);
    const rgbaColor = `rgba(${r},${g},${b}, ${a})`;
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext('2d');
    const grdBlack = ctx.createLinearGradient(0, 0, 0, height);
    const grdWhite = ctx.createLinearGradient(0, 0, width, 0);

    grdWhite.addColorStop(0, `rgba(255,255,255,${a})`);
    grdWhite.addColorStop(1, 'rgba(255,255,255,0)');
    grdBlack.addColorStop(0, 'rgba(0,0,0,0)');
    grdBlack.addColorStop(1, `rgba(0,0,0,${a})`);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = rgbaColor;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = grdWhite;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = grdBlack;
    ctx.fillRect(0, 0, width, height);
  }

  _updateColorDot() {
    const dot = SelectorEngine.findOne(SELECTOR_COLOR_DOT, this._element);
    const { r, g, b, a } = this._colors.rgba;

    dot.style.backgroundColor = `rgba(${r},${g},${b},${a})`;
    EventHandler.trigger(this._element, EVENT_COLOR_CHANGED, { color: this._currentFormatValue });
  }

  _updateCanvasDot() {
    const dot = SelectorEngine.findOne(SELECTOR_CANVAS_DOT, this._element);
    const canvas = SelectorEngine.findOne(SELECTOR_CANVAS, this._element);
    const dotHeight = parseFloat(window.getComputedStyle(dot).height);
    const dotWidth = parseFloat(window.getComputedStyle(dot).width);
    const x = this._colors.hsva.s * canvas.width;
    const y = (1 - this._colors.hsva.v) * canvas.height;

    dot.style.top = `${y - dotHeight / 2}px`;
    dot.style.left = `${x - dotWidth / 2}px`;
  }

  _updateHueRange() {
    const hueRange = SelectorEngine.findOne(SELECTOR_HUE_RANGE, this._element);

    hueRange.value = this._colors.hsla.h;
  }

  _updateAlphaRange() {
    const alphaRange = SelectorEngine.findOne(SELECTOR_ALPHA_RANGE, this._element);

    alphaRange.value = this._colors.hsla.a;
  }

  _updateInputs() {
    const inputs = SelectorEngine.find(SELECTOR_COLOR_INPUT, this._element);
    const [rgba, hsla, hsva, hex, cmyk] = COLOR_FORMATS;

    switch (this._currentFormat) {
      case rgba:
        inputs[0].value = this._colors.rgba.r;
        inputs[0].max = 255;
        inputs[0].step = 1;
        inputs[0].id = 'r';
        inputs[1].value = this._colors.rgba.g;
        inputs[1].max = 255;
        inputs[1].step = 1;
        inputs[1].id = 'g';
        inputs[2].value = this._colors.rgba.b;
        inputs[2].max = 255;
        inputs[2].step = 1;
        inputs[2].id = 'b';
        inputs[3].value = this._colors.rgba.a;
        inputs[3].max = 1;
        inputs[3].step = 0.01;
        inputs[3].id = 'a';

        this._currentFormatValue = this._colors.rgba;
        break;
      case hsla:
        inputs[0].value = this._colors.hsla.h;
        inputs[0].max = 360;
        inputs[0].step = 1;
        inputs[0].id = 'h';
        inputs[1].value = this._colors.hsla.s;
        inputs[1].max = 1;
        inputs[1].step = 0.01;
        inputs[1].id = 's';
        inputs[2].value = this._colors.hsla.l;
        inputs[2].max = 1;
        inputs[2].step = 0.01;
        inputs[2].id = 'l';
        inputs[3].value = this._colors.hsla.a;
        inputs[3].max = 1;
        inputs[3].step = 0.01;
        inputs[3].id = 'a';

        this._currentFormatValue = this._colors.hsla;
        break;
      case hsva:
        inputs[0].value = this._colors.hsva.h;
        inputs[0].max = 360;
        inputs[0].step = 0.01;
        inputs[0].id = 'h';
        inputs[1].value = this._colors.hsva.s;
        inputs[1].max = 1;
        inputs[1].step = 0.01;
        inputs[1].id = 's';
        inputs[2].value = this._colors.hsva.v;
        inputs[2].max = 1;
        inputs[2].step = 0.01;
        inputs[2].id = 'v';
        inputs[3].value = this._colors.hsva.a;
        inputs[3].max = 1;
        inputs[3].step = 0.01;
        inputs[3].id = 'a';

        this._currentFormatValue = this._colors.hsva;
        break;
      case hex:
        inputs[0].value = this._colors.hex;
        inputs[0].id = 'hex';
        this._currentFormatValue = this._colors.hex;
        break;
      case cmyk:
        inputs[0].value = this._colors.cmyk.c;
        inputs[0].max = 100;
        inputs[0].step = 1;
        inputs[0].id = 'c';
        inputs[1].value = this._colors.cmyk.m;
        inputs[1].max = 100;
        inputs[1].step = 1;
        inputs[1].id = 'm';
        inputs[2].value = this._colors.cmyk.y;
        inputs[2].max = 100;
        inputs[2].step = 1;
        inputs[2].id = 'y';
        inputs[3].value = this._colors.cmyk.k;
        inputs[3].max = 100;
        inputs[3].step = 1;
        inputs[3].id = 'k';

        this._currentFormatValue = this._colors.cmyk;
        break;
      default:
        break;
    }
  }

  _initInputs() {
    const inputs = SelectorEngine.find('.form-outline', this._element);
    inputs.forEach((formOutline) => {
      const input = new mdb.Input(formOutline);
      input.init();
    });
  }

  _initDropdown() {
    const dropdown = SelectorEngine.parents(this._element, '.dropdown')[0];
    const dropdownToggler = SelectorEngine.findOne(SELECTOR_DROPDOWN, dropdown);
    // eslint-disable-next-line no-unused-vars
    const dropdownInstance = new mdb.Dropdown(dropdownToggler);
  }

  _changeColorFormat(colorIndex) {
    const format = COLOR_FORMATS[colorIndex] || COLOR_FORMATS[0];
    const colorInputsWrapper = SelectorEngine.findOne(SELECTOR_COLOR_INPUTS_WRAPPER, this._element);
    const isHexInput = SelectorEngine.findOne(SELECTOR_HEX_INPUT, this._element);

    this._currentFormat = format;

    if (isHexInput) {
      while (SelectorEngine.findOne(SELECTOR_COLOR_INPUT, this._element)) {
        colorInputsWrapper.firstChild.remove();
      }

      colorInputsWrapper.insertAdjacentHTML(
        'afterbegin',
        create.pickerColorInputs(format.split(''))
      );
      this._updateInputs();
      this._initInputs();
      this._bindOnInputChange();
    } else if (format === 'hex') {
      while (SelectorEngine.findOne(SELECTOR_COLOR_INPUT, this._element)) {
        colorInputsWrapper.firstChild.remove();
      }
      colorInputsWrapper.insertAdjacentHTML('afterbegin', create.pickerColorHexInput());
      this._updateInputs();
      this._initInputs();
      this._bindOnInputChange();
    } else {
      const inputLabels = SelectorEngine.find(SELECTOR_COLOR_INPUTS_LABEL, this._element);
      format.split('').forEach((el, index) => {
        inputLabels[index].innerText = el;
      });
      this._updateInputs();
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

      if (!data && /dispose|hide/.test(config)) {
        return;
      }

      if (!data) {
        data = new ColorPicker(this, _config);
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
  let instance = ColorPicker.getInstance(el);
  if (!instance) {
    instance = new ColorPicker(el);
  }

  return instance;
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .ColorPicker to jQuery only if jQuery is present
 */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = ColorPicker.jQueryInterface;
    $.fn[NAME].Constructor = ColorPicker;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return ColorPicker.jQueryInterface;
    };
  }
});

export default ColorPicker;
