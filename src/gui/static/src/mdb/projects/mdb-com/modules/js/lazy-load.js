import * as core from '../../core';
import LazyLoad from '../../../../js/pro/lazy-load';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ LazyLoad });

const compiled = { ...core.default, LazyLoad };
export default compiled;
