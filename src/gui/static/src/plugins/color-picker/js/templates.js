const create = {
  canvas: () => {
    return `
      <div class="color-picker-canvas-wrapper">
        <div class="color-picker-canvas-dot"></div>
        <canvas width="350" height="350"></canvas>
      </div>
    `;
  },
  pickerControls: () => {
    return `
      <div class="color-picker-controls d-flex align-items-center p-2">
        <div class="color-picker-color-dot-wrapper">
          <div class="color-picker-color-dot">
          </div>
        </div>
        <div class="ps-4 w-100">
          <div class="color-picker-range">
            <input type="range" class="form-range" value="0" min="0" max="360" id="hueRange"/>
          </div>
          <div class="color-picker-range">
            <div class="color-picker-range-alpha">
              <input type="range" class="form-range" value="1" min="0" max="1" step="0.01" id="alphaRange"/>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  pickerColorInputsWrapper: () => {
    return '<div class="color-picker-color-inputs-wrapper d-flex align-items-center p-2"></div>';
  },
  pickerColorInputs: (labels) => {
    return `
      <div class="form-outline me-2">
        <input type="number" id="input-1" class="form-control text-center me-2" min=0 />
        <label class="form-label" for="input-1">${labels[0]}</label>
      </div>
      <div class="form-outline me-2">
        <input type="number" id="input-2" class="form-control text-center me-2" min=0 />
        <label class="form-label" for="input-2">${labels[1]}</label>
      </div>
      <div class="form-outline me-2">
        <input type="number" id="input-3" class="form-control text-center me-2" min=0 />
        <label class="form-label" for="input-3">${labels[2]}</label>
      </div>
      <div class="form-outline">
        <input type="number" id="input-4" class="form-control text-center me-2" min=0 />
        <label class="form-label" for="input-4">${labels[3]}</label>
      </div>
    `;
  },
  pickerColorHexInput: () => {
    return `
      <div class="form-outline me-2">
        <input type="text" class="form-control text-center me-2" />
        <label class="form-label" for="hex-input">Hex</label>
      </div>
    `;
  },
  changeViewIcons: () => {
    return `
      <div class="color-picker-change-view-icons d-flex flex-column align-items-center">
        <button id="next-format" type="button" class="btn btn-link btn-sm color-picker-next-format-button py-0 px-2" data-mdb-ripple-init>
          <i class="fas fa-angle-up"></i>
        </button>
        <button id="previous-format" type="button" class="btn btn-link btn-sm color-picker-previous-format-button py-0 px-2" data-mdb-ripple-init>
          <i class="fas fa-angle-down"></i>
        </button>
      </div>
    `;
  },
  copyCodeIcon: () => {
    return `
      <button id="copy-code" class="btn btn-link color-picker-copy-button py-0 px-2" data-mdb-ripple-init><i class="far fa-copy"></i></button>
    `;
  },
  swatchesWrapper: (colors) => {
    const numberOfCols = colors.length;
    const swatches = document.createElement('div');
    const row = document.createElement('div');
    swatches.classList.add('color-picker-swatches', 'p-2');
    row.classList.add('row');

    for (let i = 0; i < numberOfCols; i++) {
      const col = document.createElement('div');
      col.classList.add('col');

      colors[i].forEach((color) => {
        const colorDiv = document.createElement('div');
        colorDiv.setAttribute('tabindex', 1);
        colorDiv.classList.add('mb-1', 'color-picker-swatches-color');
        colorDiv.style.backgroundColor = color;

        col.append(colorDiv);
      });

      row.append(col);
    }

    swatches.append(row);

    return swatches;
  },
  dropdown: (element) => {
    const dropdownWrapper = document.createElement('div');

    dropdownWrapper.classList.add('dropdown');
    element.parentNode.insertBefore(dropdownWrapper, element);
    element.classList.add('dropdown-menu');
    dropdownWrapper.appendChild(element);

    dropdownWrapper.insertAdjacentHTML(
      'afterbegin',
      `<a
        class="btn btn-light"
        href="#"
        role="button"
        id="dropdownMenuLink"
        data-mdb-ripple-init
        data-mdb-dropdown-init
        aria-expanded="false"
      > Open </a>`
    );
  },
};

export default create;
