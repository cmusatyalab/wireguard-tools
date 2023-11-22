const parseToHTML = (string) => {
  const parser = new DOMParser();

  const node = parser.parseFromString(string, 'text/html');

  return node.body;
};

const getElementCenter = (rect) => {
  return {
    x: rect.width / 2,
    y: rect.height / 2,
  };
};

const getEventCoordinates = (e) => {
  if (e.touches) {
    const [touch] = e.touches;

    return {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  return {
    x: e.clientX,
    y: e.clientY,
  };
};

const getVector = (points) => {
  const [point1, point2] = points.map((point) => ({ x: point.clientX, y: point.clientY }));

  return {
    center: { x: point1.x + (point2.x - point1.x) / 2, y: point1.y + (point2.y - point1.y) / 2 },
    length: Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2),
  };
};

const getDisplacement = (position, prev) => {
  return {
    x: position.x - prev.x,
    y: position.y - prev.y,
  };
};

const getAttributeName = (attr) => {
  return attr
    .split(/(?=[A-Z])/g)
    .map((property) => property.toLowerCase())
    .join('-');
};

const setAttributes = (el, attrs) => {
  Object.keys(attrs).forEach((attr) => {
    el.setAttribute(getAttributeName(attr), attrs[attr]);
  });
};

const generateGetBoundingClientRect = (x = 0, y = 0) => {
  return () => ({
    width: 0,
    height: 0,
    top: y + 20,
    right: x,
    bottom: y + 20,
    left: x,
  });
};

export {
  parseToHTML,
  getElementCenter,
  getEventCoordinates,
  getVector,
  getDisplacement,
  setAttributes,
  getAttributeName,
  generateGetBoundingClientRect,
};
