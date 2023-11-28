import * as core from '../../core';
import Chart from '../../../../js/pro/charts/charts.js';
import Datatable from '../../../../js/pro/datatable';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Chart, Datatable });

const compiled = { ...core.default, Chart, Datatable };
export default compiled;
