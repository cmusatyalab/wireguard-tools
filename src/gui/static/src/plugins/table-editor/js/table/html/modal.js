/* eslint-disable indent */
import { element } from '../../mdb/util/index';
import Manipulator from '../../mdb/dom/manipulator';
import getField from './editField';

const getModalContent = (row, columns, header, darkMode) => {
  const form = columns
    .map((column) => {
      return `
      <div class="my-4 table-editor_input-wrapper" data-mdb-field="${column.field}">${getField({
        row,
        column,
        edited: true,
        showLabel: true,
        darkMode,
      })}</div>`;
    })
    .join('\n');
  return {
    header: `
  <h4>${header}</h4>`,
    body: `
  <form>${form}</form>
  `,
  };
};

const getModal = (saveText, cancelText, darkMode) => {
  const modal = element('div');
  Manipulator.addClass(modal, 'modal');
  Manipulator.addClass(modal, 'fade');

  modal.innerHTML = `
  <div class="modal-dialog">
    <div class="modal-content ${darkMode ? 'bg-dark' : ''}">
      <div class="modal-header">
      </div>
      <div class="modal-body">
      </div>
      <div class="modal-footer">
        <button data-mdb-ripple-init class="btn shadow-0 btn-md btn-outline-${
          darkMode ? 'light' : 'primary'
        } modal-discard-button" data-mdb-dismiss="modal">${cancelText}</button>
        <button data-mdb-ripple-init class="me-2 btn shadow-0 btn-md btn-${
          darkMode ? 'light' : 'primary'
        } modal-save-button">${saveText}</button>
      </div>
    </div>
  </div>
    `;

  return modal;
};

export { getModalContent, getModal };
