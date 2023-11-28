import * as core from '../../core';
import Stepper from '../../../../js/pro/stepper';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Stepper });

const compiled = { ...core.default, Stepper };
export default compiled;
