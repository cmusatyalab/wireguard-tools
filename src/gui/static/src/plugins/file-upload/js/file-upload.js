import { element, getjQuery, typeCheckConfig, getUID, onDOMContentLoaded } from './mdb/util/index';
import Data from './mdb/dom/data';
import EventHandler from './mdb/dom/event-handler';
import SelectorEngine from './mdb/dom/selector-engine';
import Manipulator from './mdb/dom/manipulator';
import mimeTypes from './mdb/util/mime-type-data';

const NAME = 'fileUpload';
const DATA_KEY = `mdb.${NAME}`;
const EVENT_KEY = `.${DATA_KEY}`;
const SELECTOR_DATA_INIT = '[data-mdb-file-upload-init]';

const DefaultType = {
  maxFileSize: '(Infinity|number)',
  defaultFile: '(null|string)',
  height: '(null|number)',
  disabled: '(string|boolean)',
  acceptedExtensions: 'array',
  multiple: 'boolean',
  defaultMsg: 'string',
  mainError: 'string',
  maxSizeError: 'string',
  formatError: 'string',
  previewMsg: 'string',
  removeBtn: 'string',
  disabledRemoveBtn: 'boolean',
  maxFileQuantity: '(Infinity|number)',
};

const Default = {
  maxFileSize: Infinity,
  defaultFile: null,
  height: null,
  disabled: false,
  acceptedExtensions: [],
  multiple: false,
  defaultMsg: 'Drag and drop a file here or click',
  mainError: 'Ooops, something wrong happended.',
  maxSizeError: 'Your file is too big (Max size ~~~)',
  formatError: 'Your file has incorrect file format (correct format(s) ~~~)',
  quantityError: 'Too many files (allowed quantity of files  ~~~)',
  previewMsg: 'Drag and drop or click to replace',
  removeBtn: 'Remove',
  disabledRemoveBtn: false,
  maxFileQuantity: Infinity,
};

const UnitTypes = {
  G: 1000000000,
  M: 1000000,
  K: 1000,
  B: 1,
};

const EVENT_ERROR = `fileError${EVENT_KEY}`;
const EVENT_FILE_REMOVE = `fileRemove${EVENT_KEY}`;
const EVENT_FILE_ADD = `fileAdd${EVENT_KEY}`;

class FileUpload {
  constructor(element, options = {}) {
    this._element = element;
    this.options = this._getConfig(options);
    this._fileUploadWrapper = element.parentNode;
    this._files = [];
    this._errors = [];

    if (this._element) {
      Data.setData(element, DATA_KEY, this);
    }

    this.init();
  }

  // Getters
  static get NAME() {
    return NAME;
  }

  // Public
  init() {
    const { initMDB, Ripple } = mdb; // eslint-disable-line global-require
    initMDB({ Ripple });

    this._createNativeAttr();
    this._createDropZone();
    EventHandler.on(this._element, 'change', (e) => {
      const isMultiple = this.options.multiple;

      if (isMultiple) {
        this._createMultipleList(e);
      } else {
        this._files = e.target.files;
      }

      this._onChangeEvent();
    });
  }

  dispose() {
    EventHandler.off(this._element, 'change');
    EventHandler.off(this._element, 'click');
    const fileUploadPreviews = SelectorEngine.findOne(
      '.file-upload-previews',
      this._fileUploadWrapper
    );
    EventHandler.off(fileUploadPreviews, 'drop');
    EventHandler.off(fileUploadPreviews, 'dragover');
    Data.removeData(this._element, DATA_KEY);
    this._element = null;
  }

  update(newOptions = {}) {
    this.options = this._getConfig(newOptions);
    this._createNativeAttr();
    this._createDropZone();
  }

  reset() {
    this._files = [];
    this._errors = [];
    this._createDropZone();
  }

  // Private
  _getConfig(options) {
    const config = {
      ...Default,
      ...Manipulator.getDataAttributes(this._element),
      ...options,
    };

    if (config.maxFileSize) {
      if (config.maxFileSize !== Infinity) {
        config.maxFileSize = this._convertFileSizeToBytes(config.maxFileSize);
      }
    }

    if (typeof config.acceptedExtensions === 'string') {
      config.acceptedExtensions = config.acceptedExtensions.split(',');
    }

    typeCheckConfig(NAME, config, DefaultType);

    return config;
  }

  _convertFileSizeToBytes(amount) {
    const num = parseFloat(amount);
    const unit = UnitTypes[amount[amount.length - 1]];

    return num * unit;
  }

  _createNativeAttr() {
    const { disabled, acceptedExtensions, multiple } = this.options;

    if (disabled) {
      this._element.setAttribute('disabled', disabled);
    }
    if (acceptedExtensions) {
      this._element.setAttribute('accept', acceptedExtensions);
    }
    if (multiple) {
      this._element.setAttribute('multiple', multiple);
    }
  }

