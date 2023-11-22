/* eslint-disable indent */
import getField from './editField';

const getButtons = (edited, editMode, confirm) => {
  if (edited) {
    return `<button class="me-2 btn btn-lg save-button"><i class="fa fa-check" data-mdb-ripple-init ></i></button>
    <button class="btn btn-lg discard-button"><i class="fa fa-ban" data-mdb-ripple-init ></i></button>`;
  }

  return `<button class="me-2 btn btn-lg edit-button" ${
    editMode ? 'disabled' : ''
  } data-mdb-ripple-init><i class="far fa-edit"></i></button><button class="btn btn-lg ${
    confirm ? 'popconfirm-toggle' : 'delete-button'
  } ${editMode ? 'disabled' : ''}" data-mdb-ripple-init><i class="far fa-trash-alt"></i></button>`;
};

const getStyle = (column, i, columns) => {
  const style = {};

  if (column.width) {
    style['min-width'] = `${column.width}px`;
    style['max-width'] = `${column.width}px`;
  }
  if (column.fixed) {
    const fixedOffset = columns
      .filter((cell, j) => cell.fixed === column.fixed && j < i)
      .reduce((a, b) => a + b.width, 0);

    style[column.fixed === 'right' ? 'right' : 'left'] = `${fixedOffset}px`;
  }

  return style;
};

const getCSS = (style) => {
  return Object.keys(style)
    .map((property) => `${property}: ${style[property]}`)
    .join('; ');
};

const rows = ({
  rows,
  columns,
  confirm,
  noFoundMessage,
  loading,
  editMode,
  editedRow,
  inline,
  dark,
  actionPosition,
}) => {
  const rowsTemplate = rows.map((row) => {
    const edited = inline && editMode && row.rowIndex === editedRow;

    const innerRow = columns
      .map((column, i) => {
        const style = getStyle(column, i, columns);

        const cssText = getCSS(style);

        const field = getField({ row, column, edited, darkMode: dark });

        return `<td style="${cssText}" class="${
          column.fixed ? 'fixed-cell' : ''
        }" data-mdb-field="${column.field}">${field}</td>`;
      })
      .join('');

    const actionButtons = `<td>${getButtons(edited, editMode, confirm, dark)}</td>`;

    const content =
      actionPosition === 'start' ? [actionButtons, innerRow] : [innerRow, actionButtons];

    return `<tr scope="row" data-mdb-index="${row.rowIndex}">${content.join('')}</tr>`;
  });

  return rows.length > 0 || loading
    ? rowsTemplate.join('\n')
    : `<tr><td>${noFoundMessage}</td></tr>`;
};

export default rows;
