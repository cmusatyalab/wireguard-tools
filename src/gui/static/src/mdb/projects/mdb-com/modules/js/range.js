import * as core from '../../core';
import Range from '../../../../js/free/range';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Range });

const compiled = { ...core.default, Range };
export default compiled;