  _createDropZone() {
    this._createBasicContainer();
    if (this.options.defaultFile) {
      this._createDefaultFilePreview();
    }
  }

  _createBasicContainer() {
    const isFileUpload = SelectorEngine.findOne('.file-upload', this._fileUploadWrapper);
    if (isFileUpload) {
      this._fileUploadWrapper.removeChild(isFileUpload);
    }

    const fileUpload = element('div');
    fileUpload.className = 'file-upload';

    if (this.options.height) {
      Manipulator.style(fileUpload, { height: `${this.options.height}px` });
    }
    if (this.options.disabled) {
      Manipulator.addClass(fileUpload, 'disabled');
    }

    const msgContainer = this._createFileUploadMsg();

    const fileUploadErrors = this._createFileUploadErrors();

    const fileUploadMask = this._createFileUploadMask();

    const fileUploadPreviews = this._createPreviews();

    if (this.options.multiple) Manipulator.addClass(this._element, 'has-multiple');

    fileUpload.appendChild(msgContainer);
    fileUpload.appendChild(fileUploadMask);
    fileUpload.appendChild(fileUploadErrors);
    fileUpload.appendChild(this._element);
    fileUpload.appendChild(fileUploadPreviews);

    this._fileUploadWrapper.appendChild(fileUpload);
  }

  _createFileUploadMsg() {
    const msgContainer = element('div');
    msgContainer.className = 'file-upload-message';

    const cloudIco = element('i');
    cloudIco.className = 'fas fa-cloud-upload-alt file-upload-cloud-icon';
    const defaultMsg = element('p');
    defaultMsg.className = 'file-upload-default-message';
    defaultMsg.textContent = this.options.defaultMsg;

    const mainError = element('p');
    mainError.className = 'file-upload-main-error';

    msgContainer.appendChild(cloudIco);
    msgContainer.appendChild(defaultMsg);
    msgContainer.appendChild(mainError);

    return msgContainer;
  }

  _createFileUploadErrors() {
    const errorsContainer = element('ul');
    errorsContainer.className = 'file-upload-errors';

    return errorsContainer;
  }

  _createFileUploadMask() {
    const fileUploadMask = element('div');
    fileUploadMask.className = 'file-upload-mask';

    return fileUploadMask;
  }

  _createPreviews() {
    const fileUploadPreviews = element('div');
    fileUploadPreviews.className = 'file-upload-previews';

    if (this.options.multiple) {
      EventHandler.on(fileUploadPreviews, 'drop', (e) => {
        e.preventDefault();
        if (this.options.maxFileQuantity > this._files.length) {
          const files = e.dataTransfer ? e.dataTransfer.files : [];
          files.forEach((file) => {
            file.id = getUID('file-');
          });
          this._files = [...this._files, ...files];
          this._onChangeEvent();
        }
      });

      EventHandler.on(fileUploadPreviews, 'dragover', (e) => {
        e.preventDefault();
      });
    }

    return fileUploadPreviews;
  }

  _createDefaultFilePreview() {
    const fileUploadPreviews = SelectorEngine.findOne(
      '.file-upload-previews',
      this._fileUploadWrapper
    );
    const fileUpload = SelectorEngine.findOne('.file-upload', this._fileUploadWrapper);
    Manipulator.addClass(fileUpload, 'has-preview');

    const preview = element('div');
    preview.className = 'file-upload-preview';

    const renderContainer = element('span');
    renderContainer.className = 'file-upload-render';

    const fileUploadPreviewDetails = element('div');
    fileUploadPreviewDetails.className = 'file-upload-preview-details';

    let removeBtn;
    if (!this.options.disabledRemoveBtn) {
      removeBtn = this._createClearButton(preview);
    }

    const detailsInner = element('div');
    detailsInner.className = 'file-uplod-preview-details-inner';

    const fileNameContainer = element('p');
    fileNameContainer.className = 'file-upload-file-name';
    const fileInfo = this.options.defaultFile.split('/');
    const fileName = fileInfo[fileInfo.length - 1];
    const fileType = fileName.split('.')[fileName.split('.').length - 1];

    if (fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png' || fileType === 'svg') {
      const fileUploadPreviewImg = element('img');
      fileUploadPreviewImg.className = 'file-upload-preview-img';
      fileUploadPreviewImg.src = this.options.defaultFile;
      renderContainer.appendChild(fileUploadPreviewImg);
    } else {
      const fileIco = element('i');
      fileIco.className = 'fas fa-file file-upload-file-icon';
      const extension = element('span');
      extension.className = 'file-upload-extension';
      renderContainer.appendChild(fileIco);
      renderContainer.appendChild(extension);
    }

    fileNameContainer.textContent = fileName;

    const previewMsg = element('p');
    previewMsg.className = 'file-upload-preview-message';
    previewMsg.textContent = this.options.previewMsg;

    detailsInner.appendChild(fileNameContainer);
    detailsInner.appendChild(previewMsg);
    if (removeBtn) {
      fileUploadPreviewDetails.appendChild(removeBtn);
    }
    fileUploadPreviewDetails.appendChild(detailsInner);

    preview.appendChild(renderContainer);
    preview.appendChild(fileUploadPreviewDetails);

    fileUploadPreviews.appendChild(preview);
  }

