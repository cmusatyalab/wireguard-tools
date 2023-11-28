/* eslint-disable indent */
import paginationTemplate from './pagination';
import generateColumns from './columns';
import generateRows from './rows';

const tableTemplate = ({
  columns,
  rows,
  noFoundMessage,
  edit,
  multi,
  selectable,
  loading,
  loadingMessage,
  loaderClass,
  pagination,
}) => {
  const rowsTemplate = generateRows({ rows, columns, noFoundMessage, edit, loading, selectable });
  const columnsTemplate = generateColumns(columns, selectable, multi);

  const table = `
<div class="datatable-inner table-responsive">
  <table class="table datatable-table">
    <thead class="datatable-header">
      <tr>
        ${columnsTemplate}
      </tr>
    </thead>
    <tbody class="datatable-body">
      ${loading ? '' : rowsTemplate}
    </tbody>
  </table>
</div>
  ${
    loading
      ? `
  <div class="datatable-loader bg-light}">
    <span class="datatable-loader-inner"><span class="datatable-progress ${loaderClass}"></span></span>
  </div>
  <p class="text-center text-muted my-4">${loadingMessage}</p>
`
      : ''
  }
  ${pagination.enable ? paginationTemplate(pagination, loading) : ''}
  `;

  return { table, rows: rowsTemplate, column: columnsTemplate };
};

export default tableTemplate;
