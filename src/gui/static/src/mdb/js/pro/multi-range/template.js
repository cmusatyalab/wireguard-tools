/* eslint-disable import/prefer-default-export */

const getConnectsTemplate = () => {
  return `<div class="multi-range-slider-connects">
<div class="multi-range-slider-connect"></div>
</div>`;
};

const getHandleTemplate = () => {
  return `<div class="multi-range-slider-hand">
  <div class="multi-range-slider-handle"></div>
</div>`;
};

const getTooltipTemplate = (value) => {
  return `
  <span class="multi-range-slider-tooltip">
    <span class="multi-range-slider-tooltip-value">${value}</span>
  </span>
  `;
};

export { getConnectsTemplate, getHandleTemplate, getTooltipTemplate };
