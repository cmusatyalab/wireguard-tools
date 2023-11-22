import * as core from '../../core';
import Loading from '../../../../js/pro/loading-management';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Loading });

const compiled = { ...core.default, Loading };
export default compiled;
