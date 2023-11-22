/* eslint-disable indent */

const columns = (columns, { header, position }) => {
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
        ? `<i data-mdb-sort="${column.field}" class="table-editor__sort-icon fas fa-arrow-up"></i>`
        : ''
    } ${column.label}</th>`;
  });

  const actionHeader = `<th scope="col">${header}</th>`;

  if (position === 'start') {
    return [actionHeader, ...headers].join('\n');
  }

  return [...headers, actionHeader].join('\n');
};

export default columns;
