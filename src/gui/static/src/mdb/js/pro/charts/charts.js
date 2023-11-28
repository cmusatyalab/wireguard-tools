import {
  Chart as Chartjs,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
  SubTitle,
} from 'chart.js';
import merge from 'deepmerge';
import { element, typeCheckConfig } from '../../mdb/util/index';
import Data from '../../mdb/dom/data';
import Manipulator from '../../mdb/dom/manipulator';
import BaseComponent from '../../free/base-component';
import { bindCallbackEventsIfNeeded } from '../../autoinit/init';
import DEFAULT_OPTIONS from './chartsDefaults';

Chartjs.register(
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
  SubTitle
);

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'chart';
const DATA_KEY = 'mdb.chart';
const CLASSNAME_CHARTS = 'chart';

const GENERATE_DATA = (options, type, defaultType) => {
  const mergeObjects = (target, source, options) => {
    const destination = target.slice();
    source.forEach((item, index) => {
      if (typeof destination[index] === 'undefined') {
        destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
      } else if (options.isMergeableObject(item)) {
        destination[index] = merge(target[index], item, options);
      } else if (target.indexOf(item) === -1) {
        destination.push(item);
      }
    });
    return destination;
  };
  return merge(defaultType[type], options, {
    arrayMerge: mergeObjects,
  });
};

const DEFAULT_DARK_OPTIONS = {
  darkTicksColor: '#fff',
  darkLabelColor: '#fff',
  darkGridLinesColor: '#555',
  darkmodeOff: 'undefined',
  darkMode: null,
  darkBgColor: '#262626',
  darkBgColorLight: '#fff',
  options: null,
};

