import * as core from '../../core';
import Lightbox from '../../../../js/pro/lightbox';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Lightbox });

const compiled = { ...core.default, Lightbox };
export default compiled;
