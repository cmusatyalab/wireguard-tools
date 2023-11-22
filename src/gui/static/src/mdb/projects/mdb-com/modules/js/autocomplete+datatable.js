import * as core from '../../core';
import Autocomplete from '../../../../js/pro/autocomplete';
import Datatable from '../../../../js/pro/datatable';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Autocomplete, Datatable });

const compiled = { ...core.default, Autocomplete, Datatable };
export default compiled;
