import { isRTL } from '../../../mdb/util/index';
/* eslint-disable indent */
const pagination = (
  { text, entries, entriesOptions, fullPagination, rowsText, allText },
  loading
) => {
  const options = entriesOptions
    .map((option) => {
      if (option === 'All') {
        return `<option value="${option}" ${
          option === entries ? 'selected' : ''
        }>${allText}</option>`;
      }
      return `<option value="${option}" ${option === entries ? 'selected' : ''}>${option}</option>`;
    })
    .join('\n');

  return `
<div class="datatable-pagination">
  <div class="datatable-select-wrapper">
    <p class="datatable-select-text">${rowsText}</p>
    <select name="entries"
      ${loading ? 'data-mdb-disabled="true"' : ''} class="datatable-select select">
      ${options}
    </select>
  </div>
  <div class="datatable-pagination-nav">
  ${text}
  </div>
  <div class="datatable-pagination-buttons">
    ${
      fullPagination
        ? '<button data-mdb-ripple-color="dark" data-mdb-ripple-init class="btn btn-link datatable-pagination-button datatable-pagination-start"><i class="fa fa-angle-double-left"></i></button>'
        : ''
    }
    <button data-mdb-ripple-color="dark" data-mdb-ripple-init class="btn btn-link datatable-pagination-button datatable-pagination-left"><i class="fa fa-chevron-${
      isRTL ? 'right' : 'left'
    }"></i></button>
    <button data-mdb-ripple-color="dark" data-mdb-ripple-init class="btn btn-link datatable-pagination-button datatable-pagination-right"><i class="fa fa-chevron-${
      isRTL ? 'left' : 'right'
    }"></i></button>
    ${
      fullPagination
        ? '<button data-mdb-ripple-color="dark" data-mdb-ripple-init class="btn btn-link datatable-pagination-button datatable-pagination-end"><i class="fa fa-angle-double-right"></i></button>'
        : ''
    }
  </div>
</div>
`;
};

export default pagination;
