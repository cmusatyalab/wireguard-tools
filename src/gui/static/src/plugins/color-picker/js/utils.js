export const HSLAtoHSVA = (hsla) => {
  const { h, s, l, a } = hsla;
  const v = l + s * Math.min(l, 1 - l);
  const sprime = v === 0 ? 0 : 2 - (2 * l) / v;

  return { h, s: sprime, v, a };
};

export const HSVAtoHSLA = (hsva) => {
  const { h, s, v, a } = hsva;
  let l = v - (v * s) / 2;
  let sprime = l === 1 || l === 0 ? 0 : (v - l) / Math.min(l, 1 - l);

  l = Number(l.toFixed(2));
  sprime = Number(sprime.toFixed(2));

  return { h, s: sprime, l, a };
};

export const HSVAtoRGBA = (hsva) => {
  const { h, s, v, a } = hsva;
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  };

  const r = Math.round(f(5) * 255);
  const g = Math.round(f(3) * 255);
  const b = Math.round(f(1) * 255);

  return { r, g, b, a };
};

export const hslaToRgba = (hsla) => {
  const hsva = HSLAtoHSVA(hsla);
  const rgba = HSVAtoRGBA(hsva);
  return rgba;
};

export const HEXtoRGBA = (hex, alpha = 1) => {
  hex = hex.substring(1, hex.length);
  hex = hex.split('');

  let r = hex[0] + hex[0];
  let g = hex[1] + hex[1];
  let b = hex[2] + hex[2];

  if (hex.length >= 6) {
    r = hex[0] + hex[1];
    g = hex[2] + hex[3];
    b = hex[4] + hex[5];
  }

  const intR = parseInt(r, 16);
  const intG = parseInt(g, 16);
  const intB = parseInt(b, 16);

  return { r: intR, g: intG, b: intB, a: alpha };
};

export const CMYKtoRGBA = (CMYK, alpha = 1) => {
  const result = {};

  const c = CMYK.c / 100;
  const m = CMYK.m / 100;
  const y = CMYK.y / 100;
  const k = CMYK.k / 100;

  result.r = 1 - Math.min(1, c * (1 - k) + k);
  result.g = 1 - Math.min(1, m * (1 - k) + k);
  result.b = 1 - Math.min(1, y * (1 - k) + k);

  result.r = Math.round(result.r * 255);
  result.g = Math.round(result.g * 255);
  result.b = Math.round(result.b * 255);
  result.a = alpha;

  return result;
};

export const RGBAtoHex = (rgba) => {
  const toHex = (v) => {
    const h = Math.round(v).toString(16);
    return ('00'.substr(0, 2 - h.length) + h).toUpperCase();
  };

  const r = toHex(rgba.r);
  const g = toHex(rgba.g);
  const b = toHex(rgba.b);
  const a = toHex(Math.round(rgba.a * 255));

  return `#${r}${g}${b}${a}`;
};

export const RGBAtoHSVA = (rgba) => {
  if (!rgba) return { h: 0, s: 1, v: 1, a: 1 };

  const r = rgba.r / 255;
  const g = rgba.g / 255;
  const b = rgba.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;

  if (max !== min) {
    if (max === r) {
      h = 60 * ((g - b) / delta);
    } else if (max === g) {
      h = 60 * (2 + (b - r) / delta);
    } else if (max === b) {
      h = 60 * (4 + (r - g) / delta);
    }
  }

  if (h < 0) {
    h += 360;
  }

  let s = max === 0 ? 0 : delta / max;
  let v = max;
  const a = rgba.a;

  h = Number(h.toFixed());
  s = Number(s.toFixed(2));
  v = Number(v.toFixed(2));

  return { h, s, v, a };
};

export const RGBAtoHSLA = (rgba) => {
  const hsva = RGBAtoHSVA(rgba);
  const hsla = HSVAtoHSLA(hsva);
  return hsla;
};

