import * as core from '../../core';
import ChipsInput from '../../../../js/pro/chips';
import Chip from '../../../../js/pro/chips/chip.js';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Chip, ChipsInput });

const compiled = { ...core.default, ChipsInput, Chip };
export default compiled;
