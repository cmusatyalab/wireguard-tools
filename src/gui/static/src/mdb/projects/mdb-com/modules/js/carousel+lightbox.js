import * as core from '../../core';
import Carousel from '../../../../js/free/carousel';
import Lightbox from '../../../../js/pro/lightbox';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Carousel, Lightbox });

const compiled = { ...core.default, Carousel, Lightbox };
export default compiled;
