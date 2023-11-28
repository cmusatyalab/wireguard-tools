function addPaddings(element, paddingValue) {
  element.firstElementChild.style.paddingLeft = `${paddingValue}px`;
}

const expandingArrow = {
  button:
    '<button type="button"  class="btn btn-link btn-rounded p-0 mx-n3 my-1 position-absolute"></button>',
  downArrow: '<i class="fas fa-angle-down fa-lg" aria-hidden="true"></i>',
  rightArrow: '<i class="fas fa-angle-right fa-lg" aria-hidden="true"></i>',
  insertDownArrow(element) {
    element.insertAdjacentHTML('afterbegin', this.downArrow);
  },
  insertRightArrow(element) {
    element.insertAdjacentHTML('afterbegin', this.rightArrow);
  },
  insertDownButton(element) {
    element.insertAdjacentHTML(
      'afterbegin',
      `<button type="button"  class="btn btn-link btn-rounded p-0 mx-n3 my-1 position-absolute">${this.downArrow}</button>`
    );
  },
  insertRightButton(element) {
    element.insertAdjacentHTML(
      'afterbegin',
      `<button type="button"  class="btn btn-link btn-rounded p-0 mx-n3 my-1 position-absolute">${this.rightArrow}</button>`
    );
  },
};
function getExpandablesFromFirstNest(expandables, depth) {
  const siblings = [];
  expandables.forEach((expandable) => {
    if (!(parseInt(expandable.getAttribute('data-depth'), 10) === parseInt(depth, 10))) {
      return;
    }
    siblings.push(expandable);
  });

  return siblings;
}
function getFirstNestedRows(fromElement, toSelector) {
  const siblings = [];
  fromElement = fromElement.nextElementSibling;
  while (fromElement) {
    if (fromElement.matches(toSelector)) {
      break;
    }
    if ('tr' && !fromElement.matches('tr')) {
      fromElement = fromElement.nextElementSibling;
      continue;
    }
    siblings.push(fromElement);
    fromElement = fromElement.nextElementSibling;
  }
  return siblings;
}

function getNestedRows(fromElement, depth) {
  const siblings = [];
  fromElement = fromElement.nextElementSibling;
  while (fromElement) {
    if (fromElement.getAttribute('data-depth') && fromElement.getAttribute('data-depth') <= depth) {
      break;
    }
    if ('tr' && !fromElement.matches('tr')) {
      fromElement = fromElement.nextElementSibling;
      continue;
    }
    siblings.push(fromElement);
    fromElement = fromElement.nextElementSibling;
  }
  return siblings;
}

function getExpandables(element) {
  const rowsWithDepthAttr = [];
  const allRows = element.querySelectorAll('tr');
  allRows.forEach((el) => {
    if (!el.hasAttribute('data-depth')) {
      return;
    }
    rowsWithDepthAttr.push(el);
  });
  return rowsWithDepthAttr;
}

function hideAllNestedRows(elements) {
  elements.forEach((element) => {
    if (element.classList.contains('hidden')) {
      return;
    }
    if (!element.classList.contains('hidden')) element.classList.add('hidden');
  });
}
function showAllNestedRows(elements) {
  elements.forEach((element) => {
    if (!element.classList.contains('hidden')) {
      return;
    }
    if (element.classList.contains('hidden')) element.classList.remove('hidden');
  });
}

function wrapCellDataInDivs(elements) {
  elements.forEach((element) => {
    const newElement = `<div>${element.innerHTML}</div>`;
    element.innerHTML = newElement;
  });
}

function appendPaddings(rows) {
  let paddingValue;
  rows.forEach((row) => {
    if (row.hasAttribute('data-depth')) paddingValue = row.getAttribute('data-depth') * 25;
    row.firstElementChild.style.paddingLeft = `${paddingValue}px`;
  });
}

export {
  wrapCellDataInDivs,
  getExpandables,
  expandingArrow,
  getNestedRows,
  getFirstNestedRows,
  hideAllNestedRows,
  showAllNestedRows,
  addPaddings,
  appendPaddings,
  getExpandablesFromFirstNest,
};