export const RGBAtoCMYK = (rgba) => {
  const r = rgba.r / 255;
  const g = rgba.g / 255;
  const b = rgba.b / 255;

  let k = 1 - Math.max(r, g, b);
  let c = (1 - r - k) / (1 - k);
  let m = (1 - g - k) / (1 - k);
  let y = (1 - b - k) / (1 - k);

  c = Math.round(c * 100);
  m = Math.round(m * 100);
  y = Math.round(y * 100);
  k = Math.round(k * 100);

  return { c, m, y, k };
};

export const toString = (format, color) => {
  let result;

  switch (format) {
    case 'rgba':
      result = `rgba(${color.r},${color.g},${color.b},${color.a})`;
      break;
    case 'hsva':
      result = `hsva(${color.h},${color.s},${color.v},${color.a})`;
      break;
    case 'hsla':
      result = `hsla(${color.h},${color.s},${color.l},${color.a})`;
      break;
    case 'hex':
      result = color;
      break;
    case 'cmyk':
      result = `cmyk(${color.c},${color.m},${color.y},${color.k})`;
      break;
    default:
      break;
  }

  return result;
};

export const colorFromString = (color) => {
  let format = color.match(/^(#|cmyk|(rgb|hsl|hsv)a?)/)[0];

  if (format === '#') {
    return { format, color };
  }

  if (!format.match(/a/)) {
    format += 'a';
  }

  const result = {};
  const splitedFormat = format.split('');
  const valueArr = color.match(/\d+\.?(\d+)?/g);

  result.format = format;
  result[splitedFormat[0]] = Number(valueArr[0]);
  result[splitedFormat[1]] = Number(valueArr[1]);
  result[splitedFormat[2]] = Number(valueArr[2]);
  result[splitedFormat[3]] = Number(valueArr[3]) || 1;

  return result;
};

export const fromRgba = (rgba) => {
  const hsla = RGBAtoHSLA(rgba);
  const hsva = RGBAtoHSVA(rgba);
  const hex = RGBAtoHex(rgba);
  const cmyk = RGBAtoCMYK(rgba);

  return { rgba, hsla, hsva, hex, cmyk };
};

export const fromHsla = (hsla) => {
  const rgba = hslaToRgba(hsla);
  const hsva = HSLAtoHSVA(hsla);
  const hex = RGBAtoHex(rgba);
  const cmyk = RGBAtoCMYK(rgba);

  return { rgba, hsla, hsva, hex, cmyk };
};

export const fromHsva = (hsva) => {
  const rgba = HSVAtoRGBA(hsva);
  const hsla = HSVAtoHSLA(hsva);
  const hex = RGBAtoHex(rgba);
  const cmyk = RGBAtoCMYK(rgba);

  return { rgba, hsla, hsva, hex, cmyk };
};

export const fromCmyk = (cmyk) => {
  const rgba = CMYKtoRGBA(cmyk);
  const hsva = RGBAtoHSVA(rgba);
  const hsla = RGBAtoHSLA(rgba);
  const hex = RGBAtoHex(rgba);

  return { rgba, hsla, hsva, hex, cmyk };
};

export const fromHex = (hex) => {
  const rgba = HEXtoRGBA(hex);
  const hsva = RGBAtoHSVA(rgba);
  const hsla = RGBAtoHSLA(rgba);
  const cmyk = RGBAtoCMYK(rgba);

  return { rgba, hsla, hsva, hex, cmyk };
};

export const getColors = (format, color) => {
  let colors;
  switch (format) {
    case 'rgba':
      colors = fromRgba(color);
      break;
    case 'hsla':
      colors = fromHsla(color);
      break;
    case 'hsva':
      colors = fromHsva(color);
      break;
    case '#':
      colors = fromHex(color.color);
      break;
    case 'hex':
      colors = fromHex(color);
      break;
    case 'cmyk':
      colors = fromCmyk(color);
      break;
    default:
      break;
  }

  return colors;
};
