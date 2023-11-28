/* eslint-disable no-restricted-globals */
import PerfectScrollbar from 'perfect-scrollbar';
import { typeCheckConfig } from '../mdb/util/index';
import Data from '../mdb/dom/data';
import Manipulator from '../mdb/dom/manipulator';
import EventHandler from '../mdb/dom/event-handler';
import BaseComponent from '../free/base-component';
import { bindCallbackEventsIfNeeded } from '../autoinit/init';

const NAME = 'perfectScrollbar';
const CLASSNAME_PS = 'perfect-scrollbar';
const DATA_KEY = 'mdb.perfectScrollbar';
const MDB_NAME = 'mdb';
const PS_NAME = 'ps';

const EVENTS = [
  { mdb: `scrollX.${MDB_NAME}.${PS_NAME}`, ps: 'ps-scroll-x' },
  { mdb: `scrollY.${MDB_NAME}.${PS_NAME}`, ps: 'ps-scroll-y' },
  { mdb: `scrollUp.${MDB_NAME}.${PS_NAME}`, ps: 'ps-scroll-up' },
  { mdb: `scrollDown.${MDB_NAME}.${PS_NAME}`, ps: 'ps-scroll-down' },
  { mdb: `scrollLeft.${MDB_NAME}.${PS_NAME}`, ps: 'ps-scroll-left' },
  { mdb: `scrollRight.${MDB_NAME}.${PS_NAME}`, ps: 'ps-scroll-right' },
  { mdb: `scrollXEnd.${MDB_NAME}.${PS_NAME}`, ps: 'ps-x-reach-end' },
  { mdb: `scrollYEnd.${MDB_NAME}.${PS_NAME}`, ps: 'ps-y-reach-end' },
  { mdb: `scrollXStart.${MDB_NAME}.${PS_NAME}`, ps: 'ps-x-reach-start' },
  { mdb: `scrollYStart.${MDB_NAME}.${PS_NAME}`, ps: 'ps-y-reach-start' },
];

const Default = {
  handlers: ['click-rail', 'drag-thumb', 'keyboard', 'wheel', 'touch'],
  wheelSpeed: 1,
  wheelPropagation: true,
  swipeEasing: true,
  minScrollbarLength: null,
  maxScrollbarLength: null,
  scrollingThreshold: 1000,
  useBothWheelAxes: false,
  suppressScrollX: false,
  suppressScrollY: false,
  scrollXMarginOffset: 0,
  scrollYMarginOffset: 0,
};

const DefaultType = {
  handlers: '(string|array)',
  wheelSpeed: 'number',
  wheelPropagation: 'boolean',
  swipeEasing: 'boolean',
  minScrollbarLength: '(number|null)',
  maxScrollbarLength: '(number|null)',
  scrollingThreshold: 'number',
  useBothWheelAxes: 'boolean',
  suppressScrollX: 'boolean',
  suppressScrollY: 'boolean',
  scrollXMarginOffset: 'number',
  scrollYMarginOffset: 'number',
};

class PerfectScrollbars extends BaseComponent {
  constructor(element, options = {}) {
    super(element);

    this._options = this._getConfig(options);
    this.perfectScrollbar = null;

    if (this._element) {
      Manipulator.addClass(this._element, CLASSNAME_PS);
    }

    this.init();
    Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
    bindCallbackEventsIfNeeded(this.constructor);
  }

  // Getters
  static get NAME() {
    return NAME;
  }

  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._element);

    if (dataAttributes.handlers !== undefined) {
      dataAttributes.handlers = dataAttributes.handlers.split(' ');
    }

    config = {
      ...Default,
      ...dataAttributes,
      ...config,
    };

    typeCheckConfig(NAME, config, DefaultType);
    return config;
  }

  // Public
  dispose() {
    this.removeEvent(EVENTS);
    this.perfectScrollbar.destroy();
    this.perfectScrollbar = null;
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    super.dispose();
  }

  init() {
    this.perfectScrollbar = new PerfectScrollbar(this._element, this._options);

    this._initEvents(EVENTS);
  }

  update() {
    return this.perfectScrollbar.update();
  }

  _initEvents(events = []) {
    events.forEach(({ ps, mdb }) =>
      EventHandler.on(this._element, ps, (e) => EventHandler.trigger(this._element, mdb, { e }))
    );
  }

  removeEvent(event) {
    let filter = [];

    if (typeof event === 'string') {
      filter = EVENTS.filter(({ mdb }) => mdb === event);
    }

    filter.forEach(({ ps, mdb }) => {
      EventHandler.off(this._element, ps);
      EventHandler.off(this._element, mdb);
    });
  }

  // Static

  static jQueryInterface(config) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose|hide/.test(config)) {
        return;
      }

      if (!data) {
        data = new PerfectScrollbars(this, _config);
      }

      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config]();
      }
    });
  }
}

export default PerfectScrollbars;
