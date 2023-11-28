import * as core from '../../core';
import Datepicker from '../../../../js/pro/datepicker';
import Timepicker from '../../../../js/pro/timepicker';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Datepicker, Timepicker });

const compiled = { ...core.default, Datepicker, Timepicker };
export default compiled;
