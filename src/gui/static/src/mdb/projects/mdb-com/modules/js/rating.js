import * as core from '../../core';
import Rating from '../../../../js/pro/rating';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Rating });

const compiled = { ...core.default, Rating };
export default compiled;
