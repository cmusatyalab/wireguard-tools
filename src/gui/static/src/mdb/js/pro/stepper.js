import Data from '../mdb/dom/data';
import EventHandler from '../mdb/dom/event-handler';
import SelectorEngine from '../mdb/dom/selector-engine';
import Manipulator from '../mdb/dom/manipulator';
import { typeCheckConfig, isRTL } from '../mdb/util/index';
import {
  LEFT_ARROW,
  RIGHT_ARROW,
  UP_ARROW,
  DOWN_ARROW,
  HOME,
  END,
  ENTER,
  SPACE,
  TAB,
} from '../mdb/util/keycodes';
import BaseComponent from '../free/base-component';
import { bindCallbackEventsIfNeeded } from '../autoinit/init';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'stepper';
const DATA_KEY = 'mdb.stepper';
const EVENT_KEY = `.${DATA_KEY}`;

const STEPPER_HORIZONTAL = 'horizontal';
const STEPPER_VERTICAL = 'vertical';
const STEPPER_MOBILE = 'mobile';

const DefaultType = {
  stepperType: 'string',
  stepperLinear: 'boolean',
  stepperNoEditable: 'boolean',
  stepperActive: 'string',
  stepperCompleted: 'string',
  stepperInvalid: 'string',
  stepperDisabled: 'string',
  stepperVerticalBreakpoint: 'number',
  stepperMobileBreakpoint: 'number',
  stepperMobileBarBreakpoint: 'number',
  animations: 'boolean',
  stepperHeadClick: 'boolean',
  stepperMobileNextBtn: 'string',
  stepperMobileBackBtn: 'string',
  stepperMobileStepTxt: 'string',
  stepperMobileOfTxt: 'string',
};

const Default = {
  stepperType: STEPPER_HORIZONTAL,
  stepperLinear: false,
  stepperNoEditable: false,
  stepperActive: '',
  stepperCompleted: '',
  stepperInvalid: '',
  stepperDisabled: '',
  stepperVerticalBreakpoint: 0,
  stepperMobileBreakpoint: 0,
  stepperMobileBarBreakpoint: 4,
  animations: true,
  stepperHeadClick: true,
  stepperMobileNextBtn: 'NEXT',
  stepperMobileBackBtn: 'BACK',
  stepperMobileStepTxt: 'step',
  stepperMobileOfTxt: 'of',
};

const EVENT_MOUSEDOWN = `mousedown${EVENT_KEY}`;
const EVENT_SUBMIT = `submit${EVENT_KEY}`;
const EVENT_KEYDOWN = `keydown${EVENT_KEY}`;
const EVENT_KEYUP = `keyup${EVENT_KEY}`;
const EVENT_RESIZE = `resize${EVENT_KEY}`;
const EVENT_CLICK = `click${EVENT_KEY}`;
const EVENT_ANIMATIONEND = 'animationend';
const EVENT_CHANGE_STEP = `stepChange${EVENT_KEY}`;
const EVENT_CHANGED_STEP = `stepChanged${EVENT_KEY}`;
const EVENT_INVALID = `stepInvalid${EVENT_KEY}`;
const EVENT_VALID = `stepValid${EVENT_KEY}`;

const STEP_CLASS = `${NAME}-step`;
const HEAD_CLASS = `${NAME}-head`;
const HEAD_TEXT_CLASS = `${NAME}-head-text`;
const CONTENT_CLASS = `${NAME}-content`;
const ACTIVE_CLASS = `${NAME}-active`;
const COMPLETED_CLASS = `${NAME}-completed`;
const INVALID_CLASS = `${NAME}-invalid`;
const DISABLED_CLASS = `${NAME}-disabled`;
const VERTICAL_CLASS = `${NAME}-${STEPPER_VERTICAL}`;
const CONTENT_HIDE_CLASS = `${NAME}-content-hide`;
const HORIZONTAL_CLASS = `${NAME}-${STEPPER_HORIZONTAL}`;
const MOBILE_CLASS = `${NAME}-${STEPPER_MOBILE}`;
const MOBILE_HEAD_CLASS = `${NAME}-${STEPPER_MOBILE}-head`;
const MOBILE_FOOTER_CLASS = `${NAME}-${STEPPER_MOBILE}-footer`;
const MOBILE_PROGRESS_BAR_CLASS = `${NAME}-${STEPPER_MOBILE}-progress-bar`;
const MOBILE_PROGRESS_CLASS = `${NAME}-${STEPPER_MOBILE}-progress`;
const NEXT_BTN_CLASS = `${NAME}-next-btn`;
const BACK_BTN_CLASS = `${NAME}-back-btn`;

