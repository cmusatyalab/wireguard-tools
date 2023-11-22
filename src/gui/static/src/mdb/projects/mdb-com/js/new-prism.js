!(function (n) {
  var r = {};
  function a(e) {
    var t;
    return (
      r[e] ||
      ((t = r[e] = { i: e, l: !1, exports: {} }),
      n[e].call(t.exports, t, t.exports, a),
      (t.l = !0),
      t)
    ).exports;
  }
  (a.m = n),
    (a.c = r),
    (a.d = function (e, t, n) {
      a.o(e, t) || Object.defineProperty(e, t, { enumerable: !0, get: n });
    }),
    (a.r = function (e) {
      'undefined' != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' }),
        Object.defineProperty(e, '__esModule', { value: !0 });
    }),
    (a.t = function (t, e) {
      if ((1 & e && (t = a(t)), 8 & e)) return t;
      if (4 & e && 'object' == typeof t && t && t.__esModule) return t;
      var n = Object.create(null);
      if (
        (a.r(n),
        Object.defineProperty(n, 'default', { enumerable: !0, value: t }),
        2 & e && 'string' != typeof t)
      )
        for (var r in t)
          a.d(
            n,
            r,
            function (e) {
              return t[e];
            }.bind(null, r)
          );
      return n;
    }),
    (a.n = function (e) {
      var t =
        e && e.__esModule
          ? function () {
              return e.default;
            }
          : function () {
              return e;
            };
      return a.d(t, 'a', t), t;
    }),
    (a.o = function (e, t) {
      return Object.prototype.hasOwnProperty.call(e, t);
    }),
    (a.p = ''),
    a((a.s = 68));
})([
  function (e, t) {
    e.exports = function (e) {
      try {
        return !!e();
      } catch (e) {
        return !0;
      }
    };
  },
  function (e, t, n) {
    var n = n(21),
      r = Function.prototype,
      a = r.call,
      r = n && r.bind.bind(a, a);
    e.exports = n
      ? r
      : function (e) {
          return function () {
            return a.apply(e, arguments);
          };
        };
  },
  function (e, t, n) {
    var n = n(39),
      r = n.all;
    e.exports = n.IS_HTMLDDA
      ? function (e) {
          return 'function' == typeof e || e === r;
        }
      : function (e) {
          return 'function' == typeof e;
        };
  },
  function (n, e, t) {
    !function (e) {
      function t(e) {
        return e && e.Math == Math && e;
      }
      n.exports =
        t('object' == typeof globalThis && globalThis) ||
        t('object' == typeof window && window) ||
        t('object' == typeof self && self) ||
        t('object' == typeof e && e) ||
        (function () {
          return this;
        })() ||
        Function('return this')();
    }.call(this, t(36));
  },
  function (e, t, n) {
    n = n(0);
    e.exports = !n(function () {
      return (
        7 !=
        Object.defineProperty({}, 1, {
          get: function () {
            return 7;
          },
        })[1]
      );
    });
  },
  function (e, t, n) {
    var r = n(1),
      a = n(29),
      o = r({}.hasOwnProperty);
    e.exports =
      Object.hasOwn ||
      function (e, t) {
        return o(a(e), t);
      };
  },
  function (e, t, n) {
    var r = n(3),
      a = n(26),
      o = n(5),
      i = n(47),
      s = n(42),
      u = n(41),
      l = a('wks'),
      c = r.Symbol,
      p = c && c.for,
      g = u ? c : (c && c.withoutSetter) || i;
    e.exports = function (e) {
      var t;
      return (
        (o(l, e) && (s || 'string' == typeof l[e])) ||
          ((t = 'Symbol.' + e), s && o(c, e) ? (l[e] = c[e]) : (l[e] = (u && p ? p : g)(t))),
        l[e]
      );
    };
  },
  function (e, t, n) {
    var r = n(9),
      a = String,
      o = TypeError;
    e.exports = function (e) {
      if (r(e)) return e;
      throw o(a(e) + ' is not an object');
    };
  },
  function (e, t, n) {
    var n = n(21),
      r = Function.prototype.call;
    e.exports = n
      ? r.bind(r)
      : function () {
          return r.apply(r, arguments);
        };
  },
  function (e, t, n) {
    var r = n(2),
      n = n(39),
      a = n.all;
    e.exports = n.IS_HTMLDDA
      ? function (e) {
          return 'object' == typeof e ? null !== e : r(e) || e === a;
        }
      : function (e) {
          return 'object' == typeof e ? null !== e : r(e);
        };
  },
  function (e, t, n) {
    var r = n(4),
      a = n(48),
      o = n(50),
      i = n(7),
      s = n(24),
      u = TypeError,
      l = Object.defineProperty,
      c = Object.getOwnPropertyDescriptor,
      p = 'enumerable',
      g = 'configurable',
      d = 'writable';
    t.f = r
      ? o
        ? function (e, t, n) {
            var r;
            return (
              i(e),
              (t = s(t)),
              i(n),
              'function' == typeof e &&
                'prototype' === t &&
                'value' in n &&
                d in n &&
                !n[d] &&
                (r = c(e, t)) &&
                r[d] &&
                ((e[t] = n.value),
                (n = {
                  configurable: (g in n ? n : r)[g],
                  enumerable: (p in n ? n : r)[p],
                  writable: !1,
                })),
              l(e, t, n)
            );
          }
        : l
      : function (e, t, n) {
          if ((i(e), (t = s(t)), i(n), a))
            try {
              return l(e, t, n);
            } catch (e) {}
          if ('get' in n || 'set' in n) throw u('Accessors not supported');
          return 'value' in n && (e[t] = n.value), e;
        };
  },
  function (e, t, n) {
    var r = n(83),
      a = String;
    e.exports = function (e) {
      if ('Symbol' === r(e)) throw TypeError('Cannot convert a Symbol value to a string');
      return a(e);
    };
  },
  function (e, t, n) {
    var n = n(1),
      r = n({}.toString),
      a = n(''.slice);
    e.exports = function (e) {
      return a(r(e), 8, -1);
    };
  },
  function (e, t, n) {
    var r = n(23),
      a = TypeError;
    e.exports = function (e) {
      if (r(e)) throw a("Can't call method on " + e);
      return e;
    };
  },
  function (e, t, n) {
    var r = n(3),
      a = n(2);
    e.exports = function (e, t) {
      return arguments.length < 2 ? ((n = r[e]), a(n) ? n : void 0) : r[e] && r[e][t];
      var n;
    };
  },
  function (e, t, n) {
    var r = n(71),
      a = n(13);
    e.exports = function (e) {
      return r(a(e));
    };
  },
  function (e, t, n) {
    n = n(14);
    e.exports = n('navigator', 'userAgent') || '';
  },
  function (e, t, n) {
    var r = n(4),
      a = n(10),
      o = n(22);
    e.exports = r
      ? function (e, t, n) {
          return a.f(e, t, o(1, n));
        }
      : function (e, t, n) {
          return (e[t] = n), e;
        };
  },
  function (e, t, n) {
    var r = n(81);
    e.exports = function (e) {
      e = +e;
      return e != e || 0 == e ? 0 : r(e);
    };
  },
  ,
  function (e, t, n) {
    var l = n(3),
      c = n(38).f,
      p = n(17),
      g = n(30),
      d = n(28),
      f = n(78),
      h = n(57);
    e.exports = function (e, t) {
      var n,
        r,
        a,
        o = e.target,
        i = e.global,
        s = e.stat,
        u = i ? l : s ? l[o] || d(o, {}) : (l[o] || {}).prototype;
      if (u)
        for (n in t) {
          if (
            ((r = t[n]),
            (a = e.dontCallGetSet ? (a = c(u, n)) && a.value : u[n]),
            !h(i ? n : o + (s ? '.' : '#') + n, e.forced) && void 0 !== a)
          ) {
            if (typeof r == typeof a) continue;
            f(r, a);
          }
          (e.sham || (a && a.sham)) && p(r, 'sham', !0), g(u, n, r, e);
        }
    };
  },
  function (e, t, n) {
    n = n(0);
    e.exports = !n(function () {
      var e = function () {}.bind();
      return 'function' != typeof e || e.hasOwnProperty('prototype');
    });
  },
  function (e, t) {
    e.exports = function (e, t) {
      return { enumerable: !(1 & e), configurable: !(2 & e), writable: !(4 & e), value: t };
    };
  },
  function (e, t) {
    e.exports = function (e) {
      return null == e;
    };
  },
  function (e, t, n) {
    var r = n(72),
      a = n(40);
    e.exports = function (e) {
      e = r(e, 'string');
      return a(e) ? e : e + '';
    };
  },
  function (e, t, n) {
    n = n(1);
    e.exports = n({}.isPrototypeOf);
  },
  function (e, t, n) {
    var r = n(74),
      a = n(27);
    (e.exports = function (e, t) {
      return a[e] || (a[e] = void 0 !== t ? t : {});
    })('versions', []).push({
      version: '3.26.1',
      mode: r ? 'pure' : 'global',
      copyright: '© 2014-2022 Denis Pushkarev (zloirock.ru)',
      license: 'https://github.com/zloirock/core-js/blob/v3.26.1/LICENSE',
      source: 'https://github.com/zloirock/core-js',
    });
  },
  function (e, t, n) {
    var r = n(3),
      n = n(28),
      a = '__core-js_shared__',
      r = r[a] || n(a, {});
    e.exports = r;
  },
  function (e, t, n) {
    var r = n(3),
      a = Object.defineProperty;
    e.exports = function (t, n) {
      try {
        a(r, t, { value: n, configurable: !0, writable: !0 });
      } catch (e) {
        r[t] = n;
      }
      return n;
    };
  },
  function (e, t, n) {
    var r = n(13),
      a = Object;
    e.exports = function (e) {
      return a(r(e));
    };
  },
  function (e, t, n) {
    var i = n(2),
      s = n(10),
      u = n(75),
      l = n(28);
    e.exports = function (e, t, n, r) {
      var a = (r = r || {}).enumerable,
        o = void 0 !== r.name ? r.name : t;
      if ((i(n) && u(n, o, r), r.global)) a ? (e[t] = n) : l(t, n);
      else {
        try {
          r.unsafe ? e[t] && (a = !0) : delete e[t];
        } catch (e) {}
        a
          ? (e[t] = n)
          : s.f(e, t, {
              value: n,
              enumerable: !1,
              configurable: !r.nonConfigurable,
              writable: !r.nonWritable,
            });
      }
      return e;
    };
  },
  function (e, t, n) {
    var r,
      a,
      o,
      i,
      s = n(77),
      u = n(3),
      l = n(9),
      c = n(17),
      p = n(5),
      g = n(27),
      d = n(52),
      n = n(32),
      f = 'Object already initialized',
      h = u.TypeError,
      u = u.WeakMap,
      m =
        s || g.state
          ? (((o = g.state || (g.state = new u())).get = o.get),
            (o.has = o.has),
            (o.set = o.set),
            (r = function (e, t) {
              if (o.has(e)) throw h(f);
              return (t.facade = e), o.set(e, t), t;
            }),
            (a = function (e) {
              return o.get(e) || {};
            }),
            function (e) {
              return o.has(e);
            })
          : ((n[(i = d('state'))] = !0),
            (r = function (e, t) {
              if (p(e, i)) throw h(f);
              return (t.facade = e), c(e, i, t), t;
            }),
            (a = function (e) {
              return p(e, i) ? e[i] : {};
            }),
            function (e) {
              return p(e, i);
            });
    e.exports = {
      set: r,
      get: a,
      has: m,
      enforce: function (e) {
        return m(e) ? a(e) : r(e, {});
      },
      getterFor: function (t) {
        return function (e) {
          if (l(e) && (e = a(e)).type === t) return e;
          throw h('Incompatible receiver, ' + t + ' required');
        };
      },
    };
  },
  function (e, t) {
    e.exports = {};
  },
  function (e, t, n) {
    var r = n(56);
    e.exports = function (e) {
      return r(e.length);
    };
  },
  function (e, t) {
    e.exports = [
      'constructor',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'toLocaleString',
      'toString',
      'valueOf',
    ];
  },
  function (e, t, n) {
    'use strict';
    var f = n(8),
      r = n(1),
      h = n(11),
      m = n(58),
      a = n(59),
      o = n(26),
      b = n(85),
      y = n(31).get,
      i = n(60),
      n = n(61),
      v = o('native-string-replace', String.prototype.replace),
      x = RegExp.prototype.exec,
      k = x,
      w = r(''.charAt),
      S = r(''.indexOf),
      _ = r(''.replace),
      A = r(''.slice),
      E = ((o = /b*/g), f(x, (r = /a/), 'a'), f(x, o, 'a'), 0 !== r.lastIndex || 0 !== o.lastIndex),
      j = a.BROKEN_CARET,
      O = void 0 !== /()??/.exec('')[1];
    (E || O || j || i || n) &&
      (k = function (e) {
        var t,
          n,
          r,
          a,
          o,
          i,
          s = this,
          u = y(s),
          e = h(e),
          l = u.raw;
        if (l) return (l.lastIndex = s.lastIndex), (p = f(k, l, e)), (s.lastIndex = l.lastIndex), p;
        var c = u.groups,
          l = j && s.sticky,
          p = f(m, s),
          u = s.source,
          g = 0,
          d = e;
        if (
          (l &&
            ((p = _(p, 'y', '')),
            -1 === S(p, 'g') && (p += 'g'),
            (d = A(e, s.lastIndex)),
            0 < s.lastIndex &&
              (!s.multiline || (s.multiline && '\n' !== w(e, s.lastIndex - 1))) &&
              ((u = '(?: ' + u + ')'), (d = ' ' + d), g++),
            (t = new RegExp('^(?:' + u + ')', p))),
          O && (t = new RegExp('^' + u + '$(?!\\s)', p)),
          E && (n = s.lastIndex),
          (r = f(x, l ? t : s, d)),
          l
            ? r
              ? ((r.input = A(r.input, g)),
                (r[0] = A(r[0], g)),
                (r.index = s.lastIndex),
                (s.lastIndex += r[0].length))
              : (s.lastIndex = 0)
            : E && r && (s.lastIndex = s.global ? r.index + r[0].length : n),
          O &&
            r &&
            1 < r.length &&
            f(v, r[0], t, function () {
              for (a = 1; a < arguments.length - 2; a++) void 0 === arguments[a] && (r[a] = void 0);
            }),
          r && c)
        )
          for (r.groups = o = b(null), a = 0; a < c.length; a++) o[(i = c[a])[0]] = r[i[1]];
        return r;
      }),
      (e.exports = k);
  },
  function (e, t) {
    var n = (function () {
      return this;
    })();
    try {
      n = n || new Function('return this')();
    } catch (e) {
      'object' == typeof window && (n = window);
    }
    e.exports = n;
  },
  function (e, t, n) {
    'use strict';
    var r = n(20),
      n = n(35);
    r({ target: 'RegExp', proto: !0, forced: /./.exec !== n }, { exec: n });
  },
  function (e, t, n) {
    var r = n(4),
      a = n(8),
      o = n(70),
      i = n(22),
      s = n(15),
      u = n(24),
      l = n(5),
      c = n(48),
      p = Object.getOwnPropertyDescriptor;
    t.f = r
      ? p
      : function (e, t) {
          if (((e = s(e)), (t = u(t)), c))
            try {
              return p(e, t);
            } catch (e) {}
          if (l(e, t)) return i(!a(o.f, e, t), e[t]);
        };
  },
  function (e, t) {
    var n = 'object' == typeof document && document.all;
    e.exports = { all: n, IS_HTMLDDA: void 0 === n && void 0 !== n };
  },
  function (e, t, n) {
    var r = n(14),
      a = n(2),
      o = n(25),
      n = n(41),
      i = Object;
    e.exports = n
      ? function (e) {
          return 'symbol' == typeof e;
        }
      : function (e) {
          var t = r('Symbol');
          return a(t) && o(t.prototype, i(e));
        };
  },
  function (e, t, n) {
    n = n(42);
    e.exports = n && !Symbol.sham && 'symbol' == typeof Symbol.iterator;
  },
  function (e, t, n) {
    var r = n(43),
      n = n(0);
    e.exports =
      !!Object.getOwnPropertySymbols &&
      !n(function () {
        var e = Symbol();
        return !String(e) || !(Object(e) instanceof Symbol) || (!Symbol.sham && r && r < 41);
      });
  },
  function (e, t, n) {
    var r,
      a,
      o = n(3),
      n = n(16),
      i = o.process,
      o = o.Deno,
      i = (i && i.versions) || (o && o.version),
      o = i && i.v8;
    !(a = o ? (0 < (r = o.split('.'))[0] && r[0] < 4 ? 1 : +(r[0] + r[1])) : a) &&
      n &&
      (!(r = n.match(/Edge\/(\d+)/)) || 74 <= r[1]) &&
      (r = n.match(/Chrome\/(\d+)/)) &&
      (a = +r[1]),
      (e.exports = a);
  },
  function (e, t, n) {
    var r = n(45),
      a = n(23);
    e.exports = function (e, t) {
      e = e[t];
      return a(e) ? void 0 : r(e);
    };
  },
  function (e, t, n) {
    var r = n(2),
      a = n(46),
      o = TypeError;
    e.exports = function (e) {
      if (r(e)) return e;
      throw o(a(e) + ' is not a function');
    };
  },
  function (e, t) {
    var n = String;
    e.exports = function (e) {
      try {
        return n(e);
      } catch (e) {
        return 'Object';
      }
    };
  },
  function (e, t, n) {
    var n = n(1),
      r = 0,
      a = Math.random(),
      o = n((1).toString);
    e.exports = function (e) {
      return 'Symbol(' + (void 0 === e ? '' : e) + ')_' + o(++r + a, 36);
    };
  },
  function (e, t, n) {
    var r = n(4),
      a = n(0),
      o = n(49);
    e.exports =
      !r &&
      !a(function () {
        return (
          7 !=
          Object.defineProperty(o('div'), 'a', {
            get: function () {
              return 7;
            },
          }).a
        );
      });
  },
  function (e, t, n) {
    var r = n(3),
      n = n(9),
      a = r.document,
      o = n(a) && n(a.createElement);
    e.exports = function (e) {
      return o ? a.createElement(e) : {};
    };
  },
  function (e, t, n) {
    var r = n(4),
      n = n(0);
    e.exports =
      r &&
      n(function () {
        return (
          42 !=
          Object.defineProperty(function () {}, 'prototype', { value: 42, writable: !1 }).prototype
        );
      });
  },
  function (e, t, n) {
    var r = n(4),
      n = n(5),
      a = Function.prototype,
      o = r && Object.getOwnPropertyDescriptor,
      n = n(a, 'name'),
      i = n && 'something' === function () {}.name,
      r = n && (!r || o(a, 'name').configurable);
    e.exports = { EXISTS: n, PROPER: i, CONFIGURABLE: r };
  },
  function (e, t, n) {
    var r = n(26),
      a = n(47),
      o = r('keys');
    e.exports = function (e) {
      return o[e] || (o[e] = a(e));
    };
  },
  function (e, t, n) {
    var r = n(54),
      a = n(34).concat('length', 'prototype');
    t.f =
      Object.getOwnPropertyNames ||
      function (e) {
        return r(e, a);
      };
  },
  function (e, t, n) {
    var r = n(1),
      i = n(5),
      s = n(15),
      u = n(80).indexOf,
      l = n(32),
      c = r([].push);
    e.exports = function (e, t) {
      var n,
        r = s(e),
        a = 0,
        o = [];
      for (n in r) !i(l, n) && i(r, n) && c(o, n);
      for (; t.length > a; ) !i(r, (n = t[a++])) || ~u(o, n) || c(o, n);
      return o;
    };
  },
  function (e, t, n) {
    var r = n(18),
      a = Math.max,
      o = Math.min;
    e.exports = function (e, t) {
      e = r(e);
      return e < 0 ? a(e + t, 0) : o(e, t);
    };
  },
  function (e, t, n) {
    var r = n(18),
      a = Math.min;
    e.exports = function (e) {
      return 0 < e ? a(r(e), 9007199254740991) : 0;
    };
  },
  function (e, t, n) {
    function r(e, t) {
      return (e = u[s(e)]) == c || (e != l && (o(t) ? a(t) : !!t));
    }
    var a = n(0),
      o = n(2),
      i = /#|\.prototype\./,
      s = (r.normalize = function (e) {
        return String(e).replace(i, '.').toLowerCase();
      }),
      u = (r.data = {}),
      l = (r.NATIVE = 'N'),
      c = (r.POLYFILL = 'P');
    e.exports = r;
  },
  function (e, t, n) {
    'use strict';
    var r = n(7);
    e.exports = function () {
      var e = r(this),
        t = '';
      return (
        e.hasIndices && (t += 'd'),
        e.global && (t += 'g'),
        e.ignoreCase && (t += 'i'),
        e.multiline && (t += 'm'),
        e.dotAll && (t += 's'),
        e.unicode && (t += 'u'),
        e.unicodeSets && (t += 'v'),
        e.sticky && (t += 'y'),
        t
      );
    };
  },
  function (e, t, n) {
    var r = n(0),
      a = n(3).RegExp,
      n = r(function () {
        var e = a('a', 'y');
        return (e.lastIndex = 2), null != e.exec('abcd');
      }),
      o =
        n ||
        r(function () {
          return !a('a', 'y').sticky;
        }),
      r =
        n ||
        r(function () {
          var e = a('^r', 'gy');
          return (e.lastIndex = 2), null != e.exec('str');
        });
    e.exports = { BROKEN_CARET: r, MISSED_STICKY: o, UNSUPPORTED_Y: n };
  },
  function (e, t, n) {
    var r = n(0),
      a = n(3).RegExp;
    e.exports = r(function () {
      var e = a('.', 's');
      return !(e.dotAll && e.exec('\n') && 's' === e.flags);
    });
  },
  function (e, t, n) {
    var r = n(0),
      a = n(3).RegExp;
    e.exports = r(function () {
      var e = a('(?<a>b)', 'g');
      return 'b' !== e.exec('b').groups.a || 'bc' !== 'b'.replace(e, '$<a>c');
    });
  },
  function (e, t) {
    e.exports = '\t\n\v\f\r                　\u2028\u2029\ufeff';
  },
  ,
  ,
  ,
  ,
  ,
  function (e, t, te) {
    'use strict';
    te.r(t),
      function (e, t) {
        te(37), te(89), te(97), te(105), te(108);
        var s,
          R,
          P,
          a,
          o,
          n,
          N,
          M,
          I,
          i,
          r,
          u,
          l,
          c,
          z,
          p,
          g,
          d,
          f,
          h,
          m,
          b,
          D,
          q,
          G,
          y,
          H,
          W,
          v,
          x,
          k,
          w,
          S,
          _,
          A =
            'undefined' != typeof window
              ? window
              : 'undefined' != typeof WorkerGlobalScope && self instanceof WorkerGlobalScope
              ? self
              : {},
          E =
            ((s = /\blang(?:uage)?-([\w-]+)\b/i),
            (R = 0),
            (P = A.Prism =
              {
                manual: A.Prism && A.Prism.manual,
                disableWorkerMessageHandler: A.Prism && A.Prism.disableWorkerMessageHandler,
                util: {
                  encode: function (e) {
                    return e instanceof a
                      ? new a(e.type, P.util.encode(e.content), e.alias)
                      : 'Array' === P.util.type(e)
                      ? e.map(P.util.encode)
                      : e
                          .replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/\u00a0/g, ' ');
                  },
                  type: function (e) {
                    return Object.prototype.toString.call(e).match(/\[object (\w+)\]/)[1];
                  },
                  objId: function (e) {
                    return e.__id || Object.defineProperty(e, '__id', { value: ++R }), e.__id;
                  },
                  clone: function (e, n) {
                    var t = P.util.type(e);
                    switch (((n = n || {}), t)) {
                      case 'Object':
                        if (n[P.util.objId(e)]) return n[P.util.objId(e)];
                        var r,
                          a = {};
                        for (r in ((n[P.util.objId(e)] = a), e))
                          e.hasOwnProperty(r) && (a[r] = P.util.clone(e[r], n));
                        return a;
                      case 'Array':
                        return n[P.util.objId(e)]
                          ? n[P.util.objId(e)]
                          : ((a = []),
                            (n[P.util.objId(e)] = a),
                            e.forEach(function (e, t) {
                              a[t] = P.util.clone(e, n);
                            }),
                            a);
                    }
                    return e;
                  },
                },
                languages: {
                  extend: function (e, t) {
                    var n,
                      r = P.util.clone(P.languages[e]);
                    for (n in t) r[n] = t[n];
                    return r;
                  },
                  insertBefore: function (n, e, t, r) {
                    var a = (r = r || P.languages)[n];
                    if (2 == arguments.length) {
                      for (var o in (t = e)) t.hasOwnProperty(o) && (a[o] = t[o]);
                      return a;
                    }
                    var i,
                      s = {};
                    for (i in a)
                      if (a.hasOwnProperty(i)) {
                        if (i == e) for (var o in t) t.hasOwnProperty(o) && (s[o] = t[o]);
                        s[i] = a[i];
                      }
                    return (
                      P.languages.DFS(P.languages, function (e, t) {
                        t === r[n] && e != n && (this[e] = s);
                      }),
                      (r[n] = s)
                    );
                  },
                  DFS: function (e, t, n, r) {
                    for (var a in ((r = r || {}), e))
                      e.hasOwnProperty(a) &&
                        (t.call(e, a, e[a], n || a),
                        'Object' !== P.util.type(e[a]) || r[P.util.objId(e[a])]
                          ? 'Array' !== P.util.type(e[a]) ||
                            r[P.util.objId(e[a])] ||
                            ((r[P.util.objId(e[a])] = !0), P.languages.DFS(e[a], t, a, r))
                          : ((r[P.util.objId(e[a])] = !0), P.languages.DFS(e[a], t, null, r)));
                  },
                },
                plugins: {},
                highlightAll: function (e, t) {
                  P.highlightAllUnder(document, e, t);
                },
                highlightAllUnder: function (e, t, n) {
                  for (
                    var r,
                      a = {
                        callback: n,
                        selector:
                          'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code',
                      },
                      o =
                        (P.hooks.run('before-highlightall', a),
                        a.elements || e.querySelectorAll(a.selector)),
                      i = 0;
                    (r = o[i++]);

                  )
                    P.highlightElement(r, !0 === t, a.callback);
                },
                highlightElement: function (e, t, n) {
                  for (var r, a = e; a && !s.test(a.className); ) a = a.parentNode;
                  a &&
                    ((o = (a.className.match(s) || [, ''])[1].toLowerCase()), (r = P.languages[o])),
                    (e.className =
                      e.className.replace(s, '').replace(/\s+/g, ' ') + ' language-' + o),
                    e.parentNode &&
                      ((a = e.parentNode), /pre/i.test(a.nodeName)) &&
                      (a.className =
                        a.className.replace(s, '').replace(/\s+/g, ' ') + ' language-' + o);
                  var o,
                    i = { element: e, language: o, grammar: r, code: e.textContent };
                  P.hooks.run('before-sanity-check', i),
                    i.code && i.grammar
                      ? (P.hooks.run('before-highlight', i),
                        t && A.Worker
                          ? (((o = new Worker(P.filename)).onmessage = function (e) {
                              (i.highlightedCode = e.data),
                                P.hooks.run('before-insert', i),
                                (i.element.innerHTML = i.highlightedCode),
                                n && n.call(i.element),
                                P.hooks.run('after-highlight', i),
                                P.hooks.run('complete', i);
                            }),
                            o.postMessage(
                              JSON.stringify({
                                language: i.language,
                                code: i.code,
                                immediateClose: !0,
                              })
                            ))
                          : ((i.highlightedCode = P.highlight(i.code, i.grammar, i.language)),
                            P.hooks.run('before-insert', i),
                            (i.element.innerHTML = i.highlightedCode),
                            n && n.call(e),
                            P.hooks.run('after-highlight', i),
                            P.hooks.run('complete', i)))
                      : (i.code &&
                          (P.hooks.run('before-highlight', i),
                          (i.element.textContent = i.code),
                          P.hooks.run('after-highlight', i)),
                        P.hooks.run('complete', i));
                },
                highlight: function (e, t, n) {
                  e = { code: e, grammar: t, language: n };
                  return (
                    P.hooks.run('before-tokenize', e),
                    (e.tokens = P.tokenize(e.code, e.grammar)),
                    P.hooks.run('after-tokenize', e),
                    a.stringify(P.util.encode(e.tokens), e.language)
                  );
                },
                matchGrammar: function (e, t, n, r, a, o, i) {
                  var s,
                    u = P.Token;
                  for (s in n)
                    if (n.hasOwnProperty(s) && n[s]) {
                      if (s == i) return;
                      for (
                        var l = n[s], l = 'Array' === P.util.type(l) ? l : [l], c = 0;
                        c < l.length;
                        ++c
                      ) {
                        var p,
                          g = (b = l[c]).inside,
                          d = !!b.lookbehind,
                          f = !!b.greedy,
                          h = 0,
                          m = b.alias;
                        f &&
                          !b.pattern.global &&
                          ((p = b.pattern.toString().match(/[imuy]*$/)[0]),
                          (b.pattern = RegExp(b.pattern.source, p + 'g')));
                        for (
                          var b = b.pattern || b, y = r, v = a;
                          y < t.length;
                          v += t[y].length, ++y
                        ) {
                          var x = t[y];
                          if (t.length > e.length) return;
                          if (!(x instanceof u)) {
                            if (f && y != t.length - 1) {
                              if (((b.lastIndex = v), !(E = b.exec(e)))) break;
                              for (
                                var k = E.index + (d ? E[1].length : 0),
                                  w = E.index + E[0].length,
                                  S = y,
                                  _ = v,
                                  A = t.length;
                                S < A && (_ < w || (!t[S].type && !t[S - 1].greedy));
                                ++S
                              )
                                (_ += t[S].length) <= k && (++y, (v = _));
                              if (t[y] instanceof u) continue;
                              (j = S - y), (x = e.slice(v, _)), (E.index -= v);
                            } else {
                              b.lastIndex = 0;
                              var E = b.exec(x),
                                j = 1;
                            }
                            if (E) {
                              d && (h = E[1] ? E[1].length : 0);
                              var w = (k = E.index + h) + (E = E[0].slice(h)).length,
                                O = x.slice(0, k),
                                x = x.slice(w),
                                C = [y, j],
                                O =
                                  (O && (++y, (v += O.length), C.push(O)),
                                  new u(s, g ? P.tokenize(E, g) : E, m, E, f));
                              if (
                                (C.push(O),
                                x && C.push(x),
                                Array.prototype.splice.apply(t, C),
                                1 != j && P.matchGrammar(e, t, n, y, v, !0, s),
                                o)
                              )
                                break;
                            } else if (o) break;
                          }
                        }
                      }
                    }
                },
                tokenize: function (e, t, n) {
                  var r = [e],
                    a = t.rest;
                  if (a) {
                    for (var o in a) t[o] = a[o];
                    delete t.rest;
                  }
                  return P.matchGrammar(e, r, t, 0, 0, !1), r;
                },
                hooks: {
                  all: {},
                  add: function (e, t) {
                    var n = P.hooks.all;
                    (n[e] = n[e] || []), n[e].push(t);
                  },
                  run: function (e, t) {
                    var n = P.hooks.all[e];
                    if (n && n.length) for (var r, a = 0; (r = n[a++]); ) r(t);
                  },
                },
              }),
            ((a = P.Token =
              function (e, t, n, r, a) {
                (this.type = e),
                  (this.content = t),
                  (this.alias = n),
                  (this.length = 0 | (r || '').length),
                  (this.greedy = !!a);
              }).stringify = function (t, n, e) {
              var r;
              return 'string' == typeof t
                ? t
                : 'Array' === P.util.type(t)
                ? t
                    .map(function (e) {
                      return a.stringify(e, n, t);
                    })
                    .join('')
                : ((r = {
                    type: t.type,
                    content: a.stringify(t.content, n, e),
                    tag: 'span',
                    classes: ['token', t.type],
                    attributes: {},
                    language: n,
                    parent: e,
                  }),
                  t.alias &&
                    ((e = 'Array' === P.util.type(t.alias) ? t.alias : [t.alias]),
                    Array.prototype.push.apply(r.classes, e)),
                  P.hooks.run('wrap', r),
                  (e = Object.keys(r.attributes)
                    .map(function (e) {
                      return e + '="' + (r.attributes[e] || '').replace(/"/g, '&quot;') + '"';
                    })
                    .join(' ')),
                  '<' +
                    r.tag +
                    ' class="' +
                    r.classes.join(' ') +
                    '"' +
                    (e ? ' ' + e : '') +
                    '>' +
                    r.content +
                    '</' +
                    r.tag +
                    '>');
            }),
            A.document
              ? (n =
                  document.currentScript ||
                  [].slice.call(document.getElementsByTagName('script')).pop()) &&
                ((P.filename = n.src),
                P.manual ||
                  n.hasAttribute('data-manual') ||
                  ('loading' !== document.readyState
                    ? window.requestAnimationFrame
                      ? window.requestAnimationFrame(P.highlightAll)
                      : window.setTimeout(P.highlightAll, 16)
                    : document.addEventListener('DOMContentLoaded', P.highlightAll)))
              : A.addEventListener &&
                !P.disableWorkerMessageHandler &&
                A.addEventListener(
                  'message',
                  function (e) {
                    var e = JSON.parse(e.data),
                      t = e.language,
                      n = e.code,
                      e = e.immediateClose;
                    A.postMessage(P.highlight(n, P.languages[t], t)), e && A.close();
                  },
                  !1
                ),
            A.Prism);
        function j(e, t) {
          return (
            (e = e
              .replace(/<S>/g, function () {
                return N;
              })
              .replace(/<BRACES>/g, function () {
                return M;
              })
              .replace(/<SPREAD>/g, function () {
                return I;
              })),
            RegExp(e, t)
          );
        }
        function U(e) {
          for (var t = [], n = 0; n < e.length; n++) {
            var r = e[n],
              a = !1;
            'string' != typeof r &&
              ('tag' === r.type && r.content[0] && 'tag' === r.content[0].type
                ? '</' === r.content[0].content[0].content
                  ? 0 < t.length &&
                    t[t.length - 1].tagName === i(r.content[0].content[1]) &&
                    t.pop()
                  : '/>' !== r.content[r.content.length - 1].content &&
                    t.push({ tagName: i(r.content[0].content[1]), openedBraces: 0 })
                : 0 < t.length && 'punctuation' === r.type && '{' === r.content
                ? t[t.length - 1].openedBraces++
                : 0 < t.length &&
                  0 < t[t.length - 1].openedBraces &&
                  'punctuation' === r.type &&
                  '}' === r.content
                ? t[t.length - 1].openedBraces--
                : (a = !0)),
              (a || 'string' == typeof r) &&
                0 < t.length &&
                0 === t[t.length - 1].openedBraces &&
                ((a = i(r)),
                n < e.length - 1 &&
                  ('string' == typeof e[n + 1] || 'plain-text' === e[n + 1].type) &&
                  ((a += i(e[n + 1])), e.splice(n + 1, 1)),
                0 < n &&
                  ('string' == typeof e[n - 1] || 'plain-text' === e[n - 1].type) &&
                  ((a = i(e[n - 1]) + a), e.splice(n - 1, 1), n--),
                (e[n] = new o.Token('plain-text', a, null, a))),
              r.content && 'string' != typeof r.content && U(r.content);
          }
        }
        function O(e, n) {
          return e.replace(/<<(\d+)>>/g, function (e, t) {
            return '(?:' + n[+t] + ')';
          });
        }
        function C(e, t, n) {
          return RegExp(O(e, t), n || '');
        }
        function T(e, t) {
          for (var n = 0; n < t; n++)
            e = e.replace(/<<self>>/g, function () {
              return '(?:' + e + ')';
            });
          return e.replace(/<<self>>/g, '[^\\s\\S]');
        }
        function B(e) {
          return '\\b(?:' + e.trim().replace(/ /g, '|') + ')\\b';
        }
        function Z(e, t) {
          return {
            interpolation: {
              pattern: C(/((?:^|[^{])(?:\{\{)*)<<0>>/.source, [e]),
              lookbehind: !0,
              inside: {
                'format-string': {
                  pattern: C(/(^\{(?:(?![}:])<<0>>)*)<<1>>(?=\}$)/.source, [t, p]),
                  lookbehind: !0,
                  inside: { punctuation: /^:/ },
                },
                punctuation: /^\{|\}$/,
                expression: {
                  pattern: /[\s\S]+/,
                  alias: 'language-csharp',
                  inside: r.languages.csharp,
                },
              },
            },
            string: /[\s\S]+/,
          };
        }
        if (
          (e.exports && (e.exports = E),
          void 0 !== t && (t.Prism = E),
          (E.languages.markup = {
            comment: /<!--[\s\S]*?-->/,
            prolog: /<\?[\s\S]+?\?>/,
            doctype: /<!DOCTYPE[\s\S]+?>/i,
            cdata: /<!\[CDATA\[[\s\S]*?]]>/i,
            tag: {
              pattern:
                /<\/?(?!\d)[^\s>\/=$<%]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+))?)*\s*\/?>/i,
              greedy: !0,
              inside: {
                tag: {
                  pattern: /^<\/?[^\s>\/]+/i,
                  inside: { punctuation: /^<\/?/, namespace: /^[^\s>\/:]+:/ },
                },
                'special-attr': [],
                'attr-value': {
                  pattern: /=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+)/i,
                  inside: { punctuation: [/^=/, { pattern: /(^|[^\\])["']/, lookbehind: !0 }] },
                },
                punctuation: /\/?>/,
                'attr-name': { pattern: /[^\s>\/]+/, inside: { namespace: /^[^\s>\/:]+:/ } },
              },
            },
            entity: /&#?[\da-z]{1,8};/i,
          }),
          (E.languages.markup.tag.inside['attr-value'].inside.entity = E.languages.markup.entity),
          E.hooks.add('wrap', function (e) {
            'entity' === e.type && (e.attributes.title = e.content.replace(/&amp;/, '&'));
          }),
          (E.languages.xml = E.languages.markup),
          (E.languages.html = E.languages.markup),
          (E.languages.mathml = E.languages.markup),
          (E.languages.svg = E.languages.markup),
          (E.languages.css = {
            comment: /\/\*[\s\S]*?\*\//,
            atrule: { pattern: /@[\w-]+?.*?(?:;|(?=\s*\{))/i, inside: { rule: /@[\w-]+/ } },
            url: /url\((?:(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
            selector: /[^{}\s][^{};]*?(?=\s*\{)/,
            string: { pattern: /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/, greedy: !0 },
            property: /[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
            important: /\B!important\b/i,
            function: /[-a-z0-9]+(?=\()/i,
            punctuation: /[(){};:]/,
          }),
          (E.languages.css.atrule.inside.rest = E.languages.css),
          E.languages.markup &&
            (E.languages.insertBefore('markup', 'tag', {
              style: {
                pattern: /(<style[\s\S]*?>)[\s\S]*?(?=<\/style>)/i,
                lookbehind: !0,
                inside: E.languages.css,
                alias: 'language-css',
                greedy: !0,
              },
            }),
            E.languages.insertBefore(
              'inside',
              'attr-value',
              {
                'style-attr': {
                  pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
                  inside: {
                    'attr-name': { pattern: /^\s*style/i, inside: E.languages.markup.tag.inside },
                    punctuation: /^\s*=\s*['"]|['"]\s*$/,
                    'attr-value': { pattern: /.+/i, inside: E.languages.css },
                  },
                  alias: 'language-css',
                },
              },
              E.languages.markup.tag
            )),
          (E.languages.clike = {
            comment: [
              { pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/, lookbehind: !0 },
              { pattern: /(^|[^\\:])\/\/.*/, lookbehind: !0, greedy: !0 },
            ],
            string: { pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/, greedy: !0 },
            'class-name': {
              pattern:
                /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,
              lookbehind: !0,
              inside: { punctuation: /[.\\]/ },
            },
            keyword:
              /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
            boolean: /\b(?:true|false)\b/,
            function: /[a-z0-9_]+(?=\()/i,
            number: /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
            operator: /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
            punctuation: /[{}[\];(),.:]/,
          }),
          (E.languages.javascript = E.languages.extend('clike', {
            'class-name': [
              E.languages.clike['class-name'],
              {
                pattern:
                  /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
                lookbehind: !0,
              },
            ],
            keyword:
              /\b(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,
            number:
              /\b(?:0[xX][\dA-Fa-f]+|0[bB][01]+|0[oO][0-7]+|NaN|Infinity)\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee][+-]?\d+)?/,
            function: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*\()/i,
            operator:
              /-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/,
          })),
          (E.languages.javascript['class-name'][0].pattern =
            /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/),
          E.languages.insertBefore('javascript', 'keyword', {
            regex: {
              pattern:
                /((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(\[[^\]\r\n]+]|\\.|[^/\\\[\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})\]]))/,
              lookbehind: !0,
              greedy: !0,
              inside: {
                'regex-source': {
                  pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
                  lookbehind: !0,
                  alias: 'language-regex',
                  inside: E.languages.regex,
                },
                'regex-delimiter': /^\/|\/$/,
                'regex-flags': /^[a-z]+$/,
              },
            },
            'function-variable': {
              pattern:
                /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=\s*(?:function\b|(?:\([^()]*\)|[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/i,
              alias: 'function',
            },
            constant: /\b[A-Z][A-Z\d_]*\b/,
          }),
          E.languages.insertBefore('javascript', 'string', {
            hashbang: { pattern: /^#!.*/, greedy: !0, alias: 'comment' },
            'string-property': {
              pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
              lookbehind: !0,
              greedy: !0,
              alias: 'property',
            },
            'template-string': {
              pattern: /`(?:\\[\s\S]|\${[^}]+}|[^\\`])*`/,
              greedy: !0,
              inside: {
                interpolation: {
                  pattern: /\${[^}]+}/,
                  inside: {
                    'interpolation-punctuation': { pattern: /^\${|}$/, alias: 'punctuation' },
                    rest: null,
                  },
                },
                string: /[\s\S]+/,
              },
            },
          }),
          E.languages.insertBefore('javascript', 'operator', {
            'literal-property': {
              pattern:
                /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
              lookbehind: !0,
              alias: 'property',
            },
          }),
          (E.languages.javascript['template-string'].inside.interpolation.inside.rest =
            E.languages.javascript),
          Object.defineProperty(E.languages.markup.tag, 'addInlined', {
            value: function (e, t) {
              var n = {},
                n =
                  ((n['language-' + t] = {
                    pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
                    lookbehind: !0,
                    inside: E.languages[t],
                  }),
                  (n.cdata = /^<!\[CDATA\[|\]\]>$/i),
                  { 'included-cdata': { pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i, inside: n } }),
                t = ((n['language-' + t] = { pattern: /[\s\S]+/, inside: E.languages[t] }), {});
              (t[e] = {
                pattern: RegExp(
                  /(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(
                    /__/g,
                    function () {
                      return e;
                    }
                  ),
                  'i'
                ),
                lookbehind: !0,
                greedy: !0,
                inside: n,
              }),
                E.languages.insertBefore('markup', 'cdata', t);
            },
          }),
          Object.defineProperty(E.languages.markup.tag, 'addAttribute', {
            value: function (e, t) {
              E.languages.markup.tag.inside['special-attr'].push({
                pattern: RegExp(
                  /(^|["'\s])/.source +
                    '(?:' +
                    e +
                    ')' +
                    /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
                  'i'
                ),
                lookbehind: !0,
                inside: {
                  'attr-name': /^[^\s=]+/,
                  'attr-value': {
                    pattern: /=[\s\S]+/,
                    inside: {
                      value: {
                        pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                        lookbehind: !0,
                        alias: [t, 'language-' + t],
                        inside: E.languages[t],
                      },
                      punctuation: [{ pattern: /^=/, alias: 'attr-equals' }, /"|'/],
                    },
                  },
                },
              });
            },
          }),
          E.languages.markup &&
            (E.languages.insertBefore('markup', 'tag', {
              script: {
                pattern: /(<script[\s\S]*?>)[\s\S]*?(?=<\/script>)/i,
                lookbehind: !0,
                inside: E.languages.javascript,
                alias: 'language-javascript',
                greedy: !0,
              },
            }),
            E.languages.markup.tag.addInlined('script', 'javascript'),
            E.languages.markup.tag.addAttribute(
              /on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/
                .source,
              'javascript'
            )),
          (E.languages.js = E.languages.javascript),
          (E.languages['markup-templating'] = {}),
          Object.defineProperties(E.languages['markup-templating'], {
            buildPlaceholders: {
              value: function (n, r, e, a) {
                n.language === r &&
                  ((n.tokenStack = []),
                  (n.code = n.code.replace(e, function (e) {
                    if ('function' == typeof a && !a(e)) return e;
                    for (
                      var t = n.tokenStack.length;
                      -1 !== n.code.indexOf('___' + r.toUpperCase() + t + '___');

                    )
                      ++t;
                    return (n.tokenStack[t] = e), '___' + r.toUpperCase() + t + '___';
                  })),
                  (n.grammar = E.languages.markup));
              },
            },
            tokenizePlaceholders: {
              value: function (l, c) {
                var p, g, d;
                l.language === c &&
                  l.tokenStack &&
                  ((l.grammar = E.languages[c]),
                  (p = 0),
                  (g = Object.keys(l.tokenStack)),
                  (d = function (e) {
                    if (!(p >= g.length))
                      for (var t = 0; t < e.length; t++) {
                        var n = e[t];
                        if ('string' == typeof n || (n.content && 'string' == typeof n.content)) {
                          var r = g[p],
                            a = l.tokenStack[r],
                            o = 'string' == typeof n ? n : n.content,
                            i = o.indexOf('___' + c.toUpperCase() + r + '___');
                          if (-1 < i) {
                            ++p;
                            var s,
                              u = o.substring(0, i),
                              a = new E.Token(c, E.tokenize(a, l.grammar, c), 'language-' + c, a),
                              o = o.substring(i + ('___' + c.toUpperCase() + r + '___').length);
                            if (
                              (u || o
                                ? ((s = [u, a, o].filter(function (e) {
                                    return !!e;
                                  })),
                                  d(s))
                                : (s = a),
                              'string' == typeof n
                                ? Array.prototype.splice.apply(e, [t, 1].concat(s))
                                : (n.content = s),
                              p >= g.length)
                            )
                              break;
                          }
                        } else n.content && 'string' != typeof n.content && d(n.content);
                      }
                  })(l.tokens));
              },
            },
          }),
          (E.languages.json = {
            property: /"(?:\\.|[^\\"\r\n])*"(?=\s*:)/i,
            string: { pattern: /"(?:\\.|[^\\"\r\n])*"(?!\s*:)/, greedy: !0 },
            number: /\b0x[\dA-Fa-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee][+-]?\d+)?/,
            punctuation: /[{}[\]);,]/,
            operator: /:/g,
            boolean: /\b(?:true|false)\b/i,
            null: /\bnull\b/i,
          }),
          (E.languages.jsonp = E.languages.json),
          (n = (o = E).util.clone(o.languages.javascript)),
          (N = /(?:\s|\/\/.*(?!.)|\/\*(?:[^*]|\*(?!\/))\*\/)/.source),
          (M = /(?:\{(?:\{(?:\{[^{}]*\}|[^{}])*\}|[^{}])*\})/.source),
          (I = j((I = /(?:\{<S>*\.{3}(?:[^{}]|<BRACES>)*\})/.source)).source),
          (o.languages.jsx = o.languages.extend('markup', n)),
          (o.languages.jsx.tag.pattern = j(
            /<\/?(?:[\w.:-]+(?:<S>+(?:[\w.:$-]+(?:=(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s{'"/>=]+|<BRACES>))?|<SPREAD>))*<S>*\/?)?>/
              .source
          )),
          (o.languages.jsx.tag.inside.tag.pattern = /^<\/?[^\s>\/]*/),
          (o.languages.jsx.tag.inside['attr-value'].pattern =
            /=(?!\{)(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s'">]+)/),
          (o.languages.jsx.tag.inside.tag.inside['class-name'] = /^[A-Z]\w*(?:\.[A-Z]\w*)*$/),
          (o.languages.jsx.tag.inside.comment = n.comment),
          o.languages.insertBefore(
            'inside',
            'attr-name',
            { spread: { pattern: j(/<SPREAD>/.source), inside: o.languages.jsx } },
            o.languages.jsx.tag
          ),
          o.languages.insertBefore(
            'inside',
            'special-attr',
            {
              script: {
                pattern: j(/=<BRACES>/.source),
                alias: 'language-javascript',
                inside: {
                  'script-punctuation': { pattern: /^=(?=\{)/, alias: 'punctuation' },
                  rest: o.languages.jsx,
                },
              },
            },
            o.languages.jsx.tag
          ),
          (i = function (e) {
            return e
              ? 'string' == typeof e
                ? e
                : 'string' == typeof e.content
                ? e.content
                : e.content.map(i).join('')
              : '';
          }),
          o.hooks.add('after-tokenize', function (e) {
            ('jsx' !== e.language && 'tsx' !== e.language) || U(e.tokens);
          }),
          (r = E),
          (t =
            'bool byte char decimal double dynamic float int long object sbyte short string uint ulong ushort var void'),
          (v =
            'add alias and ascending async await by descending from(?=\\s*(?:\\w|$)) get global group into init(?=\\s*;) join let nameof not notnull on or orderby partial remove select set unmanaged value when where with(?=\\s*{)'),
          (_ =
            'abstract as base break case catch checked const continue default delegate do else event explicit extern finally fixed for foreach goto if implicit in internal is lock namespace new null operator out override params private protected public readonly ref return sealed sizeof stackalloc static switch this throw try typeof unchecked unsafe using virtual volatile while yield'),
          (h = B((b = 'class enum interface record struct'))),
          (u = RegExp(B(t + ' ' + b + ' ' + v + ' ' + _))),
          (v = B(b + ' ' + v + ' ' + _)),
          (t = B(t + ' ' + b + ' ' + _)),
          (b = T(/<(?:[^<>;=+\-*/%&|^]|<<self>>)*>/.source, 2)),
          (_ = T(/\((?:[^()]|<<self>>)*\)/.source, 2)),
          (l = O(/<<0>>(?:\s*<<1>>)?/.source, [(f = /@?\b[A-Za-z_]\w*\b/.source), b])),
          (v = O(/(?!<<0>>)<<1>>(?:\s*\.\s*<<1>>)*/.source, [v, l])),
          (S = O(/<<0>>(?:\s*(?:\?\s*)?<<1>>)*(?:\s*\?)?/.source, [
            v,
            (g = /\[\s*(?:,\s*)*\]/.source),
          ])),
          (c = O(/[^,()<>[\];=+\-*/%&|^]|<<0>>|<<1>>|<<2>>/.source, [b, _, g])),
          (c = O(/\(<<0>>+(?:,<<0>>+)+\)/.source, [c])),
          (c = O(/(?:<<0>>|<<1>>)(?:\s*(?:\?\s*)?<<2>>)*(?:\s*\?)?/.source, [c, v, g])),
          (g = { keyword: u, punctuation: /[<>()?,.:[\]]/ }),
          (z = /'(?:[^\r\n'\\]|\\.|\\[Uux][\da-fA-F]{1,8})'/.source),
          (d = /"(?:\\.|[^\\"\r\n])*"/.source),
          (r.languages.csharp = r.languages.extend('clike', {
            string: [
              {
                pattern: C(/(^|[^$\\])<<0>>/.source, [/@"(?:""|\\[\s\S]|[^\\"])*"(?!")/.source]),
                lookbehind: !0,
                greedy: !0,
              },
              { pattern: C(/(^|[^@$\\])<<0>>/.source, [d]), lookbehind: !0, greedy: !0 },
            ],
            'class-name': [
              {
                pattern: C(/(\busing\s+static\s+)<<0>>(?=\s*;)/.source, [v]),
                lookbehind: !0,
                inside: g,
              },
              {
                pattern: C(/(\busing\s+<<0>>\s*=\s*)<<1>>(?=\s*;)/.source, [f, c]),
                lookbehind: !0,
                inside: g,
              },
              { pattern: C(/(\busing\s+)<<0>>(?=\s*=)/.source, [f]), lookbehind: !0 },
              { pattern: C(/(\b<<0>>\s+)<<1>>/.source, [h, l]), lookbehind: !0, inside: g },
              { pattern: C(/(\bcatch\s*\(\s*)<<0>>/.source, [v]), lookbehind: !0, inside: g },
              { pattern: C(/(\bwhere\s+)<<0>>/.source, [f]), lookbehind: !0 },
              {
                pattern: C(/(\b(?:is(?:\s+not)?|as)\s+)<<0>>/.source, [S]),
                lookbehind: !0,
                inside: g,
              },
              {
                pattern: C(
                  /\b<<0>>(?=\s+(?!<<1>>|with\s*\{)<<2>>(?:\s*[=,;:{)\]]|\s+(?:in|when)\b))/.source,
                  [c, t, f]
                ),
                inside: g,
              },
            ],
            keyword: u,
            number:
              /(?:\b0(?:x[\da-f_]*[\da-f]|b[01_]*[01])|(?:\B\.\d+(?:_+\d+)*|\b\d+(?:_+\d+)*(?:\.\d+(?:_+\d+)*)?)(?:e[-+]?\d+(?:_+\d+)*)?)(?:[dflmu]|lu|ul)?\b/i,
            operator: />>=?|<<=?|[-=]>|([-+&|])\1|~|\?\?=?|[-+*/%&|^!=<>]=?/,
            punctuation: /\?\.?|::|[{}[\];(),.:]/,
          })),
          r.languages.insertBefore('csharp', 'number', {
            range: { pattern: /\.\./, alias: 'operator' },
          }),
          r.languages.insertBefore('csharp', 'punctuation', {
            'named-parameter': {
              pattern: C(/([(,]\s*)<<0>>(?=\s*:)/.source, [f]),
              lookbehind: !0,
              alias: 'punctuation',
            },
          }),
          r.languages.insertBefore('csharp', 'class-name', {
            namespace: {
              pattern: C(/(\b(?:namespace|using)\s+)<<0>>(?:\s*\.\s*<<0>>)*(?=\s*[;{])/.source, [
                f,
              ]),
              lookbehind: !0,
              inside: { punctuation: /\./ },
            },
            'type-expression': {
              pattern: C(
                /(\b(?:default|sizeof|typeof)\s*\(\s*(?!\s))(?:[^()\s]|\s(?!\s)|<<0>>)*(?=\s*\))/
                  .source,
                [_]
              ),
              lookbehind: !0,
              alias: 'class-name',
              inside: g,
            },
            'return-type': {
              pattern: C(/<<0>>(?=\s+(?:<<1>>\s*(?:=>|[({]|\.\s*this\s*\[)|this\s*\[))/.source, [
                c,
                v,
              ]),
              inside: g,
              alias: 'class-name',
            },
            'constructor-invocation': {
              pattern: C(/(\bnew\s+)<<0>>(?=\s*[[({])/.source, [c]),
              lookbehind: !0,
              inside: g,
              alias: 'class-name',
            },
            'generic-method': {
              pattern: C(/<<0>>\s*<<1>>(?=\s*\()/.source, [f, b]),
              inside: {
                function: C(/^<<0>>/.source, [f]),
                generic: { pattern: RegExp(b), alias: 'class-name', inside: g },
              },
            },
            'type-list': {
              pattern: C(
                /\b((?:<<0>>\s+<<1>>|record\s+<<1>>\s*<<5>>|where\s+<<2>>)\s*:\s*)(?:<<3>>|<<4>>|<<1>>\s*<<5>>|<<6>>)(?:\s*,\s*(?:<<3>>|<<4>>|<<6>>))*(?=\s*(?:where|[{;]|=>|$))/
                  .source,
                [h, l, f, c, u.source, _, /\bnew\s*\(\s*\)/.source]
              ),
              lookbehind: !0,
              inside: {
                'record-arguments': {
                  pattern: C(/(^(?!new\s*\()<<0>>\s*)<<1>>/.source, [l, _]),
                  lookbehind: !0,
                  greedy: !0,
                  inside: r.languages.csharp,
                },
                keyword: u,
                'class-name': { pattern: RegExp(c), greedy: !0, inside: g },
                punctuation: /[,()]/,
              },
            },
            preprocessor: {
              pattern: /(^[\t ]*)#.*/m,
              lookbehind: !0,
              alias: 'property',
              inside: {
                directive: {
                  pattern:
                    /(#)\b(?:define|elif|else|endif|endregion|error|if|line|nullable|pragma|region|undef|warning)\b/,
                  lookbehind: !0,
                  alias: 'keyword',
                },
              },
            },
          }),
          (t = O(/\/(?![*/])|\/\/[^\r\n]*[\r\n]|\/\*(?:[^*]|\*(?!\/))*\*\/|<<0>>/.source, [
            (S = d + '|' + z),
          ])),
          (b = T(O(/[^"'/()]|<<0>>|\(<<self>>*\)/.source, [t]), 2)),
          (h = /\b(?:assembly|event|field|method|module|param|property|return|type)\b/.source),
          (f = O(/<<0>>(?:\s*\(<<1>>*\))?/.source, [v, b])),
          r.languages.insertBefore('csharp', 'class-name', {
            attribute: {
              pattern: C(
                /((?:^|[^\s\w>)?])\s*\[\s*)(?:<<0>>\s*:\s*)?<<1>>(?:\s*,\s*<<1>>)*(?=\s*\])/.source,
                [h, f]
              ),
              lookbehind: !0,
              greedy: !0,
              inside: {
                target: { pattern: C(/^<<0>>(?=\s*:)/.source, [h]), alias: 'keyword' },
                'attribute-arguments': {
                  pattern: C(/\(<<0>>*\)/.source, [b]),
                  inside: r.languages.csharp,
                },
                'class-name': { pattern: RegExp(v), inside: { punctuation: /\./ } },
                punctuation: /[:,]/,
              },
            },
          }),
          (p = /:[^}\r\n]+/.source),
          (l = T(O(/[^"'/()]|<<0>>|\(<<self>>*\)/.source, [t]), 2)),
          (_ = O(/\{(?!\{)(?:(?![}:])<<0>>)*<<1>>?\}/.source, [l, p])),
          (u = T(
            O(/[^"'/()]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|<<0>>|\(<<self>>*\)/.source, [S]),
            2
          )),
          (c = O(/\{(?!\{)(?:(?![}:])<<0>>)*<<1>>?\}/.source, [u, p])),
          r.languages.insertBefore('csharp', 'string', {
            'interpolation-string': [
              {
                pattern: C(/(^|[^\\])(?:\$@|@\$)"(?:""|\\[\s\S]|\{\{|<<0>>|[^\\{"])*"/.source, [_]),
                lookbehind: !0,
                greedy: !0,
                inside: Z(_, l),
              },
              {
                pattern: C(/(^|[^@\\])\$"(?:\\.|\{\{|<<0>>|[^\\"{])*"/.source, [c]),
                lookbehind: !0,
                greedy: !0,
                inside: Z(c, u),
              },
            ],
            char: { pattern: RegExp(z), greedy: !0 },
          }),
          (r.languages.dotnet = r.languages.cs = r.languages.csharp),
          (E.languages.aspnet = E.languages.extend('markup', {
            'page-directive': {
              pattern: /<%\s*@.*%>/,
              alias: 'tag',
              inside: {
                'page-directive': {
                  pattern:
                    /<%\s*@\s*(?:Assembly|Control|Implements|Import|Master(?:Type)?|OutputCache|Page|PreviousPageType|Reference|Register)?|%>/i,
                  alias: 'tag',
                },
                rest: E.languages.markup.tag.inside,
              },
            },
            directive: {
              pattern: /<%.*%>/,
              alias: 'tag',
              inside: {
                directive: { pattern: /<%\s*?[$=%#:]{0,2}|%>/, alias: 'tag' },
                rest: E.languages.csharp,
              },
            },
          })),
          (E.languages.aspnet.tag.pattern =
            /<(?!%)\/?[^\s>\/]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+))?)*\s*\/?>/),
          E.languages.insertBefore(
            'inside',
            'punctuation',
            { directive: E.languages.aspnet.directive },
            E.languages.aspnet.tag.inside['attr-value']
          ),
          E.languages.insertBefore('aspnet', 'comment', {
            'asp-comment': { pattern: /<%--[\s\S]*?--%>/, alias: ['asp', 'comment'] },
          }),
          E.languages.insertBefore('aspnet', E.languages.javascript ? 'script' : 'tag', {
            'asp-script': {
              pattern: /(<script(?=.*runat=['"]?server\b)[^>]*>)[\s\S]*?(?=<\/script>)/i,
              lookbehind: !0,
              alias: ['asp', 'script'],
              inside: E.languages.csharp || {},
            },
          }),
          (E.languages.python = {
            comment: { pattern: /(^|[^\\])#.*/, lookbehind: !0, greedy: !0 },
            'string-interpolation': {
              pattern: /(?:f|fr|rf)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,
              greedy: !0,
              inside: {
                interpolation: {
                  pattern:
                    /((?:^|[^{])(?:\{\{)*)\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}])+\})+\})+\}/,
                  lookbehind: !0,
                  inside: {
                    'format-spec': { pattern: /(:)[^:(){}]+(?=\}$)/, lookbehind: !0 },
                    'conversion-option': { pattern: /![sra](?=[:}]$)/, alias: 'punctuation' },
                    rest: null,
                  },
                },
                string: /[\s\S]+/,
              },
            },
            'triple-quoted-string': {
              pattern: /(?:[rub]|br|rb)?("""|''')[\s\S]*?\1/i,
              greedy: !0,
              alias: 'string',
            },
            string: { pattern: /(?:[rub]|br|rb)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i, greedy: !0 },
            function: { pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g, lookbehind: !0 },
            'class-name': { pattern: /(\bclass\s+)\w+/i, lookbehind: !0 },
            decorator: {
              pattern: /(^[\t ]*)@\w+(?:\.\w+)*/m,
              lookbehind: !0,
              alias: ['annotation', 'punctuation'],
              inside: { punctuation: /\./ },
            },
            keyword:
              /\b(?:_(?=\s*:)|and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
            builtin:
              /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,
            boolean: /\b(?:False|None|True)\b/,
            number:
              /\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\b|(?:\b\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\B\.\d+(?:_\d+)*)(?:e[+-]?\d+(?:_\d+)*)?j?(?!\w)/i,
            operator: /[-+%=]=?|!=|:=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
            punctuation: /[{}[\];(),.:]/,
          }),
          (E.languages.python['string-interpolation'].inside.interpolation.inside.rest =
            E.languages.python),
          (E.languages.py = E.languages.python),
          ((g = E).languages.ruby = g.languages.extend('clike', {
            comment: { pattern: /#.*|^=begin\s[\s\S]*?^=end/m, greedy: !0 },
            'class-name': {
              pattern: /(\b(?:class|module)\s+|\bcatch\s+\()[\w.\\]+|\b[A-Z_]\w*(?=\s*\.\s*new\b)/,
              lookbehind: !0,
              inside: { punctuation: /[.\\]/ },
            },
            keyword:
              /\b(?:BEGIN|END|alias|and|begin|break|case|class|def|define_method|defined|do|each|else|elsif|end|ensure|extend|for|if|in|include|module|new|next|nil|not|or|prepend|private|protected|public|raise|redo|require|rescue|retry|return|self|super|then|throw|undef|unless|until|when|while|yield)\b/,
            operator: /\.{2,3}|&\.|===|<?=>|[!=]?~|(?:&&|\|\||<<|>>|\*\*|[+\-*/%<>!^&|=])=?|[?:]/,
            punctuation: /[(){}[\].,;]/,
          })),
          g.languages.insertBefore('ruby', 'operator', {
            'double-colon': { pattern: /::/, alias: 'punctuation' },
          }),
          (d = {
            pattern: /((?:^|[^\\])(?:\\{2})*)#\{(?:[^{}]|\{[^{}]*\})*\}/,
            lookbehind: !0,
            inside: {
              content: {
                pattern: /^(#\{)[\s\S]+(?=\}$)/,
                lookbehind: !0,
                inside: g.languages.ruby,
              },
              delimiter: { pattern: /^#\{|\}$/, alias: 'punctuation' },
            },
          }),
          delete g.languages.ruby.function,
          (f =
            '(?:' +
            [
              /([^a-zA-Z0-9\s{(\[<=])(?:(?!\1)[^\\]|\\[\s\S])*\1/.source,
              /\((?:[^()\\]|\\[\s\S]|\((?:[^()\\]|\\[\s\S])*\))*\)/.source,
              /\{(?:[^{}\\]|\\[\s\S]|\{(?:[^{}\\]|\\[\s\S])*\})*\}/.source,
              /\[(?:[^\[\]\\]|\\[\s\S]|\[(?:[^\[\]\\]|\\[\s\S])*\])*\]/.source,
              /<(?:[^<>\\]|\\[\s\S]|<(?:[^<>\\]|\\[\s\S])*>)*>/.source,
            ].join('|') +
            ')'),
          (h = /(?:"(?:\\.|[^"\\\r\n])*"|(?:\b[a-zA-Z_]\w*|[^\s\0-\x7F]+)[?!]?|\$.)/.source),
          g.languages.insertBefore('ruby', 'keyword', {
            'regex-literal': [
              {
                pattern: RegExp(/%r/.source + f + /[egimnosux]{0,6}/.source),
                greedy: !0,
                inside: { interpolation: d, regex: /[\s\S]+/ },
              },
              {
                pattern:
                  /(^|[^/])\/(?!\/)(?:\[[^\r\n\]]+\]|\\.|[^[/\\\r\n])+\/[egimnosux]{0,6}(?=\s*(?:$|[\r\n,.;})#]))/,
                lookbehind: !0,
                greedy: !0,
                inside: { interpolation: d, regex: /[\s\S]+/ },
              },
            ],
            variable: /[@$]+[a-zA-Z_]\w*(?:[?!]|\b)/,
            symbol: [
              { pattern: RegExp(/(^|[^:]):/.source + h), lookbehind: !0, greedy: !0 },
              {
                pattern: RegExp(/([\r\n{(,][ \t]*)/.source + h + /(?=:(?!:))/.source),
                lookbehind: !0,
                greedy: !0,
              },
            ],
            'method-definition': {
              pattern: /(\bdef\s+)\w+(?:\s*\.\s*\w+)?/,
              lookbehind: !0,
              inside: {
                function: /\b\w+$/,
                keyword: /^self\b/,
                'class-name': /^\w+/,
                punctuation: /\./,
              },
            },
          }),
          g.languages.insertBefore('ruby', 'string', {
            'string-literal': [
              {
                pattern: RegExp(/%[qQiIwWs]?/.source + f),
                greedy: !0,
                inside: { interpolation: d, string: /[\s\S]+/ },
              },
              {
                pattern: /("|')(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|(?!\1)[^\\#\r\n])*\1/,
                greedy: !0,
                inside: { interpolation: d, string: /[\s\S]+/ },
              },
              {
                pattern: /<<[-~]?([a-z_]\w*)[\r\n](?:.*[\r\n])*?[\t ]*\1/i,
                alias: 'heredoc-string',
                greedy: !0,
                inside: {
                  delimiter: {
                    pattern: /^<<[-~]?[a-z_]\w*|\b[a-z_]\w*$/i,
                    inside: { symbol: /\b\w+/, punctuation: /^<<[-~]?/ },
                  },
                  interpolation: d,
                  string: /[\s\S]+/,
                },
              },
              {
                pattern: /<<[-~]?'([a-z_]\w*)'[\r\n](?:.*[\r\n])*?[\t ]*\1/i,
                alias: 'heredoc-string',
                greedy: !0,
                inside: {
                  delimiter: {
                    pattern: /^<<[-~]?'[a-z_]\w*'|\b[a-z_]\w*$/i,
                    inside: { symbol: /\b\w+/, punctuation: /^<<[-~]?'|'$/ },
                  },
                  string: /[\s\S]+/,
                },
              },
            ],
            'command-literal': [
              {
                pattern: RegExp(/%x/.source + f),
                greedy: !0,
                inside: { interpolation: d, command: { pattern: /[\s\S]+/, alias: 'string' } },
              },
              {
                pattern: /`(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|[^\\`#\r\n])*`/,
                greedy: !0,
                inside: { interpolation: d, command: { pattern: /[\s\S]+/, alias: 'string' } },
              },
            ],
          }),
          delete g.languages.ruby.string,
          g.languages.insertBefore('ruby', 'number', {
            builtin:
              /\b(?:Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Fixnum|Float|Hash|IO|Integer|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|Stat|String|Struct|Symbol|TMS|Thread|ThreadGroup|Time|TrueClass)\b/,
            constant: /\b[A-Z][A-Z0-9_]*(?:[?!]|\b)/,
          }),
          (g.languages.rb = g.languages.ruby),
          ((m = E).languages.php = m.languages.extend('clike', {
            keyword:
              /\b(?:and|or|xor|array|as|break|case|cfunction|class|const|continue|declare|default|die|do|else|elseif|enddeclare|endfor|endforeach|endif|endswitch|endwhile|extends|for|foreach|function|include|include_once|global|if|new|return|static|switch|use|require|require_once|var|while|abstract|interface|public|implements|private|protected|parent|throw|null|echo|print|trait|namespace|final|yield|goto|instanceof|finally|try|catch)\b/i,
            constant: /\b[A-Z0-9_]{2,}\b/,
            comment: { pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/, lookbehind: !0 },
          })),
          m.languages.insertBefore('php', 'string', {
            'shell-comment': { pattern: /(^|[^\\])#.*/, lookbehind: !0, alias: 'comment' },
          }),
          m.languages.insertBefore('php', 'keyword', {
            delimiter: { pattern: /\?>|<\?(?:php|=)?/i, alias: 'important' },
            variable: /\$+(?:\w+\b|(?={))/i,
            package: {
              pattern: /(\\|namespace\s+|use\s+)[\w\\]+/,
              lookbehind: !0,
              inside: { punctuation: /\\/ },
            },
          }),
          m.languages.insertBefore('php', 'operator', {
            property: { pattern: /(->)[\w]+/, lookbehind: !0 },
          }),
          m.languages.insertBefore('php', 'string', {
            'nowdoc-string': {
              pattern: /<<<'([^']+)'(?:\r\n?|\n)(?:.*(?:\r\n?|\n))*?\1;/,
              greedy: !0,
              alias: 'string',
              inside: {
                delimiter: {
                  pattern: /^<<<'[^']+'|[a-z_]\w*;$/i,
                  alias: 'symbol',
                  inside: { punctuation: /^<<<'?|[';]$/ },
                },
              },
            },
            'heredoc-string': {
              pattern:
                /<<<(?:"([^"]+)"(?:\r\n?|\n)(?:.*(?:\r\n?|\n))*?\1;|([a-z_]\w*)(?:\r\n?|\n)(?:.*(?:\r\n?|\n))*?\2;)/i,
              greedy: !0,
              alias: 'string',
              inside: {
                delimiter: {
                  pattern: /^<<<(?:"[^"]+"|[a-z_]\w*)|[a-z_]\w*;$/i,
                  alias: 'symbol',
                  inside: { punctuation: /^<<<"?|[";]$/ },
                },
                interpolation: null,
              },
            },
            'single-quoted-string': {
              pattern: /'(?:\\[\s\S]|[^\\'])*'/,
              greedy: !0,
              alias: 'string',
            },
            'double-quoted-string': {
              pattern: /"(?:\\[\s\S]|[^\\"])*"/,
              greedy: !0,
              alias: 'string',
              inside: { interpolation: null },
            },
          }),
          delete m.languages.php.string,
          (b = {
            pattern: /{\$(?:{(?:{[^{}]+}|[^{}]+)}|[^{}])+}|(^|[^\\{])\$+(?:\w+(?:\[.+?]|->\w+)*)/,
            lookbehind: !0,
            inside: { rest: m.languages.php },
          }),
          (m.languages.php['heredoc-string'].inside.interpolation = b),
          (m.languages.php['double-quoted-string'].inside.interpolation = b),
          m.hooks.add('before-tokenize', function (e) {
            /(?:<\?php|<\?)/gi.test(e.code) &&
              m.languages['markup-templating'].buildPlaceholders(
                e,
                'php',
                /(?:<\?php|<\?)[\s\S]*?(?:\?>|$)/gi
              );
          }),
          m.hooks.add('after-tokenize', function (e) {
            m.languages['markup-templating'].tokenizePlaceholders(e, 'php');
          }),
          (E.languages.typescript = E.languages.extend('javascript', {
            keyword:
              /\b(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield|module|declare|constructor|namespace|abstract|require|type)\b/,
            builtin: /\b(?:string|Function|any|number|boolean|Array|symbol|console)\b/,
          })),
          (E.languages.ts = E.languages.typescript),
          (E.languages.scss = E.languages.extend('css', {
            comment: { pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/, lookbehind: !0 },
            atrule: {
              pattern: /@[\w-]+(?:\([^()]+\)|[^(])*?(?=\s+[{;])/,
              inside: { rule: /@[\w-]+/ },
            },
            url: /(?:[-a-z]+-)*url(?=\()/i,
            selector: {
              pattern:
                /(?=\S)[^@;{}()]?(?:[^@;{}()]|&|#\{\$[-\w]+\})+(?=\s*\{(?:\}|\s|[^}]+[:{][^}]+))/m,
              inside: {
                parent: { pattern: /&/, alias: 'important' },
                placeholder: /%[-\w]+/,
                variable: /\$[-\w]+|#\{\$[-\w]+\}/,
              },
            },
          })),
          E.languages.insertBefore('scss', 'atrule', {
            keyword: [
              /@(?:if|else(?: if)?|for|each|while|import|extend|debug|warn|mixin|include|function|return|content)/i,
              { pattern: /( +)(?:from|through)(?= )/, lookbehind: !0 },
            ],
          }),
          (E.languages.scss.property = {
            pattern: /(?:[\w-]|\$[-\w]+|#\{\$[-\w]+\})+(?=\s*:)/i,
            inside: { variable: /\$[-\w]+|#\{\$[-\w]+\}/ },
          }),
          E.languages.insertBefore('scss', 'important', { variable: /\$[-\w]+|#\{\$[-\w]+\}/ }),
          E.languages.insertBefore('scss', 'function', {
            placeholder: { pattern: /%[-\w]+/, alias: 'selector' },
            statement: { pattern: /\B!(?:default|optional)\b/i, alias: 'keyword' },
            boolean: /\b(?:true|false)\b/,
            null: /\bnull\b/,
            operator: {
              pattern: /(\s)(?:[-+*\/%]|[=!]=|<=?|>=?|and|or|not)(?=\s)/,
              lookbehind: !0,
            },
          }),
          (E.languages.scss.atrule.inside.rest = E.languages.scss),
          'undefined' != typeof self &&
            self.Prism &&
            self.document &&
            ((D = 'line-numbers'),
            (q = /\n(?!$)/g),
            (G = function (e) {
              var n,
                r,
                t = (
                  (t = e)
                    ? window.getComputedStyle
                      ? getComputedStyle(t)
                      : t.currentStyle || null
                    : null
                )['white-space'];
              ('pre-wrap' !== t && 'pre-line' !== t) ||
                ((t = e.querySelector('code')),
                (n = e.querySelector('.line-numbers-rows')),
                (r = e.querySelector('.line-numbers-sizer')),
                (e = t.textContent.split(q)),
                r ||
                  (((r = document.createElement('span')).className = 'line-numbers-sizer'),
                  t.appendChild(r)),
                (r.style.display = 'block'),
                e.forEach(function (e, t) {
                  r.textContent = e || '\n';
                  e = r.getBoundingClientRect().height;
                  n.children[t].style.height = e + 'px';
                }),
                (r.textContent = ''),
                (r.style.display = 'none'));
            }),
            window.addEventListener('resize', function () {
              Array.prototype.forEach.call(document.querySelectorAll('pre.' + D), G);
            }),
            E.hooks.add('complete', function (e) {
              var t, n, r;
              e.code &&
                ((n = /\s*\bline-numbers\b\s*/), (t = e.element.parentNode)) &&
                /pre/i.test(t.nodeName) &&
                (n.test(t.className) || n.test(e.element.className)) &&
                (e.element.querySelector('.line-numbers-rows') ||
                  (n.test(e.element.className) &&
                    (e.element.className = e.element.className.replace(n, ' ')),
                  n.test(t.className) || (t.className += ' line-numbers'),
                  (n = (n = e.code.match(q)) ? n.length + 1 : 1),
                  (n = (n = new Array(n + 1)).join('<span></span>')),
                  (r = document.createElement('span')).setAttribute('aria-hidden', 'true'),
                  (r.className = 'line-numbers-rows'),
                  (r.innerHTML = n),
                  t.hasAttribute('data-start') &&
                    (t.style.counterReset =
                      'linenumber ' + (parseInt(t.getAttribute('data-start'), 10) - 1)),
                  e.element.appendChild(r),
                  G(t),
                  E.hooks.run('line-numbers', e)));
            }),
            E.hooks.add('line-numbers', function (e) {
              (e.plugins = e.plugins || {}), (e.plugins.lineNumbers = !0);
            }),
            (E.plugins.lineNumbers = {
              getLine: function (e, t) {
                var n, r;
                if ('PRE' === e.tagName && e.classList.contains(D))
                  return (
                    (n = e.querySelector('.line-numbers-rows')),
                    (r =
                      (t =
                        (r =
                          (e = parseInt(e.getAttribute('data-start'), 10) || 1) +
                          (n.children.length - 1)) < (t = t < e ? e : t)
                          ? r
                          : t) - e),
                    n.children[r]
                  );
              },
            })),
          'undefined' != typeof self &&
            self.Prism &&
            self.document &&
            ((y = []),
            (H = {}),
            (W = function () {}),
            (E.plugins.toolbar = {}),
            (v = E.plugins.toolbar.registerButton =
              function (e, n) {
                var t =
                  'function' == typeof n
                    ? n
                    : function (e) {
                        var t;
                        return (
                          'function' == typeof n.onClick
                            ? (((t = document.createElement('button')).type = 'button'),
                              t.addEventListener('click', function () {
                                n.onClick.call(this, e);
                              }))
                            : 'string' == typeof n.url
                            ? ((t = document.createElement('a')).href = n.url)
                            : (t = document.createElement('span')),
                          (t.textContent = n.text),
                          t
                        );
                      };
                y.push((H[e] = t));
              }),
            (t = E.plugins.toolbar.hook =
              function (n) {
                var e,
                  r,
                  t = n.element.parentNode;
                t &&
                  /pre/i.test(t.nodeName) &&
                  (t.parentNode.classList.contains('code-toolbar') ||
                    ((e = document.createElement('div')).classList.add('code-toolbar'),
                    t.parentNode.insertBefore(e, t),
                    e.appendChild(t),
                    (r = document.createElement('div')).classList.add('toolbar'),
                    (y = document.body.hasAttribute('data-toolbar-order')
                      ? document.body
                          .getAttribute('data-toolbar-order')
                          .split(',')
                          .map(function (e) {
                            return H[e] || W;
                          })
                      : y).forEach(function (e) {
                      var t,
                        e = e(n);
                      e &&
                        ((t = document.createElement('div')).classList.add('toolbar-item'),
                        t.appendChild(e),
                        r.appendChild(t));
                    }),
                    e.appendChild(r)));
              }),
            v('label', function (e) {
              e = e.element.parentNode;
              if (e && /pre/i.test(e.nodeName) && e.hasAttribute('data-label')) {
                var t,
                  n,
                  r = e.getAttribute('data-label');
                try {
                  n = document.querySelector('template#' + r);
                } catch (e) {}
                return (
                  n
                    ? (t = n.content)
                    : (e.hasAttribute('data-url')
                        ? ((t = document.createElement('a')).href = e.getAttribute('data-url'))
                        : (t = document.createElement('span')),
                      (t.textContent = r)),
                  t
                );
              }
            }),
            E.hooks.add('complete', t)),
          ('undefined' == typeof self || self.Prism) && self.document && Function.prototype.bind)
        ) {
          var F,
            Y,
            $ = {
              gradient: {
                create:
                  ((F = {}),
                  function () {
                    new E.plugins.Previewer(
                      'gradient',
                      function (e) {
                        return (
                          (this.firstChild.style.backgroundImage = ''),
                          (this.firstChild.style.backgroundImage = X(e)),
                          !!this.firstChild.style.backgroundImage
                        );
                      },
                      '*',
                      function () {
                        this._elt.innerHTML = '<div></div>';
                      }
                    );
                  }),
                tokens: {
                  gradient: {
                    pattern:
                      /(?:\b|\B-[a-z]{1,10}-)(?:repeating-)?(?:linear|radial)-gradient\((?:(?:rgb|hsl)a?\(.+?\)|[^\)])+\)/gi,
                    inside: { function: /[\w-]+(?=\()/, punctuation: /[(),]/ },
                  },
                },
                languages: {
                  css: !0,
                  less: !0,
                  sass: [
                    {
                      lang: 'sass',
                      before: 'punctuation',
                      inside: 'inside',
                      root: E.languages.sass && E.languages.sass['variable-line'],
                    },
                    {
                      lang: 'sass',
                      before: 'punctuation',
                      inside: 'inside',
                      root: E.languages.sass && E.languages.sass['property-line'],
                    },
                  ],
                  scss: !0,
                  stylus: [
                    {
                      lang: 'stylus',
                      before: 'func',
                      inside: 'rest',
                      root: E.languages.stylus && E.languages.stylus['property-declaration'].inside,
                    },
                    {
                      lang: 'stylus',
                      before: 'func',
                      inside: 'rest',
                      root: E.languages.stylus && E.languages.stylus['variable-declaration'].inside,
                    },
                  ],
                },
              },
              angle: {
                create: function () {
                  new E.plugins.Previewer(
                    'angle',
                    function (e) {
                      var t,
                        n = parseFloat(e),
                        e = e.match(/[a-z]+$/i);
                      if (!n || !e) return !1;
                      switch (e[0]) {
                        case 'deg':
                          t = 360;
                          break;
                        case 'grad':
                          t = 400;
                          break;
                        case 'rad':
                          t = 2 * Math.PI;
                          break;
                        case 'turn':
                          t = 1;
                      }
                      return (
                        (e = (100 * n) / t),
                        (e %= 100),
                        this[(n < 0 ? 'set' : 'remove') + 'Attribute']('data-negative', ''),
                        (this.querySelector('circle').style.strokeDasharray = Math.abs(e) + ',500'),
                        !0
                      );
                    },
                    '*',
                    function () {
                      this._elt.innerHTML =
                        '<svg viewBox="0 0 64 64"><circle r="16" cy="32" cx="32"></circle></svg>';
                    }
                  );
                },
                tokens: { angle: /(?:\b|\B-|(?=\B\.))\d*\.?\d+(?:deg|g?rad|turn)\b/i },
                languages: {
                  css: !0,
                  less: !0,
                  markup: {
                    lang: 'markup',
                    before: 'punctuation',
                    inside: 'inside',
                    root: E.languages.markup && E.languages.markup.tag.inside['attr-value'],
                  },
                  sass: [
                    {
                      lang: 'sass',
                      inside: 'inside',
                      root: E.languages.sass && E.languages.sass['property-line'],
                    },
                    {
                      lang: 'sass',
                      before: 'operator',
                      inside: 'inside',
                      root: E.languages.sass && E.languages.sass['variable-line'],
                    },
                  ],
                  scss: !0,
                  stylus: [
                    {
                      lang: 'stylus',
                      before: 'func',
                      inside: 'rest',
                      root: E.languages.stylus && E.languages.stylus['property-declaration'].inside,
                    },
                    {
                      lang: 'stylus',
                      before: 'func',
                      inside: 'rest',
                      root: E.languages.stylus && E.languages.stylus['variable-declaration'].inside,
                    },
                  ],
                },
              },
              color: {
                create: function () {
                  new E.plugins.Previewer('color', function (e) {
                    return (
                      (this.style.backgroundColor = ''),
                      (this.style.backgroundColor = e),
                      !!this.style.backgroundColor
                    );
                  });
                },
                tokens: {
                  color: {
                    pattern:
                      /\B#(?:[0-9a-f]{3}){1,2}\b|\b(?:rgb|hsl)\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*\)\B|\b(?:rgb|hsl)a\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*(?:0|0?\.\d+|1)\s*\)\B|\b(?:AliceBlue|AntiqueWhite|Aqua|Aquamarine|Azure|Beige|Bisque|Black|BlanchedAlmond|Blue|BlueViolet|Brown|BurlyWood|CadetBlue|Chartreuse|Chocolate|Coral|CornflowerBlue|Cornsilk|Crimson|Cyan|DarkBlue|DarkCyan|DarkGoldenRod|DarkGray|DarkGreen|DarkKhaki|DarkMagenta|DarkOliveGreen|DarkOrange|DarkOrchid|DarkRed|DarkSalmon|DarkSeaGreen|DarkSlateBlue|DarkSlateGray|DarkTurquoise|DarkViolet|DeepPink|DeepSkyBlue|DimGray|DodgerBlue|FireBrick|FloralWhite|ForestGreen|Fuchsia|Gainsboro|GhostWhite|Gold|GoldenRod|Gray|Green|GreenYellow|HoneyDew|HotPink|IndianRed|Indigo|Ivory|Khaki|Lavender|LavenderBlush|LawnGreen|LemonChiffon|LightBlue|LightCoral|LightCyan|LightGoldenRodYellow|LightGray|LightGreen|LightPink|LightSalmon|LightSeaGreen|LightSkyBlue|LightSlateGray|LightSteelBlue|LightYellow|Lime|LimeGreen|Linen|Magenta|Maroon|MediumAquaMarine|MediumBlue|MediumOrchid|MediumPurple|MediumSeaGreen|MediumSlateBlue|MediumSpringGreen|MediumTurquoise|MediumVioletRed|MidnightBlue|MintCream|MistyRose|Moccasin|NavajoWhite|Navy|OldLace|Olive|OliveDrab|Orange|OrangeRed|Orchid|PaleGoldenRod|PaleGreen|PaleTurquoise|PaleVioletRed|PapayaWhip|PeachPuff|Peru|Pink|Plum|PowderBlue|Purple|Red|RosyBrown|RoyalBlue|SaddleBrown|Salmon|SandyBrown|SeaGreen|SeaShell|Sienna|Silver|SkyBlue|SlateBlue|SlateGray|Snow|SpringGreen|SteelBlue|Tan|Teal|Thistle|Tomato|Turquoise|Violet|Wheat|White|WhiteSmoke|Yellow|YellowGreen)\b/i,
                    inside: { function: /[\w-]+(?=\()/, punctuation: /[(),]/ },
                  },
                },
                languages: {
                  css: !0,
                  less: !0,
                  markup: {
                    lang: 'markup',
                    before: 'punctuation',
                    inside: 'inside',
                    root: E.languages.markup && E.languages.markup.tag.inside['attr-value'],
                  },
                  sass: [
                    {
                      lang: 'sass',
                      before: 'punctuation',
                      inside: 'inside',
                      root: E.languages.sass && E.languages.sass['variable-line'],
                    },
                    {
                      lang: 'sass',
                      inside: 'inside',
                      root: E.languages.sass && E.languages.sass['property-line'],
                    },
                  ],
                  scss: !0,
                  stylus: [
                    {
                      lang: 'stylus',
                      before: 'hexcode',
                      inside: 'rest',
                      root: E.languages.stylus && E.languages.stylus['property-declaration'].inside,
                    },
                    {
                      lang: 'stylus',
                      before: 'hexcode',
                      inside: 'rest',
                      root: E.languages.stylus && E.languages.stylus['variable-declaration'].inside,
                    },
                  ],
                },
              },
              easing: {
                create: function () {
                  new E.plugins.Previewer(
                    'easing',
                    function (e) {
                      var t,
                        e = (e =
                          {
                            linear: '0,0,1,1',
                            ease: '.25,.1,.25,1',
                            'ease-in': '.42,0,1,1',
                            'ease-out': '0,0,.58,1',
                            'ease-in-out': '.42,0,.58,1',
                          }[e] || e).match(/-?\d*\.?\d+/g);
                      return (
                        4 === e.length &&
                        ((e = e.map(function (e, t) {
                          return 100 * (t % 2 ? 1 - e : e);
                        })),
                        this.querySelector('path').setAttribute(
                          'd',
                          'M0,100 C' + e[0] + ',' + e[1] + ', ' + e[2] + ',' + e[3] + ', 100,0'
                        ),
                        (t = this.querySelectorAll('line'))[0].setAttribute('x2', e[0]),
                        t[0].setAttribute('y2', e[1]),
                        t[1].setAttribute('x2', e[2]),
                        t[1].setAttribute('y2', e[3]),
                        !0)
                      );
                    },
                    '*',
                    function () {
                      this._elt.innerHTML =
                        '<svg viewBox="-20 -20 140 140" width="100" height="100"><defs><marker id="prism-previewer-easing-marker" viewBox="0 0 4 4" refX="2" refY="2" markerUnits="strokeWidth"><circle cx="2" cy="2" r="1.5" /></marker></defs><path d="M0,100 C20,50, 40,30, 100,0" /><line x1="0" y1="100" x2="20" y2="50" marker-start="url(' +
                        location.href +
                        '#prism-previewer-easing-marker)" marker-end="url(' +
                        location.href +
                        '#prism-previewer-easing-marker)" /><line x1="100" y1="0" x2="40" y2="30" marker-start="url(' +
                        location.href +
                        '#prism-previewer-easing-marker)" marker-end="url(' +
                        location.href +
                        '#prism-previewer-easing-marker)" /></svg>';
                    }
                  );
                },
                tokens: {
                  easing: {
                    pattern:
                      /\bcubic-bezier\((?:-?\d*\.?\d+,\s*){3}-?\d*\.?\d+\)\B|\b(?:linear|ease(?:-in)?(?:-out)?)(?=\s|[;}]|$)/i,
                    inside: { function: /[\w-]+(?=\()/, punctuation: /[(),]/ },
                  },
                },
                languages: {
                  css: !0,
                  less: !0,
                  sass: [
                    {
                      lang: 'sass',
                      inside: 'inside',
                      before: 'punctuation',
                      root: E.languages.sass && E.languages.sass['variable-line'],
                    },
                    {
                      lang: 'sass',
                      inside: 'inside',
                      root: E.languages.sass && E.languages.sass['property-line'],
                    },
                  ],
                  scss: !0,
                  stylus: [
                    {
                      lang: 'stylus',
                      before: 'hexcode',
                      inside: 'rest',
                      root: E.languages.stylus && E.languages.stylus['property-declaration'].inside,
                    },
                    {
                      lang: 'stylus',
                      before: 'hexcode',
                      inside: 'rest',
                      root: E.languages.stylus && E.languages.stylus['variable-declaration'].inside,
                    },
                  ],
                },
              },
              time: {
                create: function () {
                  new E.plugins.Previewer(
                    'time',
                    function (e) {
                      var t = parseFloat(e),
                        e = e.match(/[a-z]+$/i);
                      return !(
                        !t ||
                        !e ||
                        ((e = e[0]),
                        (this.querySelector('circle').style.animationDuration = 2 * t + e),
                        0)
                      );
                    },
                    '*',
                    function () {
                      this._elt.innerHTML =
                        '<svg viewBox="0 0 64 64"><circle r="16" cy="32" cx="32"></circle></svg>';
                    }
                  );
                },
                tokens: { time: /(?:\b|\B-|(?=\B\.))\d*\.?\d+m?s\b/i },
                languages: {
                  css: !0,
                  less: !0,
                  markup: {
                    lang: 'markup',
                    before: 'punctuation',
                    inside: 'inside',
                    root: E.languages.markup && E.languages.markup.tag.inside['attr-value'],
                  },
                  sass: [
                    {
                      lang: 'sass',
                      inside: 'inside',
                      root: E.languages.sass && E.languages.sass['property-line'],
                    },
                    {
                      lang: 'sass',
                      before: 'operator',
                      inside: 'inside',
                      root: E.languages.sass && E.languages.sass['variable-line'],
                    },
                  ],
                  scss: !0,
                  stylus: [
                    {
                      lang: 'stylus',
                      before: 'hexcode',
                      inside: 'rest',
                      root: E.languages.stylus && E.languages.stylus['property-declaration'].inside,
                    },
                    {
                      lang: 'stylus',
                      before: 'hexcode',
                      inside: 'rest',
                      root: E.languages.stylus && E.languages.stylus['variable-declaration'].inside,
                    },
                  ],
                },
              },
            },
            K = /(?:^|\s)token(?=$|\s)/,
            V = /(?:^|\s)active(?=$|\s)/g,
            J = /(?:^|\s)flipped(?=$|\s)/g,
            L = function (e, t, n, r) {
              (this._elt = null),
                (this._type = e),
                (this._clsRegexp = RegExp('(?:^|\\s)' + e + '(?=$|\\s)')),
                (this._token = null),
                (this.updater = t),
                (this._mouseout = this.mouseout.bind(this)),
                (this.initializer = r);
              var a = this;
              (n = 'Array' !== E.util.type((n = n || ['*'])) ? [n] : n).forEach(function (e) {
                'string' != typeof e && (e = e.lang),
                  L.byLanguages[e] || (L.byLanguages[e] = []),
                  L.byLanguages[e].indexOf(a) < 0 && L.byLanguages[e].push(a);
              }),
                (L.byType[e] = this);
            };
          for (Y in ((L.prototype.init = function () {
            this._elt ||
              ((this._elt = document.createElement('div')),
              (this._elt.className = 'prism-previewer prism-previewer-' + this._type),
              document.body.appendChild(this._elt),
              this.initializer && this.initializer());
          }),
          (L.prototype.isDisabled = function (e) {
            do {
              if (e.hasAttribute && e.hasAttribute('data-previewers'))
                return (
                  -1 === (e.getAttribute('data-previewers') || '').split(/\s+/).indexOf(this._type)
                );
            } while ((e = e.parentNode));
            return !1;
          }),
          (L.prototype.check = function (e) {
            if (!K.test(e.className) || !this.isDisabled(e)) {
              do {
                if (K.test(e.className) && this._clsRegexp.test(e.className)) break;
              } while ((e = e.parentNode));
              e && e !== this._token && ((this._token = e), this.show());
            }
          }),
          (L.prototype.mouseout = function () {
            this._token.removeEventListener('mouseout', this._mouseout, !1),
              (this._token = null),
              this.hide();
          }),
          (L.prototype.show = function () {
            var e;
            this._elt || this.init(),
              this._token &&
                (this.updater.call(this._elt, this._token.textContent)
                  ? (this._token.addEventListener('mouseout', this._mouseout, !1),
                    (e = (function (e) {
                      var t = 0,
                        n = 0,
                        r = e;
                      if (r.parentNode) {
                        for (
                          ;
                          (t += r.offsetLeft),
                            (n += r.offsetTop),
                            (r = r.offsetParent) && r.nodeType < 9;

                        );
                        for (
                          r = e;
                          (t -= r.scrollLeft),
                            (n -= r.scrollTop),
                            (r = r.parentNode) && !/body/i.test(r.nodeName);

                        );
                      }
                      return {
                        top: n,
                        right: innerWidth - t - e.offsetWidth,
                        bottom: innerHeight - n - e.offsetHeight,
                        left: t,
                      };
                    })(this._token)),
                    (this._elt.className += ' active'),
                    0 < e.top - this._elt.offsetHeight
                      ? ((this._elt.className = this._elt.className.replace(J, '')),
                        (this._elt.style.top = e.top + 'px'),
                        (this._elt.style.bottom = ''))
                      : ((this._elt.className += ' flipped'),
                        (this._elt.style.bottom = e.bottom + 'px'),
                        (this._elt.style.top = '')),
                    (this._elt.style.left =
                      e.left + Math.min(200, this._token.offsetWidth / 2) + 'px'))
                  : this.hide());
          }),
          (L.prototype.hide = function () {
            this._elt.className = this._elt.className.replace(V, '');
          }),
          (L.byLanguages = {}),
          (L.byType = {}),
          (L.initEvents = function (e, t) {
            var n = [];
            L.byLanguages[t] && (n = n.concat(L.byLanguages[t])),
              L.byLanguages['*'] && (n = n.concat(L.byLanguages['*'])),
              e.addEventListener(
                'mouseover',
                function (e) {
                  var t = e.target;
                  n.forEach(function (e) {
                    e.check(t);
                  });
                },
                !1
              );
          }),
          (E.plugins.Previewer = L),
          E.hooks.add('before-highlight', function (o) {
            for (var i in $) {
              var e,
                s = $[i].languages;
              o.language &&
                s[o.language] &&
                !s[o.language].initialized &&
                ((e = s[o.language]),
                (e = 'Array' !== E.util.type(e) ? [e] : e).forEach(function (e) {
                  var t, n, r, a;
                  (e =
                    (!0 === e
                      ? ((t = 'important'), (n = o.language))
                      : ((t = e.before || 'important'),
                        (n = e.inside || e.lang),
                        (r = e.root || E.languages),
                        (a = e.skip)),
                    o.language)),
                    !a &&
                      E.languages[e] &&
                      (E.languages.insertBefore(n, t, $[i].tokens, r),
                      (o.grammar = E.languages[e]),
                      (s[o.language] = { initialized: !0 }));
                }));
            }
          }),
          E.hooks.add('after-highlight', function (e) {
            (L.byLanguages['*'] || L.byLanguages[e.language]) &&
              L.initEvents(e.element, e.language);
          }),
          $))
            $[Y].create();
        }
        function X(e) {
          var t, n, r, a, o, i, s, u;
          return (
            F[e] ||
            ((o =
              (t = e.match(/^(\b|\B-[a-z]{1,10}-)((?:repeating-)?(?:linear|radial)-gradient)/)) &&
              t[1]),
            (t = t && t[2]),
            (n = e
              .replace(
                /^(?:\b|\B-[a-z]{1,10}-)(?:repeating-)?(?:linear|radial)-gradient\(|\)$/g,
                ''
              )
              .split(/\s*,\s*/)),
            0 <= t.indexOf('linear')
              ? (F[e] =
                  ((o = o),
                  (i = t),
                  (u = '180deg'),
                  /^(?:-?\d*\.?\d+(?:deg|rad)|to\b|top|right|bottom|left)/.test((s = n)[0]) &&
                    (u = s.shift()).indexOf('to ') < 0 &&
                    (0 <= u.indexOf('top')
                      ? (u =
                          0 <= u.indexOf('left')
                            ? 'to bottom right'
                            : 0 <= u.indexOf('right')
                            ? 'to bottom left'
                            : 'to bottom')
                      : 0 <= u.indexOf('bottom')
                      ? (u =
                          0 <= u.indexOf('left')
                            ? 'to top right'
                            : 0 <= u.indexOf('right')
                            ? 'to top left'
                            : 'to top')
                      : 0 <= u.indexOf('left')
                      ? (u = 'to right')
                      : 0 <= u.indexOf('right')
                      ? (u = 'to left')
                      : o &&
                        (0 <= u.indexOf('deg')
                          ? (u = 90 - parseFloat(u) + 'deg')
                          : 0 <= u.indexOf('rad') && (u = Math.PI / 2 - parseFloat(u) + 'rad'))),
                  i + '(' + u + ',' + s.join(',') + ')'))
              : 0 <= t.indexOf('radial')
              ? (F[e] =
                  ((o = t),
                  (i = n)[0].indexOf('at') < 0
                    ? ((u = 'center'),
                      (s = 'ellipse'),
                      (r = 'farthest-corner'),
                      /\bcenter|top|right|bottom|left\b|^\d+/.test(i[0]) &&
                        (u = i.shift().replace(/\s*-?\d+(?:rad|deg)\s*/, '')),
                      /\bcircle|ellipse|closest|farthest|contain|cover\b/.test(i[0]) &&
                        (!(a = i.shift().split(/\s+/))[0] ||
                          ('circle' !== a[0] && 'ellipse' !== a[0]) ||
                          (s = a.shift()),
                        'cover' === (r = a[0] ? a.shift() : r)
                          ? (r = 'farthest-corner')
                          : 'contain' === r && (r = 'clothest-side')),
                      o + '(' + s + ' ' + r + ' at ' + u + ',' + i.join(',') + ')')
                    : o + '(' + i.join(',') + ')'))
              : (F[e] = t + '(' + n.join(',') + ')'))
          );
        }
        function Q(e) {
          this.defaults = x({}, e);
        }
        function ee(e) {
          for (var t = 0, n = 0; n < e.length; ++n)
            e.charCodeAt(n) == '\t'.charCodeAt(0) && (t += 3);
          return e.length + t;
        }
        (x =
          Object.assign ||
          function (e, t) {
            for (var n in t) t.hasOwnProperty(n) && (e[n] = t[n]);
            return e;
          }),
          (Q.prototype = {
            setDefaults: function (e) {
              this.defaults = x(this.defaults, e);
            },
            normalize: function (e, t) {
              for (var n in (t = x(this.defaults, t))) {
                var r = n.replace(/-(\w)/g, function (e, t) {
                  return t.toUpperCase();
                });
                'normalize' !== n &&
                  'setDefaults' !== r &&
                  t[n] &&
                  this[r] &&
                  (e = this[r].call(this, e, t[n]));
              }
              return e;
            },
            leftTrim: function (e) {
              return e.replace(/^\s+/, '');
            },
            rightTrim: function (e) {
              return e.replace(/\s+$/, '');
            },
            tabsToSpaces: function (e, t) {
              return (t = 0 | t || 4), e.replace(/\t/g, new Array(++t).join(' '));
            },
            spacesToTabs: function (e, t) {
              return (t = 0 | t || 4), e.replace(new RegExp(' {' + t + '}', 'g'), '\t');
            },
            removeTrailing: function (e) {
              return e.replace(/\s*?$/gm, '');
            },
            removeInitialLineFeed: function (e) {
              return e.replace(/^(?:\r?\n|\r)/, '');
            },
            removeIndent: function (e) {
              var t = e.match(/^[^\S\n\r]*(?=\S)/gm);
              return t &&
                t[0].length &&
                (t.sort(function (e, t) {
                  return e.length - t.length;
                }),
                t[0].length)
                ? e.replace(new RegExp('^' + t[0], 'gm'), '')
                : e;
            },
            indent: function (e, t) {
              return e.replace(/^[^\S\n\r]*(?=\S)/gm, new Array(++t).join('\t') + '$&');
            },
            breakLines: function (e, t) {
              t = (!0 !== t && 0 | t) || 80;
              for (var n = e.split('\n'), r = 0; r < n.length; ++r)
                if (!(ee(n[r]) <= t)) {
                  for (var a = n[r].split(/(\s+)/g), o = 0, i = 0; i < a.length; ++i) {
                    var s = ee(a[i]);
                    t < (o += s) && ((a[i] = '\n' + a[i]), (o = s));
                  }
                  n[r] = a.join('');
                }
              return n.join('\n');
            },
          }),
          e.exports && (e.exports = Q),
          void 0 !== E &&
            ((E.plugins.NormalizeWhitespace = new Q({
              'remove-trailing': !0,
              'remove-indent': !0,
              'left-trim': !0,
              'right-trim': !0,
            })),
            E.hooks.add('before-sanity-check', function (e) {
              var t = E.plugins.NormalizeWhitespace;
              if (!e.settings || !1 !== e.settings['whitespace-normalization'])
                if ((e.element && e.element.parentNode) || !e.code) {
                  var n = e.element.parentNode,
                    r = /\bno-whitespace-normalization\b/;
                  if (
                    e.code &&
                    n &&
                    'pre' === n.nodeName.toLowerCase() &&
                    !r.test(n.className) &&
                    !r.test(e.element.className)
                  ) {
                    for (var a = n.childNodes, o = '', i = '', s = !1, u = 0; u < a.length; ++u) {
                      var l = a[u];
                      l == e.element
                        ? (s = !0)
                        : '#text' === l.nodeName &&
                          (s ? (i += l.nodeValue) : (o += l.nodeValue), n.removeChild(l), --u);
                    }
                    e.element.children.length && E.plugins.KeepMarkup
                      ? ((r = o + e.element.innerHTML + i),
                        (e.element.innerHTML = t.normalize(r, e.settings)),
                        (e.code = e.element.textContent))
                      : ((e.code = o + e.code + i), (e.code = t.normalize(e.code, e.settings)));
                  }
                } else e.code = t.normalize(e.code, e.settings);
            })),
          'undefined' != typeof self &&
            self.Prism &&
            self.document &&
            (E.plugins.toolbar
              ? ((k = (k = window.ClipboardJS || void 0) || te(117)),
                (w = []),
                k ||
                  ((S = document.createElement('script')),
                  (_ = document.querySelector('head')),
                  (S.onload = function () {
                    if ((k = window.ClipboardJS)) for (; w.length; ) w.pop()();
                  }),
                  (S.src =
                    'https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js'),
                  _.appendChild(S)),
                E.plugins.toolbar.registerButton('copy-to-clipboard', function (t) {
                  var n = document.createElement('button');
                  return (
                    (n.innerHTML = 'Copy'),
                    (n.classList = 'btn-copy-code btn btn-sm'),
                    n.setAttribute('data-mdb-ripple-color', 'dark'),
                    n.setAttribute('data-mdb-ripple-unbound', 'true'),
                    k ? e() : w.push(e),
                    n
                  );
                  function e() {
                    var e = new k(n, {
                      text: function () {
                        return t.code;
                      },
                    });
                    e.on('success', function () {
                      (n.textContent = 'Copied!'), r();
                    }),
                      e.on('error', function () {
                        (n.textContent = 'Press Ctrl+C to copy'), r();
                      });
                  }
                  function r() {
                    setTimeout(function () {
                      n.innerHTML = 'Copy';
                    }, 5e3);
                  }
                }))
              : console.warn('Copy to Clipboard plugin loaded before Toolbar plugin.'));
      }.call(this, te(69)(e), te(36));
  },
  function (e, t) {
    e.exports = function (e) {
      var t;
      return (
        e.webpackPolyfill ||
          ((t = Object.create(e)).children || (t.children = []),
          Object.defineProperty(t, 'loaded', {
            enumerable: !0,
            get: function () {
              return t.l;
            },
          }),
          Object.defineProperty(t, 'id', {
            enumerable: !0,
            get: function () {
              return t.i;
            },
          }),
          Object.defineProperty(t, 'exports', { enumerable: !0 }),
          (t.webpackPolyfill = 1)),
        t
      );
    };
  },
  function (e, t, n) {
    'use strict';
    var r = {}.propertyIsEnumerable,
      a = Object.getOwnPropertyDescriptor,
      o = a && !r.call({ 1: 2 }, 1);
    t.f = o
      ? function (e) {
          e = a(this, e);
          return !!e && e.enumerable;
        }
      : r;
  },
  function (e, t, n) {
    var r = n(1),
      a = n(0),
      o = n(12),
      i = Object,
      s = r(''.split);
    e.exports = a(function () {
      return !i('z').propertyIsEnumerable(0);
    })
      ? function (e) {
          return 'String' == o(e) ? s(e, '') : i(e);
        }
      : i;
  },
  function (e, t, n) {
    var r = n(8),
      a = n(9),
      o = n(40),
      i = n(44),
      s = n(73),
      n = n(6),
      u = TypeError,
      l = n('toPrimitive');
    e.exports = function (e, t) {
      if (!a(e) || o(e)) return e;
      var n = i(e, l);
      if (n) {
        if (((n = r(n, e, (t = void 0 === t ? 'default' : t))), !a(n) || o(n))) return n;
        throw u("Can't convert object to primitive value");
      }
      return s(e, (t = void 0 === t ? 'number' : t));
    };
  },
  function (e, t, n) {
    var a = n(8),
      o = n(2),
      i = n(9),
      s = TypeError;
    e.exports = function (e, t) {
      var n, r;
      if ('string' === t && o((n = e.toString)) && !i((r = a(n, e)))) return r;
      if (o((n = e.valueOf)) && !i((r = a(n, e)))) return r;
      if ('string' !== t && o((n = e.toString)) && !i((r = a(n, e)))) return r;
      throw s("Can't convert object to primitive value");
    };
  },
  function (e, t) {
    e.exports = !1;
  },
  function (e, t, n) {
    var r = n(0),
      a = n(2),
      o = n(5),
      i = n(4),
      s = n(51).CONFIGURABLE,
      u = n(76),
      n = n(31),
      l = n.enforce,
      c = n.get,
      p = Object.defineProperty,
      g =
        i &&
        !r(function () {
          return 8 !== p(function () {}, 'length', { value: 8 }).length;
        }),
      d = String(String).split('String'),
      n = (e.exports = function (e, t, n) {
        'Symbol(' === String(t).slice(0, 7) &&
          (t = '[' + String(t).replace(/^Symbol\(([^)]*)\)/, '$1') + ']'),
          n && n.getter && (t = 'get ' + t),
          n && n.setter && (t = 'set ' + t),
          (!o(e, 'name') || (s && e.name !== t)) &&
            (i ? p(e, 'name', { value: t, configurable: !0 }) : (e.name = t)),
          g && n && o(n, 'arity') && e.length !== n.arity && p(e, 'length', { value: n.arity });
        try {
          n && o(n, 'constructor') && n.constructor
            ? i && p(e, 'prototype', { writable: !1 })
            : e.prototype && (e.prototype = void 0);
        } catch (e) {}
        n = l(e);
        return o(n, 'source') || (n.source = d.join('string' == typeof t ? t : '')), e;
      });
    Function.prototype.toString = n(function () {
      return (a(this) && c(this).source) || u(this);
    }, 'toString');
  },
  function (e, t, n) {
    var r = n(1),
      a = n(2),
      n = n(27),
      o = r(Function.toString);
    a(n.inspectSource) ||
      (n.inspectSource = function (e) {
        return o(e);
      }),
      (e.exports = n.inspectSource);
  },
  function (e, t, n) {
    var r = n(3),
      n = n(2),
      r = r.WeakMap;
    e.exports = n(r) && /native code/.test(String(r));
  },
  function (e, t, n) {
    var u = n(5),
      l = n(79),
      c = n(38),
      p = n(10);
    e.exports = function (e, t, n) {
      for (var r = l(t), a = p.f, o = c.f, i = 0; i < r.length; i++) {
        var s = r[i];
        u(e, s) || (n && u(n, s)) || a(e, s, o(t, s));
      }
    };
  },
  function (e, t, n) {
    var r = n(14),
      a = n(1),
      o = n(53),
      i = n(82),
      s = n(7),
      u = a([].concat);
    e.exports =
      r('Reflect', 'ownKeys') ||
      function (e) {
        var t = o.f(s(e)),
          n = i.f;
        return n ? u(t, n(e)) : t;
      };
  },
  function (e, t, n) {
    function r(s) {
      return function (e, t, n) {
        var r,
          a = u(e),
          o = c(a),
          i = l(n, o);
        if (s && t != t) {
          for (; i < o; ) if ((r = a[i++]) != r) return !0;
        } else for (; i < o; i++) if ((s || i in a) && a[i] === t) return s || i || 0;
        return !s && -1;
      };
    }
    var u = n(15),
      l = n(55),
      c = n(33);
    e.exports = { includes: r(!0), indexOf: r(!1) };
  },
  function (e, t) {
    var n = Math.ceil,
      r = Math.floor;
    e.exports =
      Math.trunc ||
      function (e) {
        e = +e;
        return (0 < e ? r : n)(e);
      };
  },
  function (e, t) {
    t.f = Object.getOwnPropertySymbols;
  },
  function (e, t, n) {
    var r = n(84),
      a = n(2),
      o = n(12),
      i = n(6)('toStringTag'),
      s = Object,
      u =
        'Arguments' ==
        o(
          (function () {
            return arguments;
          })()
        );
    e.exports = r
      ? o
      : function (e) {
          var t;
          return void 0 === e
            ? 'Undefined'
            : null === e
            ? 'Null'
            : 'string' ==
              typeof (t = (function (e, t) {
                try {
                  return e[t];
                } catch (e) {}
              })((e = s(e)), i))
            ? t
            : u
            ? o(e)
            : 'Object' == (t = o(e)) && a(e.callee)
            ? 'Arguments'
            : t;
        };
  },
  function (e, t, n) {
    var r = {};
    (r[n(6)('toStringTag')] = 'z'), (e.exports = '[object z]' === String(r));
  },
  function (e, t, n) {
    function r() {}
    function a(e) {
      e.write(h('')), e.close();
      var t = e.parentWindow.Object;
      return (e = null), t;
    }
    var o,
      i = n(7),
      s = n(86),
      u = n(34),
      l = n(32),
      c = n(88),
      p = n(49),
      n = n(52),
      g = 'prototype',
      d = 'script',
      f = n('IE_PROTO'),
      h = function (e) {
        return '<' + d + '>' + e + '</' + d + '>';
      },
      m = function () {
        try {
          o = new ActiveXObject('htmlfile');
        } catch (e) {}
        m =
          'undefined' == typeof document || (document.domain && o)
            ? a(o)
            : ((e = p('iframe')),
              (t = 'java' + d + ':'),
              (e.style.display = 'none'),
              c.appendChild(e),
              (e.src = String(t)),
              (t = e.contentWindow.document).open(),
              t.write(h('document.F=Object')),
              t.close(),
              t.F);
        for (var e, t, n = u.length; n--; ) delete m[g][u[n]];
        return m();
      };
    (l[f] = !0),
      (e.exports =
        Object.create ||
        function (e, t) {
          var n;
          return (
            null !== e ? ((r[g] = i(e)), (n = new r()), (r[g] = null), (n[f] = e)) : (n = m()),
            void 0 === t ? n : s.f(n, t)
          );
        });
  },
  function (e, t, n) {
    var r = n(4),
      a = n(50),
      s = n(10),
      u = n(7),
      l = n(15),
      c = n(87);
    t.f =
      r && !a
        ? Object.defineProperties
        : function (e, t) {
            u(e);
            for (var n, r = l(t), a = c(t), o = a.length, i = 0; i < o; )
              s.f(e, (n = a[i++]), r[n]);
            return e;
          };
  },
  function (e, t, n) {
    var r = n(54),
      a = n(34);
    e.exports =
      Object.keys ||
      function (e) {
        return r(e, a);
      };
  },
  function (e, t, n) {
    n = n(14);
    e.exports = n('document', 'documentElement');
  },
  function (e, t, n) {
    'use strict';
    var w = n(90),
      a = n(8),
      r = n(1),
      o = n(91),
      i = n(0),
      S = n(7),
      _ = n(2),
      s = n(23),
      A = n(18),
      E = n(56),
      j = n(11),
      u = n(13),
      O = n(93),
      l = n(44),
      C = n(95),
      P = n(96),
      c = n(6)('replace'),
      T = Math.max,
      B = Math.min,
      F = r([].concat),
      $ = r([].push),
      L = r(''.indexOf),
      R = r(''.slice),
      n = '$0' === 'a'.replace(/./, '$0'),
      p = !!/./[c] && '' === /./[c]('a', '$0');
    o(
      'replace',
      function (e, v, x) {
        var k = p ? '$' : '$0';
        return [
          function (e, t) {
            var n = u(this),
              r = s(e) ? void 0 : l(e, c);
            return r ? a(r, e, n, t) : a(v, j(n), e, t);
          },
          function (e, t) {
            var n = S(this),
              r = j(e);
            if ('string' == typeof t && -1 === L(t, k) && -1 === L(t, '$<')) {
              e = x(v, n, r, t);
              if (e.done) return e.value;
            }
            for (
              var a,
                o = _(t),
                i = (o || (t = j(t)), n.global),
                s = (i && ((a = n.unicode), (n.lastIndex = 0)), []);
              null !== (g = P(n, r)) && ($(s, g), i);

            )
              '' === j(g[0]) && (n.lastIndex = O(r, E(n.lastIndex), a));
            for (var u, l = '', c = 0, p = 0; p < s.length; p++) {
              for (
                var g, d = j((g = s[p])[0]), f = T(B(A(g.index), r.length), 0), h = [], m = 1;
                m < g.length;
                m++
              )
                $(h, void 0 === (u = g[m]) ? u : String(u));
              var b = g.groups,
                y = o
                  ? ((y = F([d], h, f, r)), void 0 !== b && $(y, b), j(w(t, void 0, y)))
                  : C(d, r, f, h, b, t);
              c <= f && ((l += R(r, c, f) + y), (c = f + d.length));
            }
            return l + R(r, c);
          },
        ];
      },
      !!i(function () {
        var e = /./;
        return (
          (e.exec = function () {
            var e = [];
            return (e.groups = { a: '7' }), e;
          }),
          '7' !== ''.replace(e, '$<a>')
        );
      }) ||
        !n ||
        p
    );
  },
  function (e, t, n) {
    var n = n(21),
      r = Function.prototype,
      a = r.apply,
      o = r.call;
    e.exports =
      ('object' == typeof Reflect && Reflect.apply) ||
      (n
        ? o.bind(a)
        : function () {
            return o.apply(a, arguments);
          });
  },
  function (e, t, n) {
    'use strict';
    n(37);
    var u = n(92),
      l = n(30),
      c = n(35),
      p = n(0),
      g = n(6),
      d = n(17),
      f = g('species'),
      h = RegExp.prototype;
    e.exports = function (n, e, t, r) {
      var i,
        a = g(n),
        s = !p(function () {
          var e = {};
          return (
            (e[a] = function () {
              return 7;
            }),
            7 != ''[n](e)
          );
        }),
        o =
          s &&
          !p(function () {
            var e = !1,
              t = /a/;
            return (
              'split' === n &&
                (((t = { constructor: {} }).constructor[f] = function () {
                  return t;
                }),
                (t.flags = ''),
                (t[a] = /./[a])),
              (t.exec = function () {
                return (e = !0), null;
              }),
              t[a](''),
              !e
            );
          });
      (s && o && !t) ||
        ((i = u(/./[a])),
        (o = e(a, ''[n], function (e, t, n, r, a) {
          var e = u(e),
            o = t.exec;
          return o === c || o === h.exec
            ? s && !a
              ? { done: !0, value: i(t, n, r) }
              : { done: !0, value: e(n, t, r) }
            : { done: !1 };
        })),
        l(String.prototype, n, o[0]),
        l(h, a, o[1])),
        r && d(h[a], 'sham', !0);
    };
  },
  function (e, t, n) {
    var r = n(12),
      a = n(1);
    e.exports = function (e) {
      if ('Function' === r(e)) return a(e);
    };
  },
  function (e, t, n) {
    'use strict';
    var r = n(94).charAt;
    e.exports = function (e, t, n) {
      return t + (n ? r(e, t).length : 1);
    };
  },
  function (e, t, n) {
    function r(a) {
      return function (e, t) {
        var n,
          e = i(s(e)),
          t = o(t),
          r = e.length;
        return t < 0 || r <= t
          ? a
            ? ''
            : void 0
          : (n = l(e, t)) < 55296 ||
            56319 < n ||
            t + 1 === r ||
            (r = l(e, t + 1)) < 56320 ||
            57343 < r
          ? a
            ? u(e, t)
            : n
          : a
          ? c(e, t, t + 2)
          : r - 56320 + ((n - 55296) << 10) + 65536;
      };
    }
    var a = n(1),
      o = n(18),
      i = n(11),
      s = n(13),
      u = a(''.charAt),
      l = a(''.charCodeAt),
      c = a(''.slice);
    e.exports = { codeAt: r(!1), charAt: r(!0) };
  },
  function (e, t, n) {
    var r = n(1),
      a = n(29),
      g = Math.floor,
      d = r(''.charAt),
      f = r(''.replace),
      h = r(''.slice),
      m = /\$([$&'`]|\d{1,2}|<[^>]*>)/g,
      b = /\$([$&'`]|\d{1,2})/g;
    e.exports = function (o, i, s, u, l, e) {
      var c = s + o.length,
        p = u.length,
        t = b;
      return (
        void 0 !== l && ((l = a(l)), (t = m)),
        f(e, t, function (e, t) {
          var n;
          switch (d(t, 0)) {
            case '$':
              return '$';
            case '&':
              return o;
            case '`':
              return h(i, 0, s);
            case "'":
              return h(i, c);
            case '<':
              n = l[h(t, 1, -1)];
              break;
            default:
              var r,
                a = +t;
              if (0 == a) return e;
              if (p < a)
                return 0 !== (r = g(a / 10)) && r <= p
                  ? void 0 === u[r - 1]
                    ? d(t, 1)
                    : u[r - 1] + d(t, 1)
                  : e;
              n = u[a - 1];
          }
          return void 0 === n ? '' : n;
        })
      );
    };
  },
  function (e, t, n) {
    var r = n(8),
      a = n(7),
      o = n(2),
      i = n(12),
      s = n(35),
      u = TypeError;
    e.exports = function (e, t) {
      var n = e.exec;
      if (o(n)) return null !== (n = r(n, e, t)) && a(n), n;
      if ('RegExp' === i(e)) return r(s, e, t);
      throw u('RegExp#exec called on incompatible receiver');
    };
  },
  function (R, N, e) {
    var t = e(4),
      n = e(3),
      r = e(1),
      a = e(57),
      l = e(98),
      c = e(17),
      o = e(53).f,
      p = e(25),
      g = e(101),
      d = e(11),
      f = e(102),
      i = e(59),
      s = e(103),
      u = e(30),
      h = e(0),
      m = e(5),
      b = e(31).enforce,
      y = e(104),
      v = e(6),
      x = e(60),
      k = e(61),
      w = v('match'),
      S = n.RegExp,
      _ = S.prototype,
      A = n.SyntaxError,
      E = r(_.exec),
      j = r(''.charAt),
      O = r(''.replace),
      C = r(''.indexOf),
      M = r(''.slice),
      I = /^\?<[^\s\d!#%&*+<=>@^][^\s!#%&*+<=>@^]*>/,
      P = /a/g,
      T = /a/g,
      e = new S(P) !== P,
      B = i.MISSED_STICKY,
      z = i.UNSUPPORTED_Y,
      v =
        t &&
        (!e ||
          B ||
          x ||
          k ||
          h(function () {
            return (T[w] = !1), S(P) != P || S(T) == T || '/a/i' != S(P, 'i');
          }));
    if (a('RegExp', v)) {
      function F(e, t) {
        var n,
          r,
          a = p(_, this),
          o = g(e),
          i = void 0 === t,
          s = [],
          u = e;
        if (!a && o && i && e.constructor === F) return e;
        if (
          ((o || p(_, e)) && ((e = e.source), i) && (t = f(u)),
          (e = void 0 === e ? '' : d(e)),
          (t = void 0 === t ? '' : d(t)),
          (u = e),
          (o = t = x && 'dotAll' in P && (n = !!t && -1 < C(t, 's')) ? O(t, /s/g, '') : t),
          B && 'sticky' in P && (r = !!t && -1 < C(t, 'y')) && z && (t = O(t, /y/g, '')),
          k &&
            ((e = (i = (function (e) {
              for (
                var t, n = e.length, r = 0, a = '', o = [], i = {}, s = !1, u = !1, l = 0, c = '';
                r <= n;
                r++
              ) {
                if ('\\' === (t = j(e, r))) t += j(e, ++r);
                else if (']' === t) s = !1;
                else if (!s)
                  switch (!0) {
                    case '[' === t:
                      s = !0;
                      break;
                    case '(' === t:
                      E(I, M(e, r + 1)) && ((r += 2), (u = !0)), (a += t), l++;
                      continue;
                    case '>' === t && u:
                      if ('' === c || m(i, c)) throw new A('Invalid capture group name');
                      (i[c] = !0), (u = !(o[o.length] = [c, l])), (c = '');
                      continue;
                  }
                u ? (c += t) : (a += t);
              }
              return [a, o];
            })(e))[0]),
            (s = i[1])),
          (i = l(S(e, t), a ? this : _, F)),
          (n || r || s.length) &&
            ((t = b(i)),
            n &&
              ((t.dotAll = !0),
              (t.raw = F(
                (function (e) {
                  for (var t, n = e.length, r = 0, a = '', o = !1; r <= n; r++)
                    '\\' === (t = j(e, r))
                      ? (a += t + j(e, ++r))
                      : o || '.' !== t
                      ? ('[' === t ? (o = !0) : ']' === t && (o = !1), (a += t))
                      : (a += '[\\s\\S]');
                  return a;
                })(e),
                o
              ))),
            r && (t.sticky = !0),
            s.length) &&
            (t.groups = s),
          e !== u)
        )
          try {
            c(i, 'source', '' === u ? '(?:)' : u);
          } catch (e) {}
        return i;
      }
      for (var $ = o(S), L = 0; $.length > L; ) s(F, S, $[L++]);
      ((_.constructor = F).prototype = _), u(n, 'RegExp', F, { constructor: !0 });
    }
    y('RegExp');
  },
  function (e, t, n) {
    var r = n(2),
      a = n(9),
      o = n(99);
    e.exports = function (e, t, n) {
      return (
        o &&
          r((t = t.constructor)) &&
          t !== n &&
          a((t = t.prototype)) &&
          t !== n.prototype &&
          o(e, t),
        e
      );
    };
  },
  function (e, t, n) {
    var a = n(1),
      o = n(7),
      i = n(100);
    e.exports =
      Object.setPrototypeOf ||
      ('__proto__' in {}
        ? (function () {
            var n,
              r = !1,
              e = {};
            try {
              (n = a(Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set))(e, []),
                (r = e instanceof Array);
            } catch (e) {}
            return function (e, t) {
              return o(e), i(t), r ? n(e, t) : (e.__proto__ = t), e;
            };
          })()
        : void 0);
  },
  function (e, t, n) {
    var r = n(2),
      a = String,
      o = TypeError;
    e.exports = function (e) {
      if ('object' == typeof e || r(e)) return e;
      throw o("Can't set " + a(e) + ' as a prototype');
    };
  },
  function (e, t, n) {
    var r = n(9),
      a = n(12),
      o = n(6)('match');
    e.exports = function (e) {
      var t;
      return r(e) && (void 0 !== (t = e[o]) ? !!t : 'RegExp' == a(e));
    };
  },
  function (e, t, n) {
    var r = n(8),
      a = n(5),
      o = n(25),
      i = n(58),
      s = RegExp.prototype;
    e.exports = function (e) {
      var t = e.flags;
      return void 0 !== t || 'flags' in s || a(e, 'flags') || !o(s, e) ? t : r(i, e);
    };
  },
  function (e, t, n) {
    var r = n(10).f;
    e.exports = function (e, t, n) {
      n in e ||
        r(e, n, {
          configurable: !0,
          get: function () {
            return t[n];
          },
          set: function (e) {
            t[n] = e;
          },
        });
    };
  },
  function (e, t, n) {
    'use strict';
    var r = n(14),
      a = n(10),
      o = n(6),
      i = n(4),
      s = o('species');
    e.exports = function (e) {
      var e = r(e),
        t = a.f;
      i &&
        e &&
        !e[s] &&
        t(e, s, {
          configurable: !0,
          get: function () {
            return this;
          },
        });
    };
  },
  function (e, t, n) {
    'use strict';
    var r = n(20),
      a = n(106).trim;
    r(
      { target: 'String', proto: !0, forced: n(107)('trim') },
      {
        trim: function () {
          return a(this);
        },
      }
    );
  },
  function (e, t, n) {
    function r(t) {
      return function (e) {
        e = i(o(e));
        return 1 & t && (e = s(e, u, '')), (e = 2 & t ? s(e, l, '') : e);
      };
    }
    var a = n(1),
      o = n(13),
      i = n(11),
      n = n(62),
      s = a(''.replace),
      a = '[' + n + ']',
      u = RegExp('^' + a + a + '*'),
      l = RegExp(a + a + '*$');
    e.exports = { start: r(1), end: r(2), trim: r(3) };
  },
  function (e, t, n) {
    var r = n(51).PROPER,
      a = n(0),
      o = n(62);
    e.exports = function (e) {
      return a(function () {
        return !!o[e]() || '​᠎' !== '​᠎'[e]() || (r && o[e].name !== e);
      });
    };
  },
  function (e, t, n) {
    'use strict';
    var r = n(20),
      a = n(1),
      s = n(45),
      u = n(29),
      l = n(33),
      c = n(109),
      p = n(11),
      o = n(0),
      g = n(110),
      i = n(113),
      d = n(114),
      f = n(115),
      h = n(43),
      m = n(116),
      b = [],
      y = a(b.sort),
      v = a(b.push),
      n = o(function () {
        b.sort(void 0);
      }),
      a = o(function () {
        b.sort(null);
      }),
      i = i('sort'),
      x = !o(function () {
        if (h) return h < 70;
        if (!(d && 3 < d)) {
          if (f) return !0;
          if (m) return m < 603;
          for (var e, t, n, r = '', a = 65; a < 76; a++) {
            switch (((e = String.fromCharCode(a)), a)) {
              case 66:
              case 69:
              case 70:
              case 72:
                t = 3;
                break;
              case 68:
              case 71:
                t = 4;
                break;
              default:
                t = 2;
            }
            for (n = 0; n < 47; n++) b.push({ k: e + n, v: t });
          }
          for (
            b.sort(function (e, t) {
              return t.v - e.v;
            }),
              n = 0;
            n < b.length;
            n++
          )
            (e = b[n].k.charAt(0)), r.charAt(r.length - 1) !== e && (r += e);
          return 'DGBEFHACIJK' !== r;
        }
      });
    r(
      { target: 'Array', proto: !0, forced: n || !a || !i || !x },
      {
        sort: function (e) {
          void 0 !== e && s(e);
          var t = u(this);
          if (x) return void 0 === e ? y(t) : y(t, e);
          for (var n, r, a = [], o = l(t), i = 0; i < o; i++) i in t && v(a, t[i]);
          for (
            g(
              a,
              ((r = e),
              function (e, t) {
                return void 0 === t
                  ? -1
                  : void 0 === e
                  ? 1
                  : void 0 !== r
                  ? +r(e, t) || 0
                  : p(e) > p(t)
                  ? 1
                  : -1;
              })
            ),
              n = l(a),
              i = 0;
            i < n;

          )
            t[i] = a[i++];
          for (; i < o; ) c(t, i++);
          return t;
        },
      }
    );
  },
  function (e, t, n) {
    'use strict';
    var r = n(46),
      a = TypeError;
    e.exports = function (e, t) {
      if (!delete e[t]) throw a('Cannot delete property ' + r(t) + ' of ' + r(e));
    };
  },
  function (e, t, n) {
    function y(e, t) {
      var n = e.length,
        r = x(n / 2);
      if (n < 8) {
        for (var a, o, i = e, s = t, u = i.length, l = 1; l < u; ) {
          for (a = i[(o = l)]; o && 0 < s(i[o - 1], a); ) i[o] = i[--o];
          o !== l++ && (i[o] = a);
        }
        return i;
      }
      for (
        var c = e,
          p = y(v(e, 0, r), t),
          g = y(v(e, r), t),
          d = t,
          f = p.length,
          h = g.length,
          m = 0,
          b = 0;
        m < f || b < h;

      )
        c[m + b] =
          m < f && b < h ? (d(p[m], g[b]) <= 0 ? p[m++] : g[b++]) : m < f ? p[m++] : g[b++];
      return c;
    }
    var v = n(111),
      x = Math.floor;
    e.exports = y;
  },
  function (e, t, n) {
    var u = n(55),
      l = n(33),
      c = n(112),
      p = Array,
      g = Math.max;
    e.exports = function (e, t, n) {
      for (
        var r = l(e), a = u(t, r), o = u(void 0 === n ? r : n, r), i = p(g(o - a, 0)), s = 0;
        a < o;
        a++, s++
      )
        c(i, s, e[a]);
      return (i.length = s), i;
    };
  },
  function (e, t, n) {
    'use strict';
    var r = n(24),
      a = n(10),
      o = n(22);
    e.exports = function (e, t, n) {
      t = r(t);
      t in e ? a.f(e, t, o(0, n)) : (e[t] = n);
    };
  },
  function (e, t, n) {
    'use strict';
    var r = n(0);
    e.exports = function (e, t) {
      var n = [][e];
      return (
        !!n &&
        r(function () {
          n.call(
            null,
            t ||
              function () {
                return 1;
              },
            1
          );
        })
      );
    };
  },
  function (e, t, n) {
    n = n(16).match(/firefox\/(\d+)/i);
    e.exports = !!n && +n[1];
  },
  function (e, t, n) {
    n = n(16);
    e.exports = /MSIE|Trident/.test(n);
  },
  function (e, t, n) {
    n = n(16).match(/AppleWebKit\/(\d+)\./);
    e.exports = !!n && +n[1];
  },
  function (e, t, n) {
    /*!
     * clipboard.js v2.0.11
     * https://clipboardjs.com/
     *
     * Licensed MIT © Zeno Rocha
     */
    var r;
    (r = function () {
      return (
        (n = {
          686: function (e, t, n) {
            'use strict';
            n.d(t, {
              default: function () {
                return y;
              },
            });
            var t = n(279),
              t = n.n(t),
              r = n(370),
              o = n.n(r),
              r = n(817),
              a = n.n(r);
            function i(e) {
              try {
                document.execCommand(e);
              } catch (e) {}
            }
            var s = function (e) {
              e = a()(e);
              return i('cut'), e;
            };
            function u(e, t) {
              (e = e),
                (r = 'rtl' === document.documentElement.getAttribute('dir')),
                ((n = document.createElement('textarea')).style.fontSize = '12pt'),
                (n.style.border = '0'),
                (n.style.padding = '0'),
                (n.style.margin = '0'),
                (n.style.position = 'absolute'),
                (n.style[r ? 'right' : 'left'] = '-9999px'),
                (r = window.pageYOffset || document.documentElement.scrollTop),
                (n.style.top = ''.concat(r, 'px')),
                n.setAttribute('readonly', ''),
                (n.value = e);
              var n,
                r = n,
                e = (t.container.appendChild(r), a()(r));
              return i('copy'), r.remove(), e;
            }
            var l = function (e) {
              var t =
                  1 < arguments.length && void 0 !== arguments[1]
                    ? arguments[1]
                    : { container: document.body },
                n = '';
              return (
                'string' == typeof e
                  ? (n = u(e, t))
                  : e instanceof HTMLInputElement &&
                    !['text', 'search', 'url', 'tel', 'password'].includes(
                      null == e ? void 0 : e.type
                    )
                  ? (n = u(e.value, t))
                  : ((n = a()(e)), i('copy')),
                n
              );
            };
            function c(e) {
              return (c =
                'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                  ? function (e) {
                      return typeof e;
                    }
                  : function (e) {
                      return e &&
                        'function' == typeof Symbol &&
                        e.constructor === Symbol &&
                        e !== Symbol.prototype
                        ? 'symbol'
                        : typeof e;
                    })(e);
            }
            var p = function () {
              var e = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {},
                t = e.action,
                t = void 0 === t ? 'copy' : t,
                n = e.container,
                r = e.target,
                e = e.text;
              if ('copy' !== t && 'cut' !== t)
                throw new Error('Invalid "action" value, use either "copy" or "cut"');
              if (void 0 !== r) {
                if (!r || 'object' !== c(r) || 1 !== r.nodeType)
                  throw new Error('Invalid "target" value, use a valid Element');
                if ('copy' === t && r.hasAttribute('disabled'))
                  throw new Error(
                    'Invalid "target" attribute. Please use "readonly" instead of "disabled" attribute'
                  );
                if ('cut' === t && (r.hasAttribute('readonly') || r.hasAttribute('disabled')))
                  throw new Error(
                    'Invalid "target" attribute. You can\'t cut text from elements with "readonly" or "disabled" attributes'
                  );
              }
              return e
                ? l(e, { container: n })
                : r
                ? 'cut' === t
                  ? s(r)
                  : l(r, { container: n })
                : void 0;
            };
            function g(e) {
              return (g =
                'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                  ? function (e) {
                      return typeof e;
                    }
                  : function (e) {
                      return e &&
                        'function' == typeof Symbol &&
                        e.constructor === Symbol &&
                        e !== Symbol.prototype
                        ? 'symbol'
                        : typeof e;
                    })(e);
            }
            function d(e, t) {
              for (var n = 0; n < t.length; n++) {
                var r = t[n];
                (r.enumerable = r.enumerable || !1),
                  (r.configurable = !0),
                  'value' in r && (r.writable = !0),
                  Object.defineProperty(e, r.key, r);
              }
            }
            function f(e, t) {
              return (f =
                Object.setPrototypeOf ||
                function (e, t) {
                  return (e.__proto__ = t), e;
                })(e, t);
            }
            function h(n) {
              var r = (function () {
                if ('undefined' == typeof Reflect || !Reflect.construct) return !1;
                if (Reflect.construct.sham) return !1;
                if ('function' == typeof Proxy) return !0;
                try {
                  return (
                    Date.prototype.toString.call(Reflect.construct(Date, [], function () {})), !0
                  );
                } catch (e) {
                  return !1;
                }
              })();
              return function () {
                var e,
                  t = m(n),
                  t =
                    ((e = r
                      ? ((e = m(this).constructor), Reflect.construct(t, arguments, e))
                      : t.apply(this, arguments)),
                    this);
                if (!e || ('object' !== g(e) && 'function' != typeof e)) {
                  if (void 0 !== t) return t;
                  throw new ReferenceError(
                    "this hasn't been initialised - super() hasn't been called"
                  );
                }
                return e;
              };
            }
            function m(e) {
              return (m = Object.setPrototypeOf
                ? Object.getPrototypeOf
                : function (e) {
                    return e.__proto__ || Object.getPrototypeOf(e);
                  })(e);
            }
            function b(e, t) {
              e = 'data-clipboard-'.concat(e);
              if (t.hasAttribute(e)) return t.getAttribute(e);
            }
            var y = (function (e) {
              var t = a;
              if ('function' != typeof e && null !== e)
                throw new TypeError('Super expression must either be null or a function');
              (t.prototype = Object.create(e && e.prototype, {
                constructor: { value: t, writable: !0, configurable: !0 },
              })),
                e && f(t, e);
              var n,
                r = h(a);
              function a(e, t) {
                var n;
                if (this instanceof a)
                  return (n = r.call(this)).resolveOptions(t), n.listenClick(e), n;
                throw new TypeError('Cannot call a class as a function');
              }
              return (
                (t = a),
                (e = [
                  {
                    key: 'copy',
                    value: function (e) {
                      var t =
                        1 < arguments.length && void 0 !== arguments[1]
                          ? arguments[1]
                          : { container: document.body };
                      return l(e, t);
                    },
                  },
                  {
                    key: 'cut',
                    value: function (e) {
                      return s(e);
                    },
                  },
                  {
                    key: 'isSupported',
                    value: function () {
                      var e =
                          0 < arguments.length && void 0 !== arguments[0]
                            ? arguments[0]
                            : ['copy', 'cut'],
                        e = 'string' == typeof e ? [e] : e,
                        t = !!document.queryCommandSupported;
                      return (
                        e.forEach(function (e) {
                          t = t && !!document.queryCommandSupported(e);
                        }),
                        t
                      );
                    },
                  },
                ]),
                (n = [
                  {
                    key: 'resolveOptions',
                    value: function () {
                      var e = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {};
                      (this.action = 'function' == typeof e.action ? e.action : this.defaultAction),
                        (this.target =
                          'function' == typeof e.target ? e.target : this.defaultTarget),
                        (this.text = 'function' == typeof e.text ? e.text : this.defaultText),
                        (this.container =
                          'object' === g(e.container) ? e.container : document.body);
                    },
                  },
                  {
                    key: 'listenClick',
                    value: function (e) {
                      var t = this;
                      this.listener = o()(e, 'click', function (e) {
                        return t.onClick(e);
                      });
                    },
                  },
                  {
                    key: 'onClick',
                    value: function (e) {
                      var t = e.delegateTarget || e.currentTarget,
                        e = this.action(t) || 'copy',
                        n = p({
                          action: e,
                          container: this.container,
                          target: this.target(t),
                          text: this.text(t),
                        });
                      this.emit(n ? 'success' : 'error', {
                        action: e,
                        text: n,
                        trigger: t,
                        clearSelection: function () {
                          t && t.focus(), window.getSelection().removeAllRanges();
                        },
                      });
                    },
                  },
                  {
                    key: 'defaultAction',
                    value: function (e) {
                      return b('action', e);
                    },
                  },
                  {
                    key: 'defaultTarget',
                    value: function (e) {
                      e = b('target', e);
                      if (e) return document.querySelector(e);
                    },
                  },
                  {
                    key: 'defaultText',
                    value: function (e) {
                      return b('text', e);
                    },
                  },
                  {
                    key: 'destroy',
                    value: function () {
                      this.listener.destroy();
                    },
                  },
                ]) && d(t.prototype, n),
                e && d(t, e),
                a
              );
            })(t());
          },
          828: function (e) {
            var t;
            'undefined' == typeof Element ||
              Element.prototype.matches ||
              ((t = Element.prototype).matches =
                t.matchesSelector ||
                t.mozMatchesSelector ||
                t.msMatchesSelector ||
                t.oMatchesSelector ||
                t.webkitMatchesSelector),
              (e.exports = function (e, t) {
                for (; e && 9 !== e.nodeType; ) {
                  if ('function' == typeof e.matches && e.matches(t)) return e;
                  e = e.parentNode;
                }
              });
          },
          438: function (e, t, n) {
            var i = n(828);
            function o(e, t, n, r, a) {
              var o = function (t, n, e, r) {
                return function (e) {
                  (e.delegateTarget = i(e.target, n)), e.delegateTarget && r.call(t, e);
                };
              }.apply(this, arguments);
              return (
                e.addEventListener(n, o, a),
                {
                  destroy: function () {
                    e.removeEventListener(n, o, a);
                  },
                }
              );
            }
            e.exports = function (e, t, n, r, a) {
              return 'function' == typeof e.addEventListener
                ? o.apply(null, arguments)
                : 'function' == typeof n
                ? o.bind(null, document).apply(null, arguments)
                : ('string' == typeof e && (e = document.querySelectorAll(e)),
                  Array.prototype.map.call(e, function (e) {
                    return o(e, t, n, r, a);
                  }));
            };
          },
          879: function (e, n) {
            (n.node = function (e) {
              return void 0 !== e && e instanceof HTMLElement && 1 === e.nodeType;
            }),
              (n.nodeList = function (e) {
                var t = Object.prototype.toString.call(e);
                return (
                  void 0 !== e &&
                  ('[object NodeList]' === t || '[object HTMLCollection]' === t) &&
                  'length' in e &&
                  (0 === e.length || n.node(e[0]))
                );
              }),
              (n.string = function (e) {
                return 'string' == typeof e || e instanceof String;
              }),
              (n.fn = function (e) {
                return '[object Function]' === Object.prototype.toString.call(e);
              });
          },
          370: function (e, t, n) {
            var l = n(879),
              c = n(438);
            e.exports = function (e, t, n) {
              if (!e && !t && !n) throw new Error('Missing required arguments');
              if (!l.string(t)) throw new TypeError('Second argument must be a String');
              if (!l.fn(n)) throw new TypeError('Third argument must be a Function');
              if (l.node(e))
                return (
                  (s = t),
                  (u = n),
                  (i = e).addEventListener(s, u),
                  {
                    destroy: function () {
                      i.removeEventListener(s, u);
                    },
                  }
                );
              if (l.nodeList(e))
                return (
                  (r = e),
                  (a = t),
                  (o = n),
                  Array.prototype.forEach.call(r, function (e) {
                    e.addEventListener(a, o);
                  }),
                  {
                    destroy: function () {
                      Array.prototype.forEach.call(r, function (e) {
                        e.removeEventListener(a, o);
                      });
                    },
                  }
                );
              if (l.string(e)) return c(document.body, e, t, n);
              throw new TypeError(
                'First argument must be a String, HTMLElement, HTMLCollection, or NodeList'
              );
              var r, a, o, i, s, u;
            };
          },
          817: function (e) {
            e.exports = function (e) {
              var t, n;
              return (e =
                'SELECT' === e.nodeName
                  ? (e.focus(), e.value)
                  : 'INPUT' === e.nodeName || 'TEXTAREA' === e.nodeName
                  ? ((t = e.hasAttribute('readonly')) || e.setAttribute('readonly', ''),
                    e.select(),
                    e.setSelectionRange(0, e.value.length),
                    t || e.removeAttribute('readonly'),
                    e.value)
                  : (e.hasAttribute('contenteditable') && e.focus(),
                    (t = window.getSelection()),
                    (n = document.createRange()).selectNodeContents(e),
                    t.removeAllRanges(),
                    t.addRange(n),
                    t.toString()));
            };
          },
          279: function (e) {
            function t() {}
            (t.prototype = {
              on: function (e, t, n) {
                var r = this.e || (this.e = {});
                return (r[e] || (r[e] = [])).push({ fn: t, ctx: n }), this;
              },
              once: function (e, t, n) {
                var r = this;
                function a() {
                  r.off(e, a), t.apply(n, arguments);
                }
                return (a._ = t), this.on(e, a, n);
              },
              emit: function (e) {
                for (
                  var t = [].slice.call(arguments, 1),
                    n = ((this.e || (this.e = {}))[e] || []).slice(),
                    r = 0,
                    a = n.length;
                  r < a;
                  r++
                )
                  n[r].fn.apply(n[r].ctx, t);
                return this;
              },
              off: function (e, t) {
                var n = this.e || (this.e = {}),
                  r = n[e],
                  a = [];
                if (r && t)
                  for (var o = 0, i = r.length; o < i; o++)
                    r[o].fn !== t && r[o].fn._ !== t && a.push(r[o]);
                return a.length ? (n[e] = a) : delete n[e], this;
              },
            }),
              (e.exports = t),
              (e.exports.TinyEmitter = t);
          },
        }),
        (a = {}),
        (r.n = function (e) {
          var t =
            e && e.__esModule
              ? function () {
                  return e.default;
                }
              : function () {
                  return e;
                };
          return r.d(t, { a: t }), t;
        }),
        (r.d = function (e, t) {
          for (var n in t)
            r.o(t, n) && !r.o(e, n) && Object.defineProperty(e, n, { enumerable: !0, get: t[n] });
        }),
        (r.o = function (e, t) {
          return Object.prototype.hasOwnProperty.call(e, t);
        }),
        r(686).default
      );
      function r(e) {
        var t;
        return (a[e] || ((t = a[e] = { exports: {} }), n[e](t, t.exports, r), t)).exports;
      }
      var n, a;
    }),
      (e.exports = r());
  },
]);
