import * as core from '../../core';
import Datatable from '../../../../js/pro/datatable';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Datatable });

const compiled = { ...core.default, Datatable };
export default compiled;
