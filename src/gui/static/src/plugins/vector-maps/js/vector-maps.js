import { createPopper } from '@popperjs/core';
import { element, getjQuery, typeCheckConfig, onDOMContentLoaded } from './mdb/util/index';
import Data from './mdb/dom/data';
import Manipulator from './mdb/dom/manipulator';
import EventHandler from './mdb/dom/event-handler';
import SelectorEngine from './mdb/dom/selector-engine';
import Touch from './touch/index';
import {
  parseToHTML,
  getElementCenter,
  getEventCoordinates,
  getVector,
  getDisplacement,
  setAttributes,
  getAttributeName,
  generateGetBoundingClientRect,
} from './util';
import MAPS from './maps';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'vectorMap';
const DATA_KEY = 'mdb.vectorMap';

const CLASSNAME_VECTOR_MAP = 'vector-map';
const CLASSNAME_TOOLTIP = 'vector-map-tooltip';
const CLASSNAME_SHOW = 'show';
const CLASSNAME_DRAGGED = 'vector-map-dragged';
const CLASSNAME_MARKER = 'vector-map-marker';
const CLASSNAME_INNER_CIRCLE = 'pin-inner-circle';
const CLASSNAME_SHADOW_CIRCLE = 'pin-shadow-circle';
const CLASSNAME_ANIMATED_CIRCLE = 'animated-circle';

const EVENT_MARKER_CLICK = 'markerClick.mdb.vectorMap';
const EVENT_SELECT = 'areaSelect.mdb.vectorMap';

const SELECTOR_ZOOM_IN_BTN = '.zoom-in';
const SELECTOR_ZOOM_OUT_BTN = '.zoom-out';
const SELECTOR_INNER_CIRCLE = '.pin-inner-circle';
const SELECTOR_SHADOW_CIRCLE = '.pin-shadow-circle';

const SELECTOR_DATA_INIT = '[data-mdb-vector-map-init]';

const PIN_HEIGHT = 40;
const PIN_RADIUS = 14;

const DEFAULT_OPTIONS = {
  btnClass: 'btn-dark',
  colorMap: [],
  fill: '#E0E0E0',
  fillOpacity: 1,
  height: null,
  hover: true,
  hoverFill: '#BDBDBD',
  map: 'world',
  markers: [],
  markerFill: '#757575',
  markerStroke: '#000',
  markerInnerFill: 'rgba(0, 0, 0, 0.3)',
  markerStrokeWidth: 1.2,
  readonly: false,
  scale: 1,
  selectFill: '#B23CFD',
  selectRegion: null,
  stroke: '#000',
  strokeLinejoin: 'round',
  strokeOpacity: 1,
  strokeWidth: 0.5,
  tooltips: true,
  width: null,
  zoomEvents: true,
  zoomMax: null,
  zoomMin: 1,
  zoomStep: 0.5,
};

const OPTIONS_TYPE = {
  btnClass: 'string',
  colorMap: 'array',
  fill: 'string',
  fillOpacity: 'number',
  height: '(string|number|null)',
  hover: 'boolean',
  hoverFill: 'string',
  map: 'string',
  markers: 'array',
  markerFill: 'string',
  readonly: 'boolean',
  stroke: 'string',
  strokeOpacity: 'number',
  scale: 'number',
  selectFill: 'string',
  selectRegion: '(string|null)',
  strokeLinejoin: 'string',
  strokeWidth: 'number',
  tooltips: 'boolean',
  width: '(string|number|null)',
  zoomEvents: 'boolean',
  zoomMax: '(null|number)',
  zoomMin: 'number',
  zoomStep: 'number',
};

