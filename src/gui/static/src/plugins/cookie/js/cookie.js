const NAME = 'cookie';

class Cookie {
  // Getters
  static get NAME() {
    return NAME;
  }

  // Public

  // Private

  // Static
  static set(name, value, attributes = {}) {
    attributes = Object.assign(attributes, { path: '/' });

    // convert number to date
    if (typeof attributes.expires === 'number') {
      // expires in days
      attributes.expires = new Date(Number(new Date()) + attributes.expires * 1000 * 60 * 60 * 24);
    }

    if (attributes.expires) {
      // convert date to string
      attributes.expires = attributes.expires.toUTCString();
    }

    // if value is an object or an array transform to string
    const stringifiedValue = JSON.stringify(value);
    if (/^[{[]/.test(stringifiedValue)) {
      value = stringifiedValue;
    }

    // decode value characters
    value = encodeURIComponent(String(value));

    // decode name characters
    name = encodeURIComponent(String(name)).replace(/[()]/g, escape);

    // convert attributes array to string
    let stringifiedAttributes = '';
    Object.keys(attributes).forEach((name) => {
      stringifiedAttributes += `; ${name}`;
      stringifiedAttributes += `=${attributes[name].split(';')[0]}`;
    });

    return (document.cookie = `${name}=${value}${stringifiedAttributes}`);
  }

  static get(name) {
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    const result = {};

    cookies.forEach((el) => {
      const cookie = el.split('=');
      let cookieValue = cookie.slice(1).join('=');

      // decode cookies name and value
      const cookieName = cookie[0].replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent);

      // decode cookie value
      cookieValue = cookieValue.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent);

      result[cookieName] = cookieValue;
    });

    return name ? result[name] : result;
  }

  static remove(name) {
    this.set(name, '', { expires: -1 });
  }

  static showModalNewUser(id) {
    const isFirstVisitOnPage = !this.get('is-first-visit');

    if (isFirstVisitOnPage) {
      const modalElement = document.getElementById(id);
      if (modalElement) {
        const modal = new mdb.Modal(modalElement);
        modal.show();

        modalElement.addEventListener('hidden.bs.modal', () => {
          this.set('is-first-visit', false, { expires: 365 });
        });
      }
    }
  }

  static showModalScoring(id, value) {
    const counter = Number(this.get('visit-counter')) || 0;
    const newCounter = counter + 1;

    this.set('visit-counter', newCounter, { expires: 365 });

    if (newCounter === value) {
      const modalElement = document.getElementById(id);

      if (modalElement) {
        const modal = new mdb.Modal(modalElement);
        modal.show();
      }
    }
  }
}

export default Cookie;
