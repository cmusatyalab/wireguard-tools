/* eslint-disable consistent-return */
import EventHandler from '../../mdb/dom/event-handler';
import Manipulator from '../../mdb/dom/manipulator';

// eslint-disable-next-line import/prefer-default-export
const formatToAmPm = (date) => {
  if (date === '') return;
  let hours;
  let minutes;
  let amOrPm;
  let originalHours;

  if (isValidDate(date)) {
    hours = date.getHours();
    originalHours = hours;
    minutes = date.getMinutes();
    hours %= 12;

    if (hours === 0) {
      amOrPm = 'AM';
    } else if (hours > 12) {
      amOrPm = 'PM';
    }
    hours = hours || 12;

    if (amOrPm === undefined) {
      amOrPm = hours >= 12 ? 'PM' : 'AM';
    }
    minutes = minutes < 10 ? `0${minutes}` : minutes;
  } else {
    [hours, minutes, amOrPm] = takeValue(date, false);
    originalHours = hours;

    hours %= 12;
    if (hours === 0 && amOrPm === undefined) {
      amOrPm = 'AM';
    }
    hours = hours || 12;

    if (amOrPm === undefined) {
      amOrPm = originalHours >= 12 ? 'PM' : 'AM';
    }
  }

  return {
    hours,
    minutes,
    amOrPm,
  };
};

const isValidDate = (date) => {
  // eslint-disable-next-line no-restricted-globals
  return date && Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date);
};

const formatNormalHours = (date) => {
  if (date === '') return;
  let hours;
  let minutes;

  if (!isValidDate(date)) {
    [hours, minutes] = takeValue(date, false);
  } else {
    hours = date.getHours();
    minutes = date.getMinutes();
  }

  minutes = Number(minutes) < 10 ? `0${Number(minutes)}` : minutes;

  return {
    hours,
    minutes,
  };
};

const toggleClassHandler = (event, classes) => {
  return EventHandler.on(document, event, classes, ({ target }) => {
    if (!Manipulator.hasClass(target, 'active')) {
      const allElements = document.querySelectorAll(classes);

      allElements.forEach((element) => {
        if (Manipulator.hasClass(element, 'active')) {
          Manipulator.removeClass(element, 'active');
        }
      });

      Manipulator.addClass(target, 'active');
    }
  });
};

const findMousePosition = ({ clientX, clientY, touches }, object, isMobile = false) => {
  const { left, top } = object.getBoundingClientRect();
  let obj = {};
  if (!isMobile || !touches) {
    obj = {
      x: clientX - left,
      y: clientY - top,
    };
  } else if (isMobile && Object.keys(touches).length > 0) {
    obj = {
      x: touches[0].clientX - left,
      y: touches[0].clientY - top,
    };
  }

  return obj;
};

const checkBrowser = () => {
  let result = false;
  if (
    (navigator.maxTouchPoints &&
      navigator.maxTouchPoints > 2 &&
      /MacIntel/.test(navigator.platform)) ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  ) {
    result = true;
  }
  return result;
};

const takeValue = (element, isInput = true) => {
  let valueInput;
  if (isInput) {
    valueInput = element.value.replace(/:/gi, ' ');
  } else {
    valueInput = element.replace(/:/gi, ' ');
  }

  return valueInput.split(' ');
};

const compareTimes = (time1, time2) => {
  const [time1Hour, time1Minutes, time1maxTimeFormat] = takeValue(time1, false);
  const [time2Hour, time2Minutes, time2maxTimeFormat] = takeValue(time2, false);
  const bothFormatsEqual = time1maxTimeFormat == time2maxTimeFormat;

  if (time1maxTimeFormat == 'PM' && time2maxTimeFormat == 'AM') {
    return 1;
  } else if (time1maxTimeFormat == 'AM' && time2maxTimeFormat == 'PM') {
    return 2;
  }

  if (bothFormatsEqual && time1Hour > time2Hour) {
    return 1;
  } else if (time1Hour < time2Hour) {
    return 2;
  }
  if (time1Minutes > time2Minutes) {
    return 1;
  } else if (time1Minutes < time2Minutes) {
    return 2;
  }
};
const getCurrentTime = () => {
  const date = new Date();
  const currentHours = date.getHours();
  let currentMinutes = String(date.getMinutes());
  if (currentMinutes.length === 1) {
    currentMinutes = `0${currentMinutes}`;
  }

  const currentTime = `${currentHours}:${currentMinutes}`;
  return currentTime;
};

const setMinTime = (minTime, disabledPast, format12) => {
  if (!disabledPast) {
    return minTime;
  }
  let currentTime = getCurrentTime();

  if (format12) {
    currentTime = `${formatToAmPm(currentTime).hours}:${formatToAmPm(currentTime).minutes} ${
      formatToAmPm(currentTime).amOrPm
    }`;
  }
  if ((minTime != '' && compareTimes(currentTime, minTime) == 1) || minTime === '') {
    minTime = currentTime;
  }
  return minTime;
};

