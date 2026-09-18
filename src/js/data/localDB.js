const DBName = "lePetitPasDB";
let DBVersion = 1;
let DB;
let isReadyPromise = new Promise((resolve) => {});

const LocalDB = new class {
  constructor() {
    isReadyPromise = this.setup()
  }

  ready() {
    return isReadyPromise;
  }

  setup() {
    return new Promise(function (resolve, error) {
      const request = indexedDB.open(DBName, DBVersion);

      request.onupgradeneeded = function(_e) { // create object stores
        DB = _e.target.result;

        DB.createObjectStore("habits");
      }

      request.onsuccess = function(_e) {
        DB = _e.target.result;
        resolve();
      }

      request.onerror = function(_e) {
        console.warn("error", _e);
        indexedDB.deleteDatabase(DBName);
        error();
      }
    });
  }


  getData(_key) {
    return new Promise(function (resolve, error) {
      let store = DB.transaction(_key, "readonly").objectStore(_key);
      let request = store.get("IDENTIFIER");
      
      request.onsuccess = function(_e) {
        let data = request.result;
        if (typeof data != "object" && typeof data != 'number' && typeof data != 'string') data = [];
        resolve(data);
      }
    });
  }

  setData(_key, _value) {
    return new Promise(function (resolve, error) {
      const transaction = DB.transaction(_key, "readwrite");
      transaction.onerror = error;
      const store = transaction.objectStore(_key);
      let trans2 = store.put(JSON.parse(JSON.stringify(_value)), "IDENTIFIER");
      resolve();
    });
  }


  removeData(_key) {
    return new Promise(function (resolve, error) {
      const transaction = DB.transaction(_key, "readwrite");
      transaction.onerror = error;

      const store = transaction.objectStore(_key);

      let request = store.delete(This.id);
      request.onerror = error;
      request.onsuccess = function() {
        resolve(true);
      }
    });
  }
}

export default LocalDB;