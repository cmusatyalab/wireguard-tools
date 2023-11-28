import * as core from '../../core';
import Navbar from '../../../../js/pro/navbar';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Navbar });

const compiled = { ...core.default, Navbar };
export default compiled;
