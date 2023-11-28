/* eslint-disable indent */
const pagination = (
  { text, entries, entriesOptions, fullPagination, rowsText },
  loading,
  darkMode
) => {
  const options = entriesOptions
    .map((option) => {
      return `<option value="${option}" ${option === entries ? 'selected' : ''}>${option}</option>`;
    })
    .join('\n');

  return `
<div class="table-editor__pagination">
  <div class="table-editor__select-wrapper">
    <p class="table-editor__select-text">${rowsText}</p>
    <select name="entries" ${
      loading ? 'data-mdb-disabled="true"' : ''
    } class="table-editor__select select">
      ${options}
    </select>
  </div>
  <div class="table-editor__pagination-nav">
  ${text}
  </div>
  <div class="table-editor__pagination-buttons">
    ${
      fullPagination
        ? `<button data-mdb-ripple-init data-mdb-ripple-color="${
            darkMode ? 'light' : 'dark'
          }" class="btn btn-link table-editor__pagination-button table-editor__pagination-start"><i class="fa fa-angle-double-left"></i></button>`
        : ''
    }
    <button data-mdb-ripple-init data-mdb-ripple-color="${
      darkMode ? 'light' : 'dark'
    }" class="btn btn-link table-editor__pagination-button table-editor__pagination-left"><i class="fa fa-chevron-left"></i></button>
    <button data-mdb-ripple-init data-mdb-ripple-color="${
      darkMode ? 'light' : 'dark'
    }" class="btn btn-link table-editor__pagination-button table-editor__pagination-right"><i class="fa fa-chevron-right"></i></button>
    ${
      fullPagination
        ? `<button data-mdb-ripple-init data-mdb-ripple-color="${
            darkMode ? 'light' : 'dark'
          }" class="btn btn-link table-editor__pagination-button table-editor__pagination-end"><i class="fa fa-angle-double-right"></i></button>`
        : ''
    }
  </div>
</div>
`;
};

export default pagination;
