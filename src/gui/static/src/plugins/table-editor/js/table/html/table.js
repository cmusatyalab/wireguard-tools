/* eslint-disable indent */
import paginationTemplate from './pagination';
import generateColumns from './columns';
import generateRows from './rows';

const tableTemplate = ({
  columns,
  confirm,
  rows,
  inline,
  noFoundMessage,
  loading,
  loadingMessage,
  loaderClass,
  action,
  editMode,
  editedRow,
  pagination,
  dark,
}) => {
  const rowsTemplate = generateRows({
    rows,
    inline,
    confirm,
    columns,
    noFoundMessage,
    loading,
    editMode,
    editedRow,
    dark,
    actionPosition: action.position,
  });
  const columnsTemplate = generateColumns(columns, action);

  const table = `
<div class="table-editor__inner table-responsive">
  <table class="table">
    <thead>
      <tr>
        ${columnsTemplate}
      </tr>
    </thead>
    <tbody>
      ${loading ? '' : rowsTemplate}
    </tbody>
  </table>
</div>
  ${
    loading
      ? `
  <div class="table-editor__loader bg-light}">
    <span class="table-editor__loader-inner"><span class="table-editor__progress ${loaderClass}"></span></span>
  </div>
  <p class="text-center text-muted my-4">${loadingMessage}</p>
`
      : ''
  }
  ${pagination.enable ? paginationTemplate(pagination, loading, dark) : ''}
  `;

  return { table, rows: rowsTemplate, column: columnsTemplate };
};

export default tableTemplate;