const MOBILE_ACTIVE_STEP_ID = `${NAME}-active-step`;
const MOBILE_NUMBER_OF_STEPS_ID = `${NAME}-all-steps`;

const MOBILE_BUTTON_NEXT = (options) => {
  return `
  <div class="${NEXT_BTN_CLASS}">
    <button type="button" class="btn btn-link">
      ${options.stepperMobileNextBtn}
      <i class="fas fa-chevron-right"></i>
    </button>
  </div>
`;
};
const MOBILE_BUTTON_BACK = (options) => {
  return `
  <div class="${BACK_BTN_CLASS}">
    <button type="button" class="btn btn-link">
      <i class="fas fa-chevron-left"></i>
      ${options.stepperMobileBackBtn}
    </button>
  </div>
`;
};
const MOBILE_STEPPER_HEAD = (options) => {
  return `
  <div class ="${MOBILE_HEAD_CLASS}">
    ${options.stepperMobileStepTxt} <span id="${MOBILE_ACTIVE_STEP_ID}"></span> ${options.stepperMobileOfTxt} <span id="${MOBILE_NUMBER_OF_STEPS_ID}"></span>
  </div>
`;
};
const MOBILE_PROGRESS_BAR = `
  <div class="${MOBILE_PROGRESS_CLASS} gray-500">
    <div class="${MOBILE_PROGRESS_BAR_CLASS}"></div>
  </div>
`;
const MOBILE_FOOTER = `
  <div class="${MOBILE_FOOTER_CLASS}"></div>
`;

class Stepper extends BaseComponent {
  constructor(element, options) {
    super(element);

    this._options = this._getConfig(options);
    this._elementHeight = 0;
    this._steps = SelectorEngine.find(`.${STEP_CLASS}`, this._element);
    this._currentView = '';
    this._activeStepIndex = 0;
    this._verticalStepperStyles = [];
    this._animations =
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches && this._options.animations;

    if (this._element) {
      this._init();
      Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
      bindCallbackEventsIfNeeded(this.constructor);
    }
  }

  // Getters
  static get NAME() {
    return NAME;
  }

  get activeStep() {
    return this._steps[this._activeStepIndex];
  }

  get activeStepIndex() {
    return this._activeStepIndex;
  }

  // Public

  dispose() {
    this._steps.forEach((el) => {
      EventHandler.off(el, EVENT_MOUSEDOWN);
      EventHandler.off(el, EVENT_KEYDOWN);
    });

    EventHandler.off(window, EVENT_RESIZE);

    this._unbindMouseDown();
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    super.dispose();
  }

  changeStep(index) {
    this._toggleStep(index);
  }

  nextStep() {
    this._toggleStep(this._activeStepIndex + 1);
  }

  prevStep() {
    this._toggleStep(this._activeStepIndex - 1);
  }

  resizeStepper() {
    if (this._currentView === STEPPER_VERTICAL) {
      this._setSingleStepHeight(this.activeStep);
    }

    if (this._currentView === STEPPER_HORIZONTAL) {
      this._setHeight(this.activeStep);
    }

    if (this._options.stepperVerticalBreakpoint || this._options.stepperMobileBreakpoint) {
      this._toggleStepperView();
    }
  }

