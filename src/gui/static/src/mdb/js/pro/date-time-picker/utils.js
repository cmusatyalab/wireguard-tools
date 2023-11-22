import { createDate } from '../datepicker/date-utils';

const isValidTime = (time) => {
  const AmPmReg = /^(0?[1-9]|1[012])(:[0-5]\d) [APap][mM]$/;
  const timeReg = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return time.match(AmPmReg) || time.match(timeReg);
};

const isValidDate = (date) => {
  // eslint-disable-next-line no-restricted-globals
  return date && Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date);
};

const getMonth = (date) => {
  return date.getMonth();
};

const getYear = (date) => {
  return date.getFullYear();
};

const getDelimeters = (format) => {
  return format.match(/[^(dmy)]{1,}/g);
};

const parseDate = (dateString, format, delimeters, options) => {
  let delimeterPattern;

  if (delimeters[0] !== delimeters[1]) {
    delimeterPattern = delimeters[0] + delimeters[1];
  } else {
    delimeterPattern = delimeters[0];
  }

  const regExp = new RegExp(`[${delimeterPattern}]`);
  const dateParts = dateString.split(regExp);
  const formatParts = format.split(regExp);
  const isMonthString = format.indexOf('mmm') !== -1;

  const datesArray = [];

  for (let i = 0; i < formatParts.length; i++) {
    if (formatParts[i].indexOf('yy') !== -1) {
      datesArray[0] = { value: dateParts[i], format: formatParts[i] };
    }
    if (formatParts[i].indexOf('m') !== -1) {
      datesArray[1] = { value: dateParts[i], format: formatParts[i] };
    }
    if (formatParts[i].indexOf('d') !== -1 && formatParts[i].length <= 2) {
      datesArray[2] = { value: dateParts[i], format: formatParts[i] };
    }
  }

  let monthsNames;

  if (format.indexOf('mmmm') !== -1) {
    monthsNames = options.monthsFull;
  } else {
    monthsNames = options.monthsShort;
  }

  const year = Number(datesArray[0].value);
  const month = isMonthString
    ? getMonthNumberByMonthName(datesArray[1].value, monthsNames)
    : Number(datesArray[1].value) - 1;
  const day = Number(datesArray[2].value);

  const parsedDate = createDate(year, month, day);
  return parsedDate;
};

const getMonthNumberByMonthName = (monthValue, monthLabels) => {
  return monthLabels.findIndex((monthLabel) => monthLabel === monthValue);
};

export {
  getDelimeters,
  parseDate,
  getMonth,
  getYear,
  getMonthNumberByMonthName,
  isValidDate,
  isValidTime,
};