const SVG_OPTIONS = [
  'fill',
  'width',
  'height',
  'fillOpacity',
  'stroke',
  'strokeOpacity',
  'strokeWidth',
  'strokeLinejoin',
];

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class VectorMap {
  constructor(element, options = {}) {
    this._element = element;
    this._options = this._getConfig(options);

    // SVG
    this._svgMap = null;
    this._mapUnits = [];
    this._selection = null;
    this._markers = [];
    this._activeMarkerIndex = -1;

    // Tooltips
    this._toolbar = null;
    this._popper = null;
    this._tooltip = null;
    this._virtualElement = null;

    // Position
    this._x = 0;
    this._y = 0;
    this._prevPosition = null;

    this._origin = { x: 0, y: 0 };

    // Scale
    this._scale = this._options.scale;
    this._zoomInBtn = null;
    this._zoomOutBtn = null;
    this._vector = null;

    // Handlers
    this._mousedownHandler = (e) => this._handleDragstart(e);
    this._mousemoveHandler = (e) => this._handleDrag(e);
    this._mouseupHandler = () => this._handleDragend();

    this._touchstartHandler = (e) => this._handleTouchstart(e);
    this._touchmoveHandler = (e) => this._handleTouchmove(e);
    this._touchendHandler = (e) => this._handleTouchend(e);

    this._wheelHandler = (e) => this._handleWheel(e);
    this._pinchHandler = (e) => this._handlePinch(e);

    // Touch
    this._touch = null;

    if (this._element) {
      Data.setData(element, DATA_KEY, this);

      this._setup();
    }
  }

  get activeMarker() {
    return this._markers.find((_, i) => i === this._activeMarkerIndex);
  }

  get dragging() {
    return this._prevPosition !== null;
  }

  get elementRect() {
    return this._element.getBoundingClientRect();
  }

  get hoverEvents() {
    return this._options.hover || this._options.tooltips;
  }

  get mapRect() {
    return this._svgMap.getBoundingClientRect();
  }

  get pin() {
    return {
      height: PIN_HEIGHT / this._scale,
      radius: PIN_RADIUS / this._scale,
      innerRadius: (PIN_RADIUS / this._scale) * 0.5,
    };
  }

  get selectedUnit() {
    return this._mapUnits[this._selection];
  }

  // Public
  dispose() {
    if (this._element) {
      this._removeMapElements();

      Manipulator.removeClass(this._element, CLASSNAME_VECTOR_MAP);

      Data.removeData(this._element, DATA_KEY);

      this._removeEventHandlers();

      this._touch.dispose();

      if (this._popper) {
        this._popper.destroy();
      }
    }
    this._element = null;
  }

  select(region) {
    const index = this._mapUnits.findIndex((unit) => unit.id === region);

    if (index !== -1) {
      this._selectUnit(this._mapUnits[index], index);
    }
  }

  update(options) {
    const updateMap = options.map && options.map !== this._options.map;

    this._removeEventHandlers();

    if (updateMap) {
      this._removeMapElements();

      this._touch.dispose();
    }

    if (options.markers) {
      // clear markers
      this._markers.forEach((marker) => {
        this._svgMap.removeChild(marker.node);

        if (marker.animationNode) {
          this._svgMap.removeChild(marker.animationNode);
        }
      });
    }

    if (options.colorMap) {
      // clear fills
      this._mapUnits.forEach((unit) => {
        unit.fill = null;
        unit.element.removeAttribute('fill');
      });
    }

    this._options = this._getConfig({ ...this._options, ...options });
    this._scale = this._options.scale;

    if (updateMap) {
      this._renderMap();

      this._setupToolbar();

      this._setupTouch();
    }

    this._setupSVGProperties();

    this._zoom(0);

    if (updateMap) {
      this._mapUnits = this._getMapUnits();

      this._setupMapUnits();
    } else {
      this._setupMapUnits(true);
    }

    if (this._options.tooltips) {
      this._setupTooltips();
    }

    this._setupMarkers();

    this._setupEventListeners();
  }

  // Private

  _allowZoom(factor) {
    const { zoomMax, zoomMin } = this._options;

    return !(this._scale === zoomMax && factor > 0) && !(this._scale === zoomMin && factor < 0);
  }

  _getConfig(options) {
    const config = {
      ...DEFAULT_OPTIONS,
      ...Manipulator.getDataAttributes(this._element),
      ...options,
    };

    typeCheckConfig(NAME, config, OPTIONS_TYPE);

    return config;
  }

  _getSVGMap() {
    const map = MAPS[this._options.map];

    if (!map) {
      throw new TypeError(`Map "${this._options.map}" is not available`);
    }

    const mapNode = SelectorEngine.findOne('svg', parseToHTML(map));

    return mapNode;
  }

  _getMapUnits() {
    return SelectorEngine.find('path', this._svgMap).map((path) => {
      const id = path.getAttribute('id');
      const title = path.getAttribute('title') || path.getAttribute('name');
      const d = path.getAttribute('d');

      return {
        element: path,
        d,
        id,
        title,
        selected: false,
      };
    });
  }

  _getToolbar() {
    const toolbar = element('div');

    Manipulator.addClass(toolbar, 'vector-map-toolbar');

    toolbar.innerHTML = `
    <button class="btn btn-floating ${this._options.btnClass} zoom-in" data-mdb-ripple-init aria-label="Zoom in"><i class="fa fa-plus"></i></button>
    <button class="btn btn-floating ${this._options.btnClass} zoom-out" data-mdb-ripple-init aria-label="Zoom out"><i class="fa fa-minus"></i></button>`;

    return toolbar;
  }

  _getValueInMapBoundry({ x, y }) {
    const margins = this._getMapMargins();

    let xPosition = this._x;
    let yPosition = this._y;

    if ((x < 0 && margins.right > 0) || (x > 0 && margins.left > 0)) {
      xPosition += x;
    }

    if ((y > 0 && margins.top > 0) || (y < 0 && margins.bottom > 0)) {
      yPosition += y;
    }

    return {
      x: xPosition,
      y: yPosition,
    };
  }

  _getMapMargins() {
    return {
      left: this.elementRect.left - this.mapRect.left,
      top: this.elementRect.top - this.mapRect.top,
      right: this.mapRect.right - this.elementRect.right,
      bottom: this.mapRect.bottom - this.elementRect.bottom,
    };
  }

  _getOrigin(point) {
    const rect = this.mapRect;

    const position = {
      x: (point.x - rect.x) / this._scale,
      y: (point.y - rect.y) / this._scale,
    };

    const dx = (position.x - this._origin.x - this._x) / this._scale;
    const dy = (position.y - this._origin.y - this._y) / this._scale;

    const origin = {
      x: this._origin.x + dx,
      y: this._origin.y + dy,
    };

    return origin;
  }

  _getBullet({ fill, x, y, r }, animate = false) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const scaledRadius = r / this._scale;
    setAttributes(circle, {
      cx: x,
      cy: y,
      r: scaledRadius,
      strokeWidth: 0,
      fill,
      opacity: animate ? 0.3 : 1,
    });

    if (animate) {
      Manipulator.addClass(circle, CLASSNAME_ANIMATED_CIRCLE);

      circle.innerHTML = `<animate attributeName="r" values="${scaledRadius};${
        scaledRadius * 5
      };${scaledRadius}" dur="1.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;0.3;0" dur="1.5s" repeatCount="indefinite" />
      `;
    }
    return circle;
  }

  _getPin(marker) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const circle = this._getPinInnerCircle({ ...marker, ...this.pin });
    const path = this._getPinPathElement({ ...marker, ...this.pin });
    const shadow = this._getPinShadowCircle({ ...marker, ...this.pin });

    g.appendChild(shadow);
    g.appendChild(path);
    g.appendChild(circle);
    return g;
  }

  _getPinPathElement({ x, y, height, radius, stroke, strokeWidth, fill }) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    setAttributes(path, {
      d: this._getPinPath({ height, radius, x, y }),
      stroke,
      strokeWidth: strokeWidth / this._scale,
      fill,
    });

    return path;
  }

  _getPinPath({ height, radius, x, y }) {
    const dyAC = height - radius;
    const alpha = Math.acos(radius / dyAC);
    const deltaX = radius * Math.sin(alpha);
    const deltaY = (height * (height - radius * 2)) / dyAC;
    return `M ${x},${y} 
      l ${-deltaX},${-deltaY}
      A ${radius} ${radius} 1 1 1 ${x + deltaX},${y - deltaY} 
      l 0,0 z`;
  }

  _getPinShadowCircle({ x, y, innerRadius }) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    Manipulator.addClass(circle, CLASSNAME_SHADOW_CIRCLE);

    setAttributes(circle, {
      strokeWidth: 0,
      cx: x,
      cy: y,
      r: innerRadius / 2,
      fill: 'rgba(0, 0, 0, 0.2)',
    });

    return circle;
  }

  _getPinInnerCircle({ x, y, height, radius, innerRadius, stroke, innerFill }) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    Manipulator.addClass(circle, CLASSNAME_INNER_CIRCLE);

    setAttributes(circle, {
      strokeWidth: 0,
      stroke,
      cx: x,
      cy: y - (height + radius) / 2,
      r: innerRadius,
      fill: innerFill,
    });

    return circle;
  }

  _handleUnitMouseover(unit) {
    if (this.dragging) {
      return;
    }

    if (this._options.hover) {
      unit.element.setAttribute('fill', this._options.hoverFill);
    }

    if (this._options.tooltips) {
      this._showTooltip(unit);
    }
  }

  _handleUnitMouseout(unit) {
    if (this._options.hover) {
      if (unit.selected) {
        unit.element.setAttribute('fill', this._options.selectFill);
      } else if (unit.fill) {
        unit.element.setAttribute('fill', unit.fill);
      } else {
        unit.element.removeAttribute('fill');
      }
    }

    if (this._options.tooltips) {
      this._hideTooltip();
    }
  }

  _handleDragstart(event) {
    if (event.touches && event.touches.length > 1) {
      return;
    }
    this._prevPosition = getEventCoordinates(event);
    Manipulator.addClass(this._element, CLASSNAME_DRAGGED);
  }

  _handleDrag(event) {
    if (event.touches && event.touches.length > 1) {
      return;
    }

    if (!this._prevPosition) {
      return;
    }

    event.preventDefault();

    const mousePosition = getEventCoordinates(event);
    const displacement = this._getValueInMapBoundry(
      getDisplacement(mousePosition, this._prevPosition)
    );

    this._x = displacement.x;
    this._y = displacement.y;

    this._prevPosition = mousePosition;

    this._updateMapTransform();

    this._updateMarkerTooltips();
  }

  _handleDragend() {
    this._prevPosition = null;

    Manipulator.removeClass(this._element, CLASSNAME_DRAGGED);
  }

  _handleTouchstart(e) {
    if (e.touches.length > 1) {
      this._vector = getVector(e);

      this._origin = { ...this._vector.center };

      this._updateTransformOrigin();

      return;
    }

    this._handleDragstart(e);
  }

  _handleTouchmove(e) {
    if (e.touches.length > 1 && this._vector) {
      e.preventDefault();
      e.stopPropagation();

      const vector = getVector(e);

      const ratio = vector.length / this._vector.length;
      const scaleFactor = this._scale * (ratio - 1);

      this._zoom(scaleFactor);

      this._vector = vector;
      return;
    }
    this._handleDrag(e);
  }

  _handleTouchend(e) {
    if (e.touches.length > 1) {
      this._vector = null;
      return;
    }
    this._handleDragend();
  }

  _handleWheel(event) {
    event.preventDefault();

    const mousePosition = getEventCoordinates(event);

    const direction = event.deltaY < 0 ? 1 : -1;
    const factor = direction * this._options.zoomStep;

    if (!this._allowZoom(factor)) {
      return;
    }

    this._origin = this._getOrigin(mousePosition);

    this._updateTransformOrigin();

    this._setInitialMapPosition();

    this._updateMapTransform();

    this._zoom(factor);
  }

  _handlePinch(event) {
    const factor = this._scale * (event.ratio - 1);

    if (!this._allowZoom(factor)) {
      return;
    }

    this._origin = this._getOrigin(event.origin);

    this._updateTransformOrigin();

    this._setInitialMapPosition();

    this._updateMapTransform();

    this._zoom(factor);
  }

  _hideTooltip() {
    Manipulator.removeClass(this._tooltip, CLASSNAME_SHOW);
  }

  _showTooltip(unit) {
    this._tooltip.innerHTML = `<strong>${unit.title}</strong>
    <div>${unit.tooltip || ''}</div>`;

    Manipulator.addClass(this._tooltip, CLASSNAME_SHOW);

    EventHandler.on(unit.element, 'mousemove', ({ clientX, clientY }) => {
      this._virtualElement.getBoundingClientRect = generateGetBoundingClientRect(clientX, clientY);
      this._virtualElement.contextElement = unit.element;
      this._popper.update();
    });
  }

  _selectUnit(unit, index, update = false) {
    // Clear previous selection
    if (this._selection !== null) {
      this.selectedUnit.selected = false;

      if (this.selectedUnit.fill) {
        this.selectedUnit.element.setAttribute('fill', this.selectedUnit.fill);
      } else {
        this.selectedUnit.element.removeAttribute('fill');
      }
    }

    if (this._selection === index && !update) {
      this._selection = null;
    } else {
      this._selection = index;
      this.selectedUnit.selected = true;
      unit.element.setAttribute('fill', this._options.selectFill);
    }

    EventHandler.trigger(this._element, EVENT_SELECT, { selected: this.selectedUnit });
  }

  _setUnitsData() {
    this._options.colorMap.forEach((settings) => {
      settings.regions.forEach((region) => {
        const tooltip = region.tooltip || '';
        const unit = this._mapUnits.find((unit) => {
          if (typeof region === 'string') {
            return unit.id === region;
          }

          return unit.id === region.id;
        });

        if (!unit) {
          return;
        }

        unit.fill = settings.fill;
        unit.tooltip = tooltip;
      });
    });
  }

  _setInitialMapPosition() {
    this._x = 0;
    this._y = 0;
  }

  _setActiveMarker(index) {
    if (index !== this._activeMarkerIndex) {
      this._activeMarkerIndex = index;
    } else {
      this._activeMarkerIndex = -1;
    }

    EventHandler.trigger(this._element, EVENT_MARKER_CLICK, { marker: this.activeMarker });
  }

  _setup() {
    const { initMDB, Ripple } = mdb;
    initMDB({ Ripple });

    Manipulator.addClass(this._element, CLASSNAME_VECTOR_MAP);

    this._renderMap();

    this._setupSVGProperties();

    this._setupToolbar();

    this._setupMapPosition();

    this._mapUnits = this._getMapUnits();

    this._setupMapUnits();

    this._setupTouch();

    if (this._options.tooltips) {
      this._setupTooltips();
    }

    this._setupMarkers();

    this._setupEventListeners();
  }

  _setupToolbar() {
    this._toolbar = this._getToolbar();

    this._element.appendChild(this._toolbar);

    this._zoomInBtn = SelectorEngine.findOne(SELECTOR_ZOOM_IN_BTN, this._element);
    this._zoomOutBtn = SelectorEngine.findOne(SELECTOR_ZOOM_OUT_BTN, this._element);

    this._toggleZoomBtns();
  }

  _setupMapPosition() {
    this._origin = getElementCenter(this.mapRect);

    this._updateTransformOrigin();

    this._setInitialMapPosition();

    this._updateMapTransform();
  }

  _setupMapUnits(update = false) {
    this._setUnitsData();

    this._mapUnits.forEach((unit, index) => {
      if (this._options.selectRegion === unit.id) {
        this._selectUnit(unit, index, update);
      } else if (unit.fill) {
        unit.element.setAttribute('fill', unit.fill);
      }
    });
  }

  _setupTouch() {
    this._touch = new Touch(this._svgMap, 'pinch');
    this._touch.init();
  }

  _setupSVGProperties() {
    const svgStyle = {};

    SVG_OPTIONS.forEach((option) => {
      const property = getAttributeName(option);
      const value = this._options[option];

      if (option === 'strokeWidth') {
        svgStyle[property] = value / this._scale;
      } else if (value !== null) {
        svgStyle[property] = value;
      }
    });

    Manipulator.style(this._svgMap, svgStyle);
  }

  _setupEventListeners() {
    this._mapUnits.forEach((unit, i) => {
      if (!this._options.readonly) {
        EventHandler.on(unit.element, 'click', () => this._selectUnit(unit, i));
      }

      if (this.hoverEvents) {
        EventHandler.on(unit.element, 'mouseover', () => this._handleUnitMouseover(unit));
        EventHandler.on(unit.element, 'mouseout', () => this._handleUnitMouseout(unit));
      }
    });

    // Dragging
    EventHandler.on(this._svgMap, 'mousedown', this._mousedownHandler);
    EventHandler.on(window, 'mousemove', this._mousemoveHandler);
    EventHandler.on(window, 'mouseup', this._mouseupHandler);

    // Dragging - touch
    EventHandler.on(this._element, 'touchstart', this._mousedownHandler);
    window.addEventListener('touchmove', this._mousemoveHandler, { passive: false }); // Event listener has to be passive to prevent scrolling
    EventHandler.on(window, 'touchend', this._mouseupHandler);

    // Zoom
    EventHandler.on(this._zoomInBtn, 'click', (e) => {
      e.preventDefault();

      this._zoom(this._options.zoomStep);
    });

    EventHandler.on(this._zoomOutBtn, 'click', (e) => {
      e.preventDefault();

      this._zoom(-1 * this._options.zoomStep);
    });

    if (this._options.zoomEvents) {
      EventHandler.on(this._element, 'wheel', this._wheelHandler);
      EventHandler.on(this._svgMap, 'pinch', this._pinchHandler);
    }

    this._markers.forEach((marker, i) => {
      EventHandler.on(marker.node, 'click', () => this._setActiveMarker(i));
    });
  }

  _setupTooltips() {
    this._tooltip = element('div');
    Manipulator.addClass(this._tooltip, CLASSNAME_TOOLTIP);
    this._element.appendChild(this._tooltip);

    this._virtualElement = {
      getBoundingClientRect: generateGetBoundingClientRect(),
    };

    this._popper = createPopper(this._virtualElement, this._tooltip);
  }

  _setupMarkers() {
    this._markers = this._options.markers.map((marker) => {
      const output = {
        r: 5,
        x: 0,
        y: 0,
        ...marker,
        fill: marker.fill || this._options.markerFill,
        stroke: marker.stroke || this._options.markerStroke,
        innerFill: marker.innerFill || this._options.markerInnerFill,
        strokeWidth: marker.strokeWidth || this._options.markerStrokeWidth,
      };

      if (marker.type === 'bullet') {
        output.node = this._getBullet(output);
        output.tooltipNode = output.node;

        output.animationNode = this._getBullet(output, true);
      } else {
        output.node = this._getPin(output);

        output.tooltipNode = SelectorEngine.findOne('path', output.node);
      }

      if (output.label) {
        output.tooltip = new mdb.Tooltip(output.tooltipNode, {
          title: output.label,
          container: this._element,
        });
      }

      return output;
    });

    this._markers.forEach((marker) => {
      if (marker.type === 'bullet') {
        this._svgMap.appendChild(marker.animationNode);
      }
      Manipulator.addClass(marker.node, CLASSNAME_MARKER);
      this._svgMap.appendChild(marker.node);
    });
  }

  _renderMap() {
    this._svgMap = SelectorEngine.findOne('svg', this._element);

    if (!this._svgMap) {
      this._svgMap = this._getSVGMap();
      this._element.appendChild(this._svgMap);
    }
  }

  _removeEventHandlers() {
    this._mapUnits.forEach((unit) => {
      EventHandler.off(unit.element, 'click');

      if (this.hoverEvents) {
        EventHandler.off(unit.element, 'mouseover');
        EventHandler.off(unit.element, 'mouseout');
      }
    });

    // Dragging
    EventHandler.off(this._svgMap, 'mousedown', this._mousedownHandler);
    EventHandler.off(window, 'mousemove', this._mousemoveHandler);
    EventHandler.off(window, 'mouseup', this._mouseupHandler);

    // Dragging - touch
    EventHandler.off(this._svgMap, 'touchstart', this._mousedownHandler);
    window.removeEventListener('touchmove', this._mousemoveHandler, { passive: false });
    EventHandler.off(window, 'touchend', this._mouseupHandler);

    // Zoom

    EventHandler.off(this._zoomInBtn, 'click');
    EventHandler.off(this._zoomOutBtn, 'click');

    if (this._options.zoomEvents) {
      EventHandler.off(this._element, 'wheel', this._wheelHandler);
      EventHandler.off(this._svgMap, 'pinch', this._pinchHandler);
    }

    this._markers.forEach((marker) => {
      EventHandler.off(marker.node, 'click');
    });
  }

  _removeMapElements() {
    this._element.removeChild(this._svgMap);
    this._element.removeChild(this._toolbar);
    if (this._tooltip) {
      this._element.removeChild(this._tooltip);
    }
  }

  _toggleZoomBtns() {
    const { zoomMin, zoomMax } = this._options;

    if (this._scale === zoomMin) {
      this._zoomOutBtn.setAttribute('disabled', true);
    } else {
      this._zoomOutBtn.removeAttribute('disabled');
    }

    if (this._scale === zoomMax) {
      this._zoomInBtn.setAttribute('disabled', true);
    } else {
      this._zoomInBtn.removeAttribute('disabled');
    }
  }

  _updateMapTransform() {
    this._svgMap.style.transform = `matrix(${this._scale}, 0, 0, ${this._scale}, ${this._x}, ${this._y})`;
  }

  _updateTransformOrigin() {
    this._svgMap.style.transformOrigin = `${this._origin.x}px ${this._origin.y}px`;
  }

  _updateMarkers() {
    this._markers.forEach((marker) => {
      if (marker.type === 'bullet') {
        this._updateBullet(marker);
      } else {
        this._updatePin(marker);
      }
    });
  }

  _updateMarkerTooltips() {
    this._markers.forEach((marker) => {
      if (marker.tooltip) {
        marker.tooltip.update();
      }
    });
  }

  _updatePin({ x, y, node, strokeWidth }) {
    const { height, radius, innerRadius } = this.pin;

    const path = SelectorEngine.findOne('path', node);
    const circle = SelectorEngine.findOne(SELECTOR_INNER_CIRCLE, node);
    const shadowCircle = SelectorEngine.findOne(SELECTOR_SHADOW_CIRCLE, node);
    const scaledStrokeWidth = strokeWidth / this._scale;

    setAttributes(path, {
      d: this._getPinPath({ height, radius, x, y }),
      strokeWidth: scaledStrokeWidth,
    });

    setAttributes(circle, {
      cy: y - (height + radius) / 2,
      r: innerRadius,
    });

    setAttributes(shadowCircle, {
      r: innerRadius / 2,
    });
  }

  _updateBullet({ node, animationNode, r }) {
    const scaledRadius = r / this._scale;
    const animateEl = SelectorEngine.findOne('animate', animationNode);

    setAttributes(animateEl, {
      values: `${scaledRadius};${scaledRadius * 5};${scaledRadius}`,
    });

    setAttributes(node, {
      r: scaledRadius,
    });

    setAttributes(animationNode, {
      r: scaledRadius,
    });
  }

  _zoom(factor) {
    const value = this._scale + factor;

    if (value <= this._options.zoomMin) {
      this._scale = this._options.zoomMin;

      this._origin = this._getValueInMapBoundry(getElementCenter(this.elementRect));

      this._updateTransformOrigin();

      this._updateMapTransform();

      this._setInitialMapPosition();
    } else if (this._options.zoomMax !== null && value >= this._options.zoomMax) {
      this._scale = this._options.zoomMax;
    } else {
      this._scale = value;
    }

    this._toggleZoomBtns();

    this._updateMapTransform();

    this._updateMarkers();

    this._updateMarkerTooltips();

    this._svgMap.style.strokeWidth = this._options.strokeWidth / this._scale;
  }

  // Static
  static get NAME() {
    return NAME;
  }

  static getInstance(element) {
    return Data.getData(element, DATA_KEY);
  }

  static jQueryInterface(config, param1) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose/.test(config)) {
        return;
      }

      if (!data) {
        data = new VectorMap(this, _config, param1);
      }

      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config](param1);
      }
    });
  }
}

// Auto init

SelectorEngine.find(SELECTOR_DATA_INIT).forEach((map) => {
  let instance = VectorMap.getInstance(map);

  if (!instance) {
    instance = new VectorMap(map);
  }

  return instance;
});

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = VectorMap.jQueryInterface;
    $.fn[NAME].Constructor = VectorMap;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return VectorMap.jQueryInterface;
    };
  }
});

export default VectorMap;