  // Private
  _init() {
    const activeStep = SelectorEngine.findOne(`.${ACTIVE_CLASS}`, this._element);

    if (activeStep) {
      this._activeStepIndex = this._steps.indexOf(activeStep);
      this._toggleStepClass(this._activeStepIndex, 'add', this._options.stepperActive);
    } else {
      this._toggleStepClass(this._activeStepIndex, 'add', ACTIVE_CLASS);
      this._toggleStepClass(this._activeStepIndex, 'add', this._options.stepperActive);
    }

    this._setOptional();
    if (this._options.stepperHeadClick) {
      this._bindMouseDown();
    }
    this._bindKeysNavigation();

    switch (this._options.stepperType) {
      case STEPPER_VERTICAL:
        this._toggleVertical();
        break;
      case STEPPER_MOBILE:
        this._toggleMobile();
        break;
      default:
        this._toggleHorizontal();
        break;
    }

    if (this._options.stepperVerticalBreakpoint || this._options.stepperMobileBreakpoint) {
      this._toggleStepperView();
    }

    if (this._options.stepperLinear) {
      this._setValidation();
    }

    this._bindResize();
  }

  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._element);

    config = {
      ...Default,
      ...dataAttributes,
      ...config,
    };

    typeCheckConfig(NAME, config, DefaultType);

    return config;
  }

  _bindMouseDown() {
    this._steps.forEach((el) => {
      const stepHead = SelectorEngine.findOne(`.${HEAD_CLASS}`, el);

      EventHandler.on(stepHead, EVENT_MOUSEDOWN, (e) => {
        const step = SelectorEngine.parents(e.target, `.${STEP_CLASS}`)[0];
        const stepIndex = this._steps.indexOf(step);

        e.preventDefault();
        this._toggleStep(stepIndex);
      });
    });
  }

  _unbindMouseDown() {
    this._steps.forEach((el) => {
      const stepHead = SelectorEngine.findOne(`.${HEAD_CLASS}`, el);

      EventHandler.off(stepHead, EVENT_MOUSEDOWN);
    });
  }

  _bindResize() {
    EventHandler.on(window, EVENT_RESIZE, () => {
      this.resizeStepper();
    });
  }

  _toggleStepperView() {
    const shouldBeHorizontal = this._options.stepperVerticalBreakpoint < window.innerWidth;
    const shouldBeVertical = this._options.stepperVerticalBreakpoint > window.innerWidth;
    const shouldBeMobile = this._options.stepperMobileBreakpoint > window.innerWidth;

    if (shouldBeHorizontal && this._currentView !== STEPPER_HORIZONTAL) {
      this._toggleHorizontal();
    }

    if (shouldBeVertical && !shouldBeMobile && this._currentView !== STEPPER_VERTICAL) {
      this._steps.forEach((el) => {
        const stepContent = SelectorEngine.findOne(`.${CONTENT_CLASS}`, el);

        this._resetStepperHeight();
        this._showElement(stepContent);
      });

      this._toggleVertical();
    }

    if (shouldBeMobile && this._currentView !== STEPPER_MOBILE) {
      this._toggleMobile();
    }
  }

  _toggleStep(index) {
    const numberOfSteps = this._steps.length;

    const isValid = this._validateStep(index);

    const activeStepIndex = this._activeStepIndex;

    if (!isValid) {
      return;
    }

    if (this._options.stepperLinear) {
      EventHandler.trigger(this.activeStep, EVENT_VALID, {
        currentStep: this._activeStepIndex,
        nextStep: index,
      });
    }

    if (this._options.stepperNoEditable) {
      this._toggleDisabled();
    }

    this._showElement(SelectorEngine.findOne(`.${CONTENT_CLASS}`, this._steps[index]));
    this._toggleActive(index);

    if (!this._options.stepperLinear || index > this._activeStepIndex) {
      this._toggleCompleted(this._activeStepIndex);
    }

    if (this._currentView === STEPPER_HORIZONTAL || this._currentView === STEPPER_MOBILE) {
      this._animateHorizontalStep(index);
    } else {
      this._animateVerticalStep(index);
      this._setSingleStepHeight(this._steps[index]);
    }

    this._toggleStepTabIndex(
      SelectorEngine.findOne(`.${HEAD_CLASS}`, this.activeStep),
      SelectorEngine.findOne(`.${HEAD_CLASS}`, this._steps[index])
    );

    this._activeStepIndex = index;

    if (this._currentView === STEPPER_MOBILE) {
      const activeStepElement = SelectorEngine.findOne(`#${MOBILE_ACTIVE_STEP_ID}`, this._element);

      activeStepElement.textContent = this._activeStepIndex + 1;

      if (numberOfSteps > this._options.stepperMobileBarBreakpoint) {
        this._updateProgressBar();
      }
    }

    const inputs = this.activeStep.querySelectorAll('.form-outline');
    const inputNotches = SelectorEngine.find('.form-notch', inputs[0]);
    if (inputs.length && inputNotches.length < 1) {
      inputs.forEach((formOutline) => {
        new mdb.Input(formOutline).init();
      });
    }

    EventHandler.trigger(this.activeStep, EVENT_CHANGED_STEP, {
      currentStep: this._activeStepIndex,
      prevStep: activeStepIndex,
    });
  }

  _resetStepperHeight() {
    this._element.style.height = '';
  }

  _setStepsHeight() {
    this._steps.forEach((el) => {
      const stepContent = SelectorEngine.findOne(`.${CONTENT_CLASS}`, el);
      const stepComputed = window.getComputedStyle(stepContent);
      this._verticalStepperStyles.push({
        paddingTop: parseFloat(stepComputed.paddingTop),
        paddingBottom: parseFloat(stepComputed.paddingBottom),
      });
      const stepHeight = stepContent.scrollHeight;
      stepContent.style.height = `${stepHeight}px`;
    });
  }

  _setSingleStepHeight(step) {
    const stepContent = SelectorEngine.findOne(`.${CONTENT_CLASS}`, step);
    const isActiveStep = this.activeStep === step;
    const stepIndex = this._steps.indexOf(step);
    let stepContentHeight;

    if (!isActiveStep) {
      stepContentHeight =
        stepContent.scrollHeight +
        this._verticalStepperStyles[stepIndex].paddingTop +
        this._verticalStepperStyles[stepIndex].paddingBottom;
    } else {
      stepContent.style.height = '';
      stepContentHeight = stepContent.scrollHeight;
    }

    stepContent.style.height = `${stepContentHeight}px`;
  }

  _createMobileElements() {
    this._element.insertAdjacentHTML('beforeend', MOBILE_FOOTER);

    const footer = SelectorEngine.findOne(`.${MOBILE_FOOTER_CLASS}`, this._element);

    if (this._steps.length > this._options.stepperMobileBarBreakpoint) {
      this._element.classList.add('stepper-progress-bar');

      footer.insertAdjacentHTML('afterbegin', MOBILE_PROGRESS_BAR);

      this._updateProgressBar();
    }

    footer.insertAdjacentHTML('afterbegin', MOBILE_BUTTON_BACK(this._options));
    footer.insertAdjacentHTML('beforeend', MOBILE_BUTTON_NEXT(this._options));

    this._element.insertAdjacentHTML('afterbegin', MOBILE_STEPPER_HEAD(this._options));

    const allStepsElement = SelectorEngine.findOne(`#${MOBILE_NUMBER_OF_STEPS_ID}`, this._element);
    allStepsElement.textContent = this._steps.length;

    const ActiveStepsElement = SelectorEngine.findOne(`#${MOBILE_ACTIVE_STEP_ID}`, this._element);
    ActiveStepsElement.textContent = this._activeStepIndex + 1;
  }

  _toggleMobile() {
    this._currentView = STEPPER_MOBILE;

    this._toggleStepperClass(MOBILE_CLASS);
    this._createMobileElements();
    this._bindMobileButtons();
    this._setHeight(this.activeStep);
    this._hideInactiveSteps();
  }

  _toggleVertical() {
    if (this._currentView === STEPPER_MOBILE) {
      this._deleteMobileElements();
      this._unbindMobileButtons();
    }

    this._currentView = STEPPER_VERTICAL;

    this._toggleStepperClass(VERTICAL_CLASS);
    this._setStepsHeight();
    this._hideInactiveSteps();
  }

  _toggleHorizontal() {
    if (this._currentView === STEPPER_MOBILE) {
      this._deleteMobileElements();
      this._unbindMobileButtons();
    }

    this._currentView = STEPPER_HORIZONTAL;

    this._toggleStepperClass(HORIZONTAL_CLASS);
    this._setHeight(this.activeStep);
    this._hideInactiveSteps();
  }

  _toggleStepperClass(className) {
    this._element.classList.remove(HORIZONTAL_CLASS, MOBILE_CLASS, VERTICAL_CLASS);
    this._element.classList.add(className);

    if (className !== VERTICAL_CLASS) {
      this._steps.forEach((el) => {
        SelectorEngine.findOne(`.${CONTENT_CLASS}`, el).classList.remove(CONTENT_HIDE_CLASS);
      });
    }
  }

  _toggleStepClass(index, action, className) {
    // condition to prevent errors if the user has not set any custom classes like active, disabled etc.
    if (className) {
      this._steps[index].classList[action](className);
    }
  }

  _deleteMobileElements() {
    const footer = SelectorEngine.findOne(`.${MOBILE_FOOTER_CLASS}`, this._element);
    const head = SelectorEngine.findOne(`.${MOBILE_HEAD_CLASS}`, this._element);

    footer.remove();
    head.remove();
  }

  _bindKeysNavigation() {
    this._toggleStepTabIndex(false, SelectorEngine.findOne(`.${HEAD_CLASS}`, this.activeStep));

    this._steps.forEach((el) => {
      const stepHead = SelectorEngine.findOne(`.${HEAD_CLASS}`, el);

      EventHandler.on(stepHead, EVENT_KEYDOWN, (e) => {
        const focusedStep = SelectorEngine.parents(e.currentTarget, `.${STEP_CLASS}`)[0];
        const nextStep = SelectorEngine.next(focusedStep, `.${STEP_CLASS}`)[0];
        const prevStep = SelectorEngine.prev(focusedStep, `.${STEP_CLASS}`)[0];
        const focusedStepHead = SelectorEngine.findOne(`.${HEAD_CLASS}`, focusedStep);
        const activeStepHead = SelectorEngine.findOne(`.${HEAD_CLASS}`, this.activeStep);
        let nextStepHead = null;
        let prevStepHead = null;

        if (nextStep) {
          nextStepHead = SelectorEngine.findOne(`.${HEAD_CLASS}`, nextStep);
        }

        if (prevStep) {
          prevStepHead = SelectorEngine.findOne(`.${HEAD_CLASS}`, prevStep);
        }

        if (e.keyCode === LEFT_ARROW && this._currentView !== STEPPER_VERTICAL) {
          if (!isRTL && prevStepHead) {
            this._toggleStepTabIndex(focusedStepHead, prevStepHead);
            this._toggleOutlineStyles(focusedStepHead, prevStepHead);

            prevStepHead.focus();
          } else if (isRTL && nextStepHead) {
            this._toggleStepTabIndex(focusedStepHead, nextStepHead);
            this._toggleOutlineStyles(focusedStepHead, nextStepHead);

            nextStepHead.focus();
          }
        }

        if (e.keyCode === RIGHT_ARROW && this._currentView !== STEPPER_VERTICAL) {
          if (!isRTL && nextStepHead) {
            this._toggleStepTabIndex(focusedStepHead, nextStepHead);
            this._toggleOutlineStyles(focusedStepHead, nextStepHead);

            nextStepHead.focus();
          } else if (isRTL && prevStepHead) {
            this._toggleStepTabIndex(focusedStepHead, prevStepHead);
            this._toggleOutlineStyles(focusedStepHead, prevStepHead);

            prevStepHead.focus();
          }
        }

        if (e.keyCode === DOWN_ARROW && this._currentView === STEPPER_VERTICAL) {
          e.preventDefault();

          if (nextStepHead) {
            this._toggleStepTabIndex(focusedStepHead, nextStepHead);
            this._toggleOutlineStyles(focusedStepHead, nextStepHead);

            nextStepHead.focus();
          }
        }

        if (e.keyCode === UP_ARROW && this._currentView === STEPPER_VERTICAL) {
          e.preventDefault();

          if (prevStepHead) {
            this._toggleStepTabIndex(focusedStepHead, prevStepHead);
            this._toggleOutlineStyles(focusedStepHead, prevStepHead);

            prevStepHead.focus();
          }
        }

        if (e.keyCode === HOME) {
          const firstStepHead = SelectorEngine.findOne(`.${HEAD_CLASS}`, this._steps[0]);

          this._toggleStepTabIndex(focusedStepHead, firstStepHead);
          this._toggleOutlineStyles(focusedStepHead, firstStepHead);

          firstStepHead.focus();
        }

        if (e.keyCode === END) {
          const lastStep = this._steps[this._steps.length - 1];
          const lastStepHead = SelectorEngine.findOne(`.${HEAD_CLASS}`, lastStep);
          this._toggleStepTabIndex(focusedStepHead, lastStepHead);
          this._toggleOutlineStyles(focusedStepHead, lastStepHead);

          lastStepHead.focus();
        }

        if (e.keyCode === ENTER || e.keyCode === SPACE) {
          e.preventDefault();

          this.changeStep(this._steps.indexOf(focusedStep));
        }

        if (e.keyCode === TAB) {
          this._toggleStepTabIndex(focusedStepHead, activeStepHead);
          this._toggleOutlineStyles(focusedStepHead, false);

          activeStepHead.focus();
        }
      });

      EventHandler.on(stepHead, EVENT_KEYUP, (e) => {
        const focusedStep = SelectorEngine.parents(e.currentTarget, `.${STEP_CLASS}`)[0];
        const focusedStepHead = SelectorEngine.findOne(`.${HEAD_CLASS}`, focusedStep);
        const activeStepHead = SelectorEngine.findOne(`.${HEAD_CLASS}`, this.activeStep);

        if (e.keyCode === TAB) {
          this._toggleStepTabIndex(focusedStepHead, activeStepHead);
          this._toggleOutlineStyles(false, activeStepHead);

          activeStepHead.focus();
        }
      });
    });
  }

  _bindMobileButtons() {
    const btnBack = SelectorEngine.findOne(`.${BACK_BTN_CLASS}`, this._element);
    const btnNext = SelectorEngine.findOne(`.${NEXT_BTN_CLASS}`, this._element);

    EventHandler.on(btnBack, EVENT_CLICK, () => this.prevStep());
    EventHandler.on(btnNext, EVENT_CLICK, () => this.nextStep());
  }

  _unbindMobileButtons() {
    const btnBack = SelectorEngine.findOne(`.${BACK_BTN_CLASS}`, this._element);
    const btnNext = SelectorEngine.findOne(`.${NEXT_BTN_CLASS}`, this._element);

    EventHandler.off(btnBack, EVENT_CLICK, () => this.prevStep());
    EventHandler.off(btnNext, EVENT_CLICK, () => this.nextStep());
  }

  _toggleStepTabIndex(focusedElement, newTarget) {
    if (focusedElement) {
      focusedElement.setAttribute('tabIndex', -1);
    }

    if (newTarget) {
      newTarget.setAttribute('tabIndex', 0);
    }
  }

  _validateActiveStepRequiredElements() {
    const isValid = SelectorEngine.find('[required]', this.activeStep).every((el) => {
      return el.checkValidity() === true;
    });

    return isValid;
  }

  _validateStep(index) {
    const numberOfSteps = this._steps.length;
    let result = true;

    // prevent any actions if the same step is chosen
    if (index === this._activeStepIndex) {
      result = false;
    }

    // prevent toggleSteps if next/prev step don't exist
    if (index >= numberOfSteps || index < 0) {
      result = false;
    }

    const changeStepEvent = EventHandler.trigger(this.activeStep, EVENT_CHANGE_STEP, {
      currentStep: this._activeStepIndex,
      nextStep: index,
    });

    if (this._options.stepperLinear) {
      // prevent toggleStep if one of the steps is skipped
      const stepsToCheck = index - this.activeStepIndex - 1;
      if (index > this._activeStepIndex + 1) {
        let nextStepToValidate = SelectorEngine.next(this.activeStep, 'li')[0];

        for (let i = 0; i < stepsToCheck; i++) {
          if (!nextStepToValidate.classList.contains('stepper-completed')) {
            nextStepToValidate.classList.add('stepper-invalid');
            result = false;
          }
          nextStepToValidate = SelectorEngine.next(nextStepToValidate, 'li')[0];
        }
      }

      if (index < this._activeStepIndex) {
        if (!this._validateActiveStepRequiredElements()) {
          this.activeStep.classList.remove('stepper-completed');
        }
      }

      if (index > this._activeStepIndex || index === numberOfSteps - 1) {
        this.activeStep.classList.add('was-validated');

        if (!this._validateActiveStepRequiredElements()) {
          this._toggleInvalid(this._activeStepIndex);
          EventHandler.trigger(this.activeStep, EVENT_INVALID, {
            currentStep: this._activeStepIndex,
            nextStep: index,
          });
          // wait for other elements transition end
          // the input transition takes 200ms. + 10ms is added, because without it it would not expand to the correct height

          if (this._currentView !== STEPPER_VERTICAL) {
            setTimeout(() => {
              this._setHeight(this.activeStep);
            }, 210);
          } else {
            setTimeout(() => {
              this._setSingleStepHeight(this.activeStep);
            }, 210);
          }

          result = false;
        }
      }
    }

    if (index > this._activeStepIndex && changeStepEvent.defaultPrevented) {
      result = false;
    }

    if (this._options.stepperNoEditable) {
      if (this._steps[index].classList.contains(DISABLED_CLASS)) {
        result = false;
      }
    }

    return result;
  }

  _updateProgressBar() {
    const numberOfSteps = this._steps.length;
    const progressBar = SelectorEngine.findOne(`.${MOBILE_PROGRESS_BAR_CLASS}`, this._element);

    progressBar.style.width = `${((this._activeStepIndex + 1) / numberOfSteps) * 100}%`;
  }

  _toggleOutlineStyles(focusedElement, newTarget) {
    if (focusedElement) {
      focusedElement.style.outline = '';
    }

    if (newTarget) {
      newTarget.style.outline = 'revert';
    }
  }

  _toggleDisabled() {
    this._toggleStepClass(this._activeStepIndex, 'add', DISABLED_CLASS);
    this._toggleStepClass(this._activeStepIndex, 'add', this._options.stepperDisabled);
  }

  _toggleActive(index) {
    this._toggleStepClass(index, 'add', ACTIVE_CLASS);
    this._toggleStepClass(this._activeStepIndex, 'remove', ACTIVE_CLASS);
    this._toggleStepClass(index, 'add', this._options.stepperActive);
    this._toggleStepClass(this._activeStepIndex, 'remove', this._options.stepperActive);
  }

  _toggleCompleted(index) {
    this._toggleStepClass(index, 'add', COMPLETED_CLASS);
    this._toggleStepClass(index, 'remove', INVALID_CLASS);
    this._toggleStepClass(index, 'add', this._options.stepperCompleted);
    this._toggleStepClass(index, 'remove', this._options.stepperInvalid);
  }

  _toggleInvalid(index) {
    this._toggleStepClass(index, 'add', INVALID_CLASS);
    this._toggleStepClass(index, 'remove', COMPLETED_CLASS);
    this._toggleStepClass(index, 'add', this._options.stepperInvalid);
    this._toggleStepClass(index, 'remove', this._options.stepperCompleted);
  }

  _setOptional() {
    this._steps.forEach((el) => {
      const isOptional = Manipulator.getDataAttribute(el, 'stepper-optional');

      if (isOptional) {
        const stepHeadText = SelectorEngine.findOne(`.${HEAD_TEXT_CLASS}`, el);
        stepHeadText.setAttribute('data-mdb-content', 'Optional');
      }
    });
  }

  _hideInactiveSteps() {
    this._steps.forEach((el) => {
      if (!el.classList.contains(ACTIVE_CLASS)) {
        this._hideElement(SelectorEngine.findOne(`.${CONTENT_CLASS}`, el));
      }
    });
  }

  _setValidation() {
    const form = SelectorEngine.findOne('.needs-validation.stepper-form', this._element);

    EventHandler.on(
      form,
      EVENT_SUBMIT,
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        this._steps.forEach((el, i) => {
          const isValid = this._validateStep(i);

          if (!isValid) {
            this._toggleInvalid(i);
            EventHandler.trigger(this.activeStep, EVENT_INVALID);
          }
        });
      },
      false
    );
  }

  _setHeight(stepElement) {
    const stepContent = SelectorEngine.findOne(`.${CONTENT_CLASS}`, stepElement);
    const stepFooter = SelectorEngine.findOne(`.${MOBILE_FOOTER_CLASS}`, this._element);
    const contentStyle = getComputedStyle(stepContent);
    const footerStyle = stepFooter ? getComputedStyle(stepFooter) : '';
    let stepHead;

    if (this._currentView === STEPPER_MOBILE) {
      stepHead = SelectorEngine.findOne(`.${MOBILE_HEAD_CLASS}`, this._element);
    } else {
      stepHead = SelectorEngine.findOne(`.${HEAD_CLASS}`, stepElement);
    }

    const headStyle = getComputedStyle(stepHead);
    const stepContentHeight =
      stepContent.offsetHeight +
      parseFloat(contentStyle.marginTop) +
      parseFloat(contentStyle.marginBottom);

    const stepHeadHeight =
      stepHead.offsetHeight + parseFloat(headStyle.marginTop) + parseFloat(headStyle.marginBottom);

    const stepFooterHeight = footerStyle
      ? stepFooter.offsetHeight +
        parseFloat(footerStyle.marginTop) +
        parseFloat(footerStyle.marginBottom)
      : 0;

    this._element.style.height = `${stepHeadHeight + stepContentHeight + stepFooterHeight}px`;
  }

  _hideElement(stepContent) {
    const isActive = SelectorEngine.parents(stepContent, `.${STEP_CLASS}`)[0].classList.contains(
      ACTIVE_CLASS
    );

    // prevent hiding during a quick step change
    if (!isActive && this._currentView !== STEPPER_VERTICAL) {
      stepContent.style.display = 'none';
    } else {
      stepContent.classList.add(CONTENT_HIDE_CLASS);
    }
  }

  _showElement(stepContent) {
    if (this._currentView === STEPPER_VERTICAL) {
      stepContent.classList.remove(CONTENT_HIDE_CLASS);
    } else {
      stepContent.style.display = 'block';
    }
  }

  _animateHorizontalStep(index) {
    if (!this._animations) {
      this._steps.forEach((el, i) => {
        const stepContent = SelectorEngine.findOne(`.${CONTENT_CLASS}`, el);

        if (i !== index) {
          this._hideElement(stepContent);
        }
      });

      this._setHeight(this._steps[index]);

      return;
    }

    const isForward = index > this._activeStepIndex;
    const nextStepContent = SelectorEngine.findOne(`.${CONTENT_CLASS}`, this._steps[index]);
    const activeStepContent = SelectorEngine.findOne(`.${CONTENT_CLASS}`, this.activeStep);

    let nextStepAnimation;
    let activeStepAnimation;

    this._steps.forEach((el, i) => {
      const stepContent = SelectorEngine.findOne(`.${CONTENT_CLASS}`, el);

      this._clearStepAnimation(stepContent);

      if (i !== index && i !== this._activeStepIndex) {
        this._hideElement(stepContent);
      }
    });

    if (isForward) {
      activeStepAnimation = 'slide-out-left';
      nextStepAnimation = 'slide-in-right';
    } else {
      activeStepAnimation = 'slide-out-right';
      nextStepAnimation = 'slide-in-left';
    }

    if (this._animations) {
      activeStepContent.classList.add(activeStepAnimation, 'animation', 'fast');
      nextStepContent.classList.add(nextStepAnimation, 'animation', 'fast');
    }

    this._setHeight(this._steps[index]);

    EventHandler.one(activeStepContent, EVENT_ANIMATIONEND, (e) => {
      this._clearStepAnimation(e.target);
      this._hideElement(e.target);
    });

    EventHandler.one(nextStepContent, EVENT_ANIMATIONEND, (e) => {
      this._clearStepAnimation(e.target);
    });
  }

  _animateVerticalStep(index) {
    const nextStepContent = SelectorEngine.findOne(`.${CONTENT_CLASS}`, this._steps[index]);
    const activeStepContent = SelectorEngine.findOne(`.${CONTENT_CLASS}`, this.activeStep);

    this._hideElement(activeStepContent);
    this._showElement(nextStepContent);
  }

  _clearStepAnimation(element) {
    element.classList.remove(
      'slide-out-left',
      'slide-in-right',
      'slide-out-right',
      'slide-in-left',
      'animation',
      'fast'
    );
  }

  // Static
  static jQueryInterface(config, options) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose|hide/.test(config)) {
        return;
      }

      if (!data) {
        data = new Stepper(this, _config);
      }

      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config](options);
      }
    });
  }
}

export default Stepper;