  _createPreview() {
    const fileUpload = SelectorEngine.findOne('.file-upload', this._fileUploadWrapper);
    const fileUploadPreviews = SelectorEngine.findOne(
      '.file-upload-previews',
      this._fileUploadWrapper
    );
    const fileUploadPreview = SelectorEngine.find('.file-upload-preview', fileUploadPreviews);
    const errorsContainer = SelectorEngine.findOne('ul.file-upload-errors', fileUpload);
    SelectorEngine.findOne('.file-upload-main-error', fileUpload).textContent = '';

    if (!this.options.isMultiple) {
      fileUploadPreview.forEach((element) => {
        fileUploadPreviews.removeChild(element);
      });
    }

    if (this._errors.length) {
      Manipulator.addClass(fileUpload, 'has-error');
      errorsContainer.innerHTML = '';
      SelectorEngine.findOne(
        '.file-upload-main-error',
        fileUpload
      ).textContent = this.options.mainError;

      this._errors.forEach((error) => {
        errorsContainer.innerHTML += `<li class="file-upload-error">${error}</li>`;
      });

      return;
    }

    fileUpload.classList.remove('has-error');
    errorsContainer.innerHTML = '';

    this._files.forEach((file) => {
      Manipulator.addClass(fileUpload, 'has-preview');

      const fileUploadPreview = element('div');
      fileUploadPreview.className = 'file-upload-preview';

      const fileUploadRender = this._createFileUploadRender(file);

      const fileUploadPreviewDetails = this._createFileUploadPreviewDetails(
        file,
        fileUploadPreview
      );

      fileUploadPreview.appendChild(fileUploadRender);
      fileUploadPreview.appendChild(fileUploadPreviewDetails);
      fileUploadPreviews.appendChild(fileUploadPreview);
    });
  }

  _createFileUploadRender(file) {
    const types = file.type.split('/');

    const fileUploadRender = element('div');
    fileUploadRender.className = 'file-upload-render';

    if (types[0] === 'image') {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imgEl = element('img');
        imgEl.src = reader.result;
        imgEl.className = 'file-upload-preview-img';
        fileUploadRender.appendChild(imgEl);
      };
      if (file) {
        reader.readAsDataURL(file);
      }
    } else {
      const fileIco = element('i');
      fileIco.className = 'fas fa-file file-upload-file-icon';
      const fileUploadExtension = element('span');
      fileUploadExtension.className = 'file-upload-extension';
      fileUploadExtension.textContent = types[1];

      fileUploadRender.appendChild(fileIco);
      fileUploadRender.appendChild(fileUploadExtension);
    }

