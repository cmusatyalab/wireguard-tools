import * as core from '../../core';
import Ripple from '../../../../js/free/ripple';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Ripple });

const compiled = { ...core.default, Ripple };
export default compiled;
