/* eslint-disable indent */

const columns = (columns, selectable, multi) => {
  const checkboxHeader = multi
    ? `
<th scope="col">
  <div class="form-check d-flex align-items-center mb-0">
    <input class="datatable-header-checkbox form-check-input" type="checkbox">
  </div>
</th>
`
    : '<th scope="col"></th>';

  const headers = columns.map((column, i) => {
    const fixedOffset = column.fixed
      ? columns
          .filter((cell, j) => cell.fixed === column.fixed && j < i)
          .reduce((a, b) => a + b.width, 0)
      : null;

    return `<th style="${
      column.fixed ? `${column.fixed === 'right' ? 'right' : 'left'}: ${fixedOffset}px;` : ''
    }" ${column.fixed ? 'class="fixed-cell"' : ''} scope="col">${
      column.sort
        ? `<i data-mdb-sort="${column.field}" class="datatable-sort-icon fas fa-arrow-up"></i>`
        : ''
    } ${column.label}</th>`;
  });

  return [selectable ? checkboxHeader : '', ...headers].join('\n');
};

export default columns;
