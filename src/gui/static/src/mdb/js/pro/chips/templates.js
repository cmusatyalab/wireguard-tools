/* eslint-disable import/prefer-default-export */
export const getInputField = ({ inputID, labelText }) => {
  return `<div class="form-outline chips-input-wrapper">
      <input type="text" id="${inputID}" class="form-control chips-input" />
      <label class="form-label" for="${inputID}">
        ${labelText}
      </label>

      <div class="form-notch">
        <div class="form-notch-leading" style="width: 9px;"></div>
        <div class="form-notch-middle" style="width: 87.2px;"></div>
        <div class="form-notch-trailing"></div>
      </div>
    </div>`;
};

export const getChip = ({ text }) => {
  return `<div class="chip btn"><span class="text-chip">${text}</span> <i class="close fas fa-times"></i></div>`;
};
