import { hash } from './utils';

let currentConsumerCtx = undefined; // Used to keep track of the
const SIGNAL_PROPS = Symbol('CalebsSignalImplementation');

// Helper to get the value of a signal without registering with any wrapping context
export const untrackedValue = (s) => s[SIGNAL_PROPS].getValueDirectly();

// Internal helper to set values on signals, even ones with no public set function
const setValue = (s, value) => s[SIGNAL_PROPS].set(value);

const weakArrayHas = (array, searchItem) => {
  for (let i = 0; i < array.length; i++) {
    const dereffed = array[i].deref();
    if (dereffed !== undefined && dereffed === searchItem) return true;
  }
}
const weakArrayForEach = (array, func) => {
  for (let i = 0; i < array.length; i++) {
    const dereffed = array[i].deref();
    if (dereffed !== undefined) func(dereffed);
  }
}

// The core functionality of a signal, used by both `signal` and `computed`
const createSignal = (initialValue, writable) => {
  let value = initialValue;
  let consumerCtxs = [];

  const signalFunction = () => {
    // Register the consumer with this signal so that we can push updates to it
    if (currentConsumerCtx && !weakArrayHas(consumerCtxs, currentConsumerCtx)) {
      consumerCtxs.push(new WeakRef(currentConsumerCtx));
    }

    if (currentConsumerCtx) {
      currentConsumerCtx.producerSignalRead(signalFunction);
    }

    return value;
  };

  const set = (newValue) => {
    const isSameValue = value === newValue;
    value = newValue;
    weakArrayForEach(consumerCtxs, (consumerCtx) => {
      if (consumerCtx.isPure && isSameValue) return; // skip if no new value in pure function

      consumerCtx.requestRecompute(signalFunction);
    });
  };
  if (writable) {
    signalFunction.set = (newValue) => {
      if (currentConsumerCtx !== undefined) throw new Error('Cannot set signal value inside a computed!');
      set(newValue);
    };
  }

  signalFunction[SIGNAL_PROPS] = {
    getValueDirectly: () => value, // provide a way to get the value without worrying about any registering etc
    set: set
  };

  return signalFunction;
};

export const signal = (initialValue,) => {
  return createSignal(initialValue, true);
};

export const computed = (computationFunc, pure = false) => {
  const innerSignal = createSignal(undefined, false); // We will populate the value once we make sure the wrapping context is set up. The reason we use a signal internally is so that this `computed` can be nested in other `computed`s and still work as a signal

  let lastActiveSignals = []; // All the signals involved in calculating the most recent value
  const cachedResults = new Map(); // Maps a hash of each signal value input combination to the output value

  const compute = () => {
    console.log('Recomputing!')

    lastActiveSignals = []; // Reset the last active signals, they will be overwritten when the computationFunc executes because it's possible they will change
    const previousCtx = currentConsumerCtx;
    currentConsumerCtx = context;
    const value = computationFunc();
    setValue(innerSignal, value);
    currentConsumerCtx = previousCtx; // Makes sure the context is returned to any wrapping `computed`
    return value;
  };

  let computeScheduled = false;
  const scheduleCompute = () => {
    queueMicrotask(() => {
      if (pure) {
        // Get the hash of all the input signal values, and if we already have the result cached just return that
        const currentInputValues = lastActiveSignals.map((inputSignal) => untrackedValue(inputSignal));
        const hashedInputs = hash(currentInputValues);

        if (cachedResults.has(hashedInputs)) {
          setValue(innerSignal, cachedResults.get(hashedInputs));
        } else {
          // We have no cached results so calculate
          cachedResults.set(hashedInputs, compute());
        }
      } else {
        // Function is not pure, so we need to re-calculate regardless of values
        compute();
      }

      computeScheduled = false;
    });
  };

  const context = {
    producerSignalRead: (producerSignal) => {
      if (pure && !lastActiveSignals.includes(producerSignal)) lastActiveSignals.push(producerSignal);
    },
    requestRecompute: (requestingSignal) => {
      // If this computed function is pure, populate the info needed to potentially use one of the cached results
      if (pure && !lastActiveSignals.includes(requestingSignal)) {
        return; // No recomputation needed, this signal wasn't used last time so it won't change the value
      }

      if (!computeScheduled) {
        scheduleCompute();
        computeScheduled = true;
      }
    },
  };
  compute(); // sets the initial value for this `computed`

  innerSignal[SIGNAL_PROPS].innerContext = context; // Attach the context to the returned signal so that it's held in memory

  return innerSignal;
};
