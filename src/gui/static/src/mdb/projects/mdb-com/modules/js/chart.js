import * as core from '../../core';
import Chart from '../../../../js/pro/charts/charts.js';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Chart });

const compiled = { ...core.default, Chart };
export default compiled;
