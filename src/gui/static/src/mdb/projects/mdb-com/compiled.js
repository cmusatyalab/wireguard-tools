// CUSTOM JS
import './js/clipboard';
import './js/new-prism';
import './js/for-thieves';

// MDB JS
import * as mdbPro from '../../js/mdb.pro.umd.js';
const { initMDB } = mdbPro;

const compiled = { ...mdbPro };
initMDB(compiled);

export default compiled;
