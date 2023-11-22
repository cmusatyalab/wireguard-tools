// BOOTSTRAP CORE COMPONENTS
import Button from './free/button';
import Offcanvas from './bootstrap/mdb-prefix/offcanvas';
import Carousel from './free/carousel';
import Popover from './free/popover';
import ScrollSpy from './free/scrollspy';
import Tab from './free/tab';
import Tooltip from './free/tooltip';

// MDB FREE COMPONENTS
import Input from './free/input';
import Collapse from './free/collapse';
import Dropdown from './free/dropdown';
import Ripple from './free/ripple';
import Range from './free/range';

// MDB PRO COMPONENTS
import Animate from './pro/animate';
import Chart from './pro/charts/charts';
import Lightbox from './pro/lightbox';
import Rating from './pro/rating';
import Sidenav from './pro/sidenav';
import Alert from './pro/alert';
import Toast from './pro/toast';
import Timepicker from './pro/timepicker';
import Navbar from './pro/navbar';
import InfiniteScroll from './pro/infinite-scroll';
import LazyLoad from './pro/lazy-load';
import Datepicker from './pro/datepicker';
import Popconfirm from './pro/popconfirm';
import Datatable from './pro/datatable';
import Stepper from './pro/stepper';
import Sticky from './pro/sticky';
import Select from './pro/select';
import Touch from './pro/touch';
import SmoothScroll from './pro/smooth-scroll';
import PerfectScrollbar from './pro/perfect-scrollbar';
import Loading from './pro/loading-management';
import Autocomplete from './pro/autocomplete';
import Modal from './pro/modal';
import Clipboard from './pro/clipboard';
import ChipsInput from './pro/chips';
import Chip from './pro/chips/chip';
import MultiRangeSlider from './pro/multi-range';
import Datetimepicker from './pro/date-time-picker';

import initMDB from './autoinit/index.pro';

const mdb = {
  // FREE
  Button,
  Carousel,
  Collapse,
  Offcanvas,
  Dropdown,
  Input,
  Modal,
  Popover,
  ScrollSpy,
  Ripple,
  Tab,
  Tooltip,
  Range,
  // PRO
  Alert,
  Animate,
  Chart,
  Datepicker,
  Datatable,
  Lightbox,
  Navbar,
  Popconfirm,
  Rating,
  Sidenav,
  SmoothScroll,
  Timepicker,
  Toast,
  InfiniteScroll,
  LazyLoad,
  Stepper,
  Sticky,
  Select,
  Touch,
  PerfectScrollbar,
  Loading,
  Autocomplete,
  Clipboard,
  ChipsInput,
  Chip,
  MultiRangeSlider,
  Datetimepicker,
};

initMDB(mdb);

export {
  // FREE
  Button,
  Carousel,
  Collapse,
  Offcanvas,
  Dropdown,
  Input,
  Modal,
  Popover,
  ScrollSpy,
  Ripple,
  Tab,
  Tooltip,
  Range,
  // PRO
  Alert,
  Animate,
  Chart,
  Datepicker,
  Datatable,
  Lightbox,
  Navbar,
  Popconfirm,
  Rating,
  Sidenav,
  SmoothScroll,
  Timepicker,
  Toast,
  InfiniteScroll,
  LazyLoad,
  Stepper,
  Sticky,
  Select,
  Touch,
  PerfectScrollbar,
  Loading,
  Autocomplete,
  Clipboard,
  ChipsInput,
  Chip,
  MultiRangeSlider,
  Datetimepicker,
  initMDB,
};
