// CUSTOM JS
import './js/clipboard';
import './js/new-prism';
import './js/for-thieves';

// BOOTSTRAP CORE COMPONENTS
import Button from '../../js/free/button';
import Collapse from '../../js/bootstrap/mdb-prefix/collapse';
import Popover from '../../js/free/popover';
import ScrollSpy from '../../js/free/scrollspy';
import Tab from '../../js/free/tab';
import Tooltip from '../../js/free/tooltip';

// MDB FREE COMPONENTS
import Input from '../../js/free/input';
import Dropdown from '../../js/free/dropdown';

// MDB PRO COMPONENTS
import Animate from '../../js/pro/animate';
import Modal from '../../js/pro/modal';
import Sidenav from '../../js/pro/sidenav';
import Alert from '../../js/pro/alert';
import Toast from '../../js/pro/toast';
import Select from '../../js/pro/select';
import PerfectScrollbar from '../../js/pro/perfect-scrollbar';

// INIT MDB
import initMDB from '../../js/autoinit/index.pro';

const compiled = {
  Button,
  Collapse,
  Popover,
  ScrollSpy,
  Tab,
  Tooltip,
  Input,
  Dropdown,
  // PRO
  Animate,
  Modal,
  Sidenav,
  Alert,
  Toast,
  Select,
  PerfectScrollbar,
};

initMDB(compiled);

export default compiled;
