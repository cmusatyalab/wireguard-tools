import EventHandler from '../mdb/dom/event-handler';
import Manipulator from '../mdb/dom/manipulator';
import BaseComponent from '../free/base-component';
import { bindCallbackEventsIfNeeded } from '../autoinit/init';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'navbar';

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Navbar extends BaseComponent {
  // Getters
  static get NAME() {
    return NAME;
  }

  // Public
  init() {
    this._onScroll();
    this._addEvent();
    Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
    bindCallbackEventsIfNeeded(this.constructor);
  }

  dispose() {
    this._removeEvent();
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    super.dispose();
  }

  // Private
  _addEvent() {
    EventHandler.on(window, 'scroll', () => this._onScroll());
  }

  _removeEvent() {
    EventHandler.off(window, 'scroll');
  }

  _onScroll() {
    if (window.scrollY > 0) {
      Manipulator.addClass(this._element, 'navbar-scrolled');
    } else {
      Manipulator.removeClass(this._element, 'navbar-scrolled');
    }
  }
}

export default Navbar;
