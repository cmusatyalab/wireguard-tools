import * as core from '../../core';
import Touch from '../../../../js/pro/touch';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Touch });

const compiled = { ...core.default, Touch };
export default compiled;
