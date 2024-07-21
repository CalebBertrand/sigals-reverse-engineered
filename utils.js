const PRIV_PROPS = Symbol('CalebsUtils');

export class IterableWeakSet extends WeakSet {
  [PRIV_PROPS] = { valuesArray: [] };

  constructor(initialValues = []) {
    super(initialValues);
    this[PRIV_PROPS] = {
      valuesArray: initialValues.map((value) => new WeakRef(value)),
    };
  }

  add(value) {
    super.add(value);
    this[PRIV_PROPS].valuesArray.push(new WeakRef(value));
    return this;
  }

  delete(value) {
    super.delete(value);
    const valuesArray = this[PRIV_PROPS].valuesArray;
    for (let i = 0; i < valuesArray.length; i++) {
      const dereffed = valuesArray[i].deref();
      if (dereffed !== undefined && dereffed === value) {
        valuesArray.splice(dereffed, 1);
        return true;
      }
    }
    return false;
  }

  clear() {
    const existingObjects = this[PRIV_PROPS].valuesArray
      .map((ref) => ref.deref())
      .filter((obj) => typeof obj !== 'undefined');

    existingObjects.forEach((obj) => super.delete(obj));
    this[PRIV_PROPS].valuesArray = [];
  }

  [Symbol.iterator]() {
    const existingObjects = this[PRIV_PROPS].valuesArray
      .map((ref) => ref.deref())
      .filter((obj) => typeof obj !== 'undefined');
    return existingObjects.values(); // values gets the array iterator
  }
}

const hashPrefix = crypto.randomUUID(); // added to all hashes to make sure they are unique from other strings
const objHashPrefix = crypto.randomUUID();
let objHashCount = 0;
const objMapping = new WeakMap();

export function hash(value) {
  return Array.isArray(value) ? hashValues(value) : hashValue(value);
}

function hashValue(value) {
  let hash = '';
  if (value === null) {
    hash = 'null';
  } else if (typeof value === 'undefined') {
    hash = 'undefined';
  } else if (typeof value === 'object') {
    if (objMapping.has(value)) {
      hash = objMapping.get(value);
    } else {
      hash = String(objHashCount++);
      objMapping.set(value, hash);
    }
  } else {
    hash = String(value);
  }

  return `${typeof value === 'object' ? objHashPrefix : hashPrefix}-${hash}`;
}

function hashValues(values) {
  return values.map((value) => hashValue(value)).join('|');
}

export function sortBy(array, selector) {
  return array.toSorted((a, b) => {
    const aValue = selector(a);
    const bValue = selector(b);

    if (aValue === bValue) {
      return 0;
    } else if (aValue > bValue) {
      return 1;
    } else {
      return -1;
    }
  });
}
