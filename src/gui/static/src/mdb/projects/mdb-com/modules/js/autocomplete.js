import * as core from '../../core';
import Autocomplete from '../../../../js/pro/autocomplete';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Autocomplete });

const compiled = { ...core.default, Autocomplete };
export default compiled;