const setMaxTime = (maxTime, disabledFuture, format12) => {
  if (!disabledFuture) {
    return maxTime;
  }
  let currentTime = getCurrentTime();

  if (format12) {
    currentTime = `${formatToAmPm(currentTime).hours}:${formatToAmPm(currentTime).minutes} ${
      formatToAmPm(currentTime).amOrPm
    }`;
  }
  if ((maxTime != '' && compareTimes(currentTime, maxTime) == 2) || maxTime === '') {
    maxTime = currentTime;
  }
  return maxTime;
};

const checkValueBeforeAccept = (
  { format12, maxTime, minTime, disablePast, disableFuture },
  input,
  hourHeader,
  minutesHeader
) => {
  const minute = takeValue(input)[1];

  minTime = setMinTime(minTime, disablePast, format12);
  maxTime = setMaxTime(maxTime, disableFuture, format12);

  const [maxTimeHour, maxTimeMin, maxTimeFormat] = takeValue(maxTime, false);
  const [minTimeHour, minTimeMin, minTimeFormat] = takeValue(minTime, false);

  if (maxTimeFormat === undefined && minTimeFormat === undefined) {
    if (maxTimeFormat === undefined) {
      if (maxTimeHour !== '' && minTimeHour === '') {
        if (Number(hourHeader) > Number(maxTimeHour)) {
          return;
        }

        if (maxTimeMin !== '' && minTimeMin === undefined) {
          if (Number(hourHeader) > Number(maxTimeHour)) {
            return;
          }
        }
      } else if (maxTimeHour === '' && minTimeHour !== '') {
        if (maxTimeMin === undefined && minTimeMin !== '') {
          if (
            Number(hourHeader) < Number(minTimeHour) ||
            (Number(hourHeader) < Number(minTimeHour) && minutesHeader < Number(minTimeMin))
          ) {
            return;
          }
        }
      }
    } else if (minTimeFormat === undefined) {
      if (maxTimeHour !== '' && minTimeHour === '') {
        if (Number(hourHeader) > Number(maxTimeHour)) {
          return;
        }

        if (maxTimeMin !== '' && minTimeMin === undefined) {
          if (Number(hourHeader) > Number(maxTimeHour) || minutesHeader > Number(maxTimeMin)) {
            return;
          }
        }
      } else if (maxTimeHour === '' && minTimeHour !== '') {
        if (maxTimeMin === undefined && minTimeMin !== '') {
          if (Number(hourHeader) < Number(minTimeHour) || minutesHeader < Number(minTimeMin)) {
            return;
          }
        }
      }
    }
  }

  return [hourHeader, minute];
};

const _verifyMaxTimeHourAndAddDisabledClass = (tips, maxTimeHour) => {
  tips.forEach((tip) => {
    if (tip.textContent === '00' || Number(tip.textContent) > maxTimeHour) {
      {
        Manipulator.addClass(tip, 'disabled');
      }
    }
  });
};

const _verifyMinTimeHourAndAddDisabledClass = (tips, minTimeHour) => {
  tips.forEach((tip) => {
    if (tip.textContent !== '00' && Number(tip.textContent) < minTimeHour) {
      {
        Manipulator.addClass(tip, 'disabled');
      }
    }
  });
};

const _verifyMaxTimeMinutesTipsAndAddDisabledClass = (tips, maxMinutes, maxHour, currHour) => {
  tips.forEach((tip) => {
    if (Number(tip.textContent) > maxMinutes && Number(currHour) == maxHour) {
      Manipulator.addClass(tip, 'disabled');
    }
  });
};

const _verifyMinTimeMinutesTipsAndAddDisabledClass = (tips, minMinutes, minHour, currHour) => {
  tips.forEach((tip) => {
    if (Number(tip.textContent) < minMinutes && Number(currHour) == minHour) {
      Manipulator.addClass(tip, 'disabled');
    }
  });
};

const _convertHourToNumber = (string) => {
  let hour;
  if (string.startsWith('0')) {
    hour = Number(string.slice(1));
  } else {
    hour = Number(string);
  }
  return hour;
};

export {
  checkBrowser,
  findMousePosition,
  formatNormalHours,
  formatToAmPm,
  toggleClassHandler,
  checkValueBeforeAccept,
  takeValue,
  compareTimes,
  setMinTime,
  setMaxTime,
  _verifyMinTimeHourAndAddDisabledClass,
  _verifyMaxTimeMinutesTipsAndAddDisabledClass,
  _verifyMinTimeMinutesTipsAndAddDisabledClass,
  _verifyMaxTimeHourAndAddDisabledClass,
  _convertHourToNumber,
};