const DARK_OPTIONS_TYPE = {
  darkTicksColor: 'string',
  darkLabelColor: 'string',
  darkGridLinesColor: 'string',
  darkmodeOff: '(string|null)',
  darkMode: '(string|null)',
  darkBgColor: 'string',
  darkBgColorLight: 'string',
  options: '(object|null)',
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */
//
class Chart extends BaseComponent {
  constructor(element, data, options = {}, darkOptions = {}) {
    super(element);
    this._data = data;
    this._options = options;
    this._type = data.type;
    this._canvas = null;
    this._chart = null;
    this._darkOptions = this._getDarkConfig(darkOptions);
    this._darkModeClassContainer = document.querySelector('html');
    this._prevConfig = null;
    this._observer = null;

    if (this._element) {
      Manipulator.addClass(this._element, CLASSNAME_CHARTS);
      this._chartConstructor();
      Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
      bindCallbackEventsIfNeeded(this.constructor);
    }

    if (this._element && this._darkOptions.darkmodeOff !== null) {
      // check mode on start
      let mode;

      switch (this._darkOptions.darkMode) {
        case 'dark':
          mode = 'dark';
          break;
        case 'light':
          mode = 'light';
          break;
        default:
          mode = this.systemColorMode;
          break;
      }

      this._handleMode(mode);
      // observe darkmode class container change
      this._observer = new MutationObserver(this._observerCallback.bind(this));
      this._observer.observe(this._darkModeClassContainer, {
        attributes: true,
      });
    }
  }

  // Getters
  static get NAME() {
    return NAME;
  }

  get systemColorMode() {
    return (
      localStorage.theme ||
      Manipulator.getDataAttribute(this._darkModeClassContainer, 'theme') ||
      'light'
    );
  }

  static get BarController() {
    return BarController;
  }

  static get BubbleController() {
    return BubbleController;
  }

  static get DoughnutController() {
    return DoughnutController;
  }

  static get LineController() {
    return LineController;
  }

  static get PieController() {
    return PieController;
  }

  static get PolarAreaController() {
    return PolarAreaController;
  }

  static get RadarController() {
    return RadarController;
  }

  static get ScatterController() {
    return ScatterController;
  }

  // Public
  dispose() {
    this._observer.disconnect();
    Data.removeData(this._element, DATA_KEY);

    this._chart.destroy();
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    super.dispose();
  }

  update(data, config) {
    if (data) {
      this._data = { ...this._data, ...data };
      this._chart.data = this._data;
    }

    const configOptions = Object.prototype.hasOwnProperty.call(config, 'options')
      ? config
      : { options: { ...config } };

    this._options = merge(this._options, configOptions);

    this._chart.options = GENERATE_DATA(this._options, this._type, DEFAULT_OPTIONS).options;

    this._chart.update();
  }

  static register(MyType) {
    Chartjs.register(MyType);
  }

  setTheme(theme) {
    if ((theme !== 'dark' && theme !== 'light') || !this._data) {
      return;
    }
    this._handleMode(theme);
  }

  // Private
  _getDarkConfig(config) {
    let dataAttributes = {};
    const dataAttr = Manipulator.getDataAttributes(this._element);
    Object.keys(dataAttr).forEach(
      (key) => key.startsWith('dark') && (dataAttributes[key] = dataAttr[key])
    );

    dataAttributes = {
      ...DEFAULT_DARK_OPTIONS,
      ...dataAttributes,
    };

    const xyScale = {
      y: {
        ticks: {
          color: dataAttributes.darkTicksColor,
        },
        grid: {
          color: dataAttributes.darkGridLinesColor,
        },
      },
      x: {
        ticks: {
          color: dataAttributes.darkTicksColor,
        },
        grid: {
          color: dataAttributes.darkGridLinesColor,
        },
      },
    };

    const rScale = {
      r: {
        ticks: {
          color: dataAttributes.darkTicksColor,
          backdropColor: dataAttributes.darkBgColor,
        },
        grid: {
          color: dataAttributes.darkGridLinesColor,
        },
        pointLabels: {
          color: dataAttributes.darkTicksColor,
        },
      },
    };

    const radials = ['pie', 'doughnut', 'polarArea', 'radar'];

    let scales = {};

    if (!radials.includes(this._type)) {
      scales = xyScale;
    } else if (['polarArea', 'radar'].includes(this._type)) {
      scales = rScale;
    }

    const opt = {
      scales,
      plugins: {
        legend: {
          labels: {
            color: dataAttributes.darkLabelColor,
          },
        },
      },
    };

    // combine config
    config = {
      ...dataAttributes,
      options: {
        ...opt,
      },
      ...config,
    };

    typeCheckConfig(NAME, config, DARK_OPTIONS_TYPE);

    return config;
  }

  _chartConstructor() {
    if (this._data) {
      this._createCanvas();

      const options = GENERATE_DATA(this._options, this._type, DEFAULT_OPTIONS);

      this._chart = new Chartjs(this._canvas, {
        ...this._data,
        ...options,
      });
    }
  }

  _createCanvas() {
    if (this._canvas) return;
    if (this._element.nodeName === 'CANVAS') {
      this._canvas = this._element;
    } else {
      this._canvas = element('canvas');
      this._element.appendChild(this._canvas);
    }
  }

  _handleMode(systemColor) {
    if (systemColor === 'dark') {
      this._changeDatasetBorderColor();
      this.update(null, this._darkOptions.options);
    } else {
      this._changeDatasetBorderColor(false);
      this._prevConfig && this.update(null, this._prevConfig);
    }
  }

  _observerCallback(mutationList) {
    mutationList.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        this._handleMode(this.systemColorMode);
      }
    });
  }

  _changeDatasetBorderColor(dark = true) {
    if (!this._data.data) {
      return;
    }

    [...this._data.data.datasets].forEach(
      (set) =>
        ['pie', 'doughnut', 'polarArea'].includes(this._type) &&
        (set.borderColor = dark
          ? this._darkOptions.darkBgColor
          : this._darkOptions.darkBgColorLight)
    );
  }

  static jQueryInterface(data, options, type) {
    return this.each(function () {
      let chartData = Data.getData(this, DATA_KEY);

      if (!chartData && /dispose/.test(data)) {
        return;
      }

      if (!chartData) {
        const chartOptions = options
          ? GENERATE_DATA(options, type, DEFAULT_OPTIONS)
          : DEFAULT_OPTIONS[type];

        chartData = new Chart(this, data, chartOptions);
      }

      if (typeof data === 'string') {
        if (typeof chartData[data] === 'undefined') {
          throw new TypeError(`No method named "${data}"`);
        }

        chartData[data](options, type);
      }
    });
  }

  static getInstance(element) {
    return Data.getData(element, DATA_KEY);
  }

  static getOrCreateInstance(element, config = {}) {
    return (
      this.getInstance(element) || new this(element, typeof config === 'object' ? config : null)
    );
  }
}

export default Chart;
