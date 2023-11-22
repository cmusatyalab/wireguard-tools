/* eslint-disable indent */
const rows = ({ rows, columns, noFoundMessage, edit, selectable, loading }) => {
  const rowsTemplate = rows.map((row) => {
    const checkbox = `
    <td data-mdb-field="checkbox">
      <div class="form-check">
        <input data-mdb-row-index="${row.rowIndex}" class="datatable-row-checkbox form-check-input" type="checkbox">
      </div>
    </td>
    `;
    const innerRow = columns
      .map((column, i) => {
        const style = {};

        if (column.width) {
          style['min-width'] = `${column.width - 1}px`;
          style['max-width'] = `${column.width}px`;
          style.width = `${column.width}px`;
        }
        if (column.fixed) {
          const fixedOffset = columns
            .filter((cell, j) => cell.fixed === column.fixed && j < i)
            .reduce((a, b) => a + b.width, 0);

          style[column.fixed === 'right' ? 'right' : 'left'] = `${fixedOffset}px`;
        }

        const cssText = Object.keys(style)
          .map((property) => `${property}: ${style[property]}`)
          .join('; ');

        return `<td style="${cssText}" class="${
          column.fixed ? 'fixed-cell' : ''
        }" data-mdb-field="${column.field}" ${edit && 'contenteditable="true"'}>${
          row[column.field]
        }</td>`;
      })
      .join('');

    return `<tr scope="row" data-mdb-index="${row.rowIndex}">${
      selectable ? checkbox : ''
    }${innerRow}</tr>`;
  });

  return rows.length > 0 || loading
    ? rowsTemplate.join('\n')
    : `<tr><td>${noFoundMessage}</td></tr>`;
};

export default rows;