    return fileUploadRender;
  }

  _createFileUploadPreviewDetails(file, fileUploadPreview) {
    const previewDetails = element('div');
    previewDetails.className = 'file-upload-preview-details';

    const detailsContainer = element('div');
    detailsContainer.className = 'file-upload-details-container';

    if (this.options.multiple) {
      EventHandler.on(detailsContainer, 'click', () => {
        if (this.options.maxFileQuantity > this._files.length) {
          this._element.click();
        }
      });
    }

    const detailsInner = element('div');
    detailsInner.className = 'file-uplod-preview-details-inner';

    const fileName = element('p');
    fileName.className = 'file-upload-file-name';
    fileName.textContent = file.name;

    const previewMsg = element('p');
    previewMsg.className = 'file-upload-preview-message';
    previewMsg.textContent = this.options.previewMsg;

    detailsInner.appendChild(fileName);
    detailsInner.appendChild(previewMsg);
    detailsContainer.appendChild(detailsInner);
    if (!this.options.disabledRemoveBtn) {
      previewDetails.appendChild(this._createClearButton(fileUploadPreview, file));
    }
    previewDetails.appendChild(detailsContainer);

    return previewDetails;
  }

  _createClearButton(currentPreviewEl, file) {
    const { removeBtn } = this.options;
    const clearButton = element('button');
    clearButton.className = 'btn btn-danger file-upload-remove-file-btn';
    clearButton.textContent = removeBtn;
    Manipulator.setDataAttribute(clearButton, 'rippleInit', '');
    const trashIco = element('i');
    trashIco.className = 'far fa-trash-alt ms-1';
    clearButton.appendChild(trashIco);

    EventHandler.on(clearButton, 'click', () => {
      const parent = currentPreviewEl.parentNode;
      this._removeFileAndPreview(currentPreviewEl, parent, file);
    });

    return clearButton;
  }

  _removeFileAndPreview(currentPreviewEl, parent, file) {
    const fileUpload = SelectorEngine.findOne('.file-upload', this._fileUploadWrapper);
    parent.removeChild(currentPreviewEl);

    if (this.options.multiple) {
      this._files = this._files.filter((el) => el.id !== file.id);
    } else {
      this._files = [];
    }
    this._element.value = '';
    this._errors = [];
    fileUpload.classList.remove('has-error');
    EventHandler.trigger(this._element, EVENT_FILE_REMOVE, {
      files: this._files,
      removedFile: file,
    });
  }

  _createMultipleList(e) {
    const canUploadMoreFiles = this.options.maxFileQuantity >= e.target.files.length;

    if (canUploadMoreFiles) {
      this._files = [...this._files, ...e.target.files];
    }
  }

  _createFilesId() {
    this._files.forEach((file) => {
      file.id = getUID('file-');
    });
  }

  _onChangeEvent() {
    this._validateParameters();
    if (this._errors.length) {
      this._files = [];
      this._element.value = '';
      EventHandler.trigger(this._element, EVENT_ERROR, { errors: this._errors });
    } else {
      this._createFilesId();
      EventHandler.trigger(this._element, EVENT_FILE_ADD, { files: this._files });
    }
    this._createPreview();
    this._errors = [];
  }

  _validateParameters() {
    this._files.forEach((file) => {
      this._checkFileSize(file);
      this._checkAcceptedExtensions(file);
    });
  }

  _checkFileSize(file) {
    const { maxFileSize, maxSizeError } = this.options;
    if (maxFileSize < file.size) {
      const BYTES_IN_MEGABYTE = UnitTypes.M;
      this._errors.push(maxSizeError.replace('~~~', `${maxFileSize / BYTES_IN_MEGABYTE}M`));
      if (this.options.multiple) {
        this._files = this._files.filter((currentFile) => currentFile.id !== file.id);
      }
    }
  }

  _checkAcceptedExtensions(file) {
    const extensionsForMapping = [];
    mimeTypes.forEach((mime) => {
      extensionsForMapping.push(mime.ext);
    });

    const { acceptedExtensions, formatError } = this.options;

    if (acceptedExtensions.length) {
      let fileMainType = file.type.split('/')[0];
      let fileSecondType = file.type.split('/')[1];

      if (fileMainType === '') {
        const fileNameSplit = file.name.split('.');
        fileMainType = `.${fileNameSplit[fileNameSplit.length - 1]}`;
        fileSecondType = fileNameSplit[fileNameSplit.length - 1];
      }

      let isFormatAgree = false;

      acceptedExtensions.forEach((format) => {
        format = format.trim();
        const isMappingNeeded = extensionsForMapping.indexOf(`${format}`) > -1;
        if (fileMainType === format) {
          isFormatAgree = true;
        } else if (isMappingNeeded) {
          format = mimeTypes.find((mimeType) => mimeType.ext === format).mime_type;
        }

        if (format.includes('/*') && format.includes(fileMainType)) {
          isFormatAgree = true;
        } else if (
          format.includes('/') &&
          format.includes(fileMainType) &&
          format.includes(fileSecondType)
        ) {
          isFormatAgree = true;
        } else if (format.includes(fileSecondType)) {
          isFormatAgree = true;
        }
      });

      if (!isFormatAgree) {
        this._errors.push(formatError.replace('~~~', acceptedExtensions));
        if (this.options.multiple) {
          this._files = this._files.filter((currentFile) => currentFile.id !== file.id);
        }
      }
    }
  }

  // Static

  static getInstance(element) {
    return Data.getData(element, DATA_KEY);
  }

  static jQueryInterface(config, options) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose/.test(config)) {
        return;
      }

      if (!data) {
        data = new FileUpload(this, _config);
      }

      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config](options);
      }
    });
  }
}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation - auto initialization
 * ------------------------------------------------------------------------
 */

SelectorEngine.find(SELECTOR_DATA_INIT).forEach((dnd) => {
  let instance = FileUpload.getInstance(dnd);
  if (!instance) {
    instance = new FileUpload(dnd);
  }
  return instance;
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * */

onDOMContentLoaded(() => {
  const $ = getjQuery();

  if ($) {
    const JQUERY_NO_CONFLICT = $.fn[NAME];
    $.fn[NAME] = FileUpload.jQueryInterface;
    $.fn[NAME].Constructor = FileUpload;
    $.fn[NAME].noConflict = () => {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return FileUpload.jQueryInterface;
    };
  }
});

export default FileUpload;
