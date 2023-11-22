import * as core from '../../core';
import Rating from '../../../../js/pro/rating';
import Lightbox from '../../../../js/pro/lightbox';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Lightbox, Rating });

const compiled = { ...core.default, Rating, Lightbox };
export default compiled;
