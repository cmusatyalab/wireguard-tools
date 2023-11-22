const NAME = 'storage';

class Storage {
  // Getters
  static get NAME() {
    return NAME;
  }

  // Public

  // Private

  // Static
  static set(name, value, expires) {
    // check expiry when storage is setting
    this.checkExpiry();

    localStorage.setItem(name, JSON.stringify(value));

    if (typeof expires === 'number') {
      const expiryList = this.get('expiryList') || [];

      // expiry in days
      expires = new Date(Number(new Date()) + expires * 1000 * 60 * 60 * 24);

      if (this.isPresentOnExpiryList(name)) {
        const index = expiryList.findIndex((el) => el[name] !== undefined);
        expiryList[index][name] = expires;
      } else {
        expiryList.push({ [name]: expires });
      }

      localStorage.setItem('expiryList', JSON.stringify(expiryList));
    }

    return `${name}: ${value}, expiries: ${expires}`;
  }

  static get(name) {
    // check expiry when storage is getting
    this.checkExpiry();

    return JSON.parse(localStorage.getItem(name));
  }

  static remove(name) {
    // check expiry when storage is removing
    this.checkExpiry();

    localStorage.removeItem(name);

    const expiryList = this.get('expiryList') || [];

    if (this.isPresentOnExpiryList(name)) {
      const filteredList = expiryList.filter((el) => {
        const elKey = Object.keys(el);
        return elKey[0] !== name;
      });

      localStorage.setItem('expiryList', JSON.stringify(filteredList));
    }
  }

  static isPresentOnExpiryList(name) {
    const expiryList = this.get('expiryList') || [];
    return expiryList.some((el) => {
      return el[name] !== undefined;
    });
  }

  static check(name, time, callback) {
    const expiryList = this.get('expiryList') || [];

    const filteredList = expiryList.filter((el) => {
      const elKey = Object.keys(el);
      return elKey[0] === name;
    });

    // time in seconds
    time *= 6000;

    const intervalId = setInterval(() => {
      if (new Date(filteredList[0][name]) < new Date()) {
        callback();
        clearInterval(intervalId);
      }

      this.checkExpiry();
    }, time);
  }

  static checkExpiry() {
    const expiryList = JSON.parse(localStorage.getItem('expiryList')) || [];
    const now = new Date();

    expiryList.filter((el) => {
      const elKey = Object.keys(el);

      if (now > new Date(el[elKey])) {
        localStorage.removeItem(elKey[0]);
      }

      return el[elKey] >= now;
    });
  }

  static showModalNewUser(id) {
    if (this.get('is-first-visit') === null) {
      const modalElement = document.getElementById(id);

      if (modalElement) {
        const modal = new mdb.Modal(modalElement);
        modal.show();

        modalElement.addEventListener('hidden.bs.modal', () => {
          this.set('is-first-visit', false);
        });
      }
    }
  }

  static showModalScoring(id, value) {
    const counter = Number(this.get('visit-counter')) || 0;
    const newCounter = counter + 1;

    this.set('visit-counter', newCounter);

    if (newCounter === value) {
      const modalElement = document.getElementById(id);

      if (modalElement) {
        const modal = new mdb.Modal(modalElement);
        modal.show();
      }
    }
  }
}

export default Storage;
