import * as core from '../../core';
import InfiniteScroll from '../../../../js/pro/infinite-scroll';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ InfiniteScroll });

const compiled = { ...core.default, InfiniteScroll };
export default compiled;
