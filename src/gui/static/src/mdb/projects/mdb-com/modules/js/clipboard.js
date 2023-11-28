import * as core from '../../core';
import Clipboard from '../../../../js/pro/clipboard';
import initMDB from '../../../../js/autoinit/index.pro';

initMDB({ Clipboard });

const compiled = { ...core.default, Clipboard };
export default compiled;
