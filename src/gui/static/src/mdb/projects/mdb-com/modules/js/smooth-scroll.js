import * as core from '../../core';
import SmoothScroll from '../../../../js/pro/smooth-scroll';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ SmoothScroll });

const compiled = { ...core.default, SmoothScroll };
export default compiled;
