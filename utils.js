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
