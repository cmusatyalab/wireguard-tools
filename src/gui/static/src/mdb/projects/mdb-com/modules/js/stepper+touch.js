import * as core from '../../core';
import Touch from '../../../../js/pro/touch';
import Stepper from '../../../../js/pro/stepper';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Stepper, Touch });

const compiled = { ...core.default, Touch, Stepper };
export default compiled;
