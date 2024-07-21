import { IterableWeakSet, hash, sortBy } from './utils';

let currentConsumerCtx = undefined; // Used to keep track of the
const PRIV_PROPS = Symbol('CalebsSignalImplementation');

// Helper to get the value of a signal without registering with any wrapping context
export const untrackedValue = (s) => s[PRIV_PROPS].getValueDirectly();

// The core functionality of a signal, used by both `signal` and `computed`
const createSignal = (initialValue) => {
  let value = initialValue;
  let consumerCtxs = new IterableWeakSet(); // unfortunately can't use WeakSet because that is not enumerable

  const signalFunction = () => {
    // Register the consumer with this signal so that we can push updates to it
    if (currentConsumerCtx && !consumerCtxs.has(currentConsumerCtx)) {
      consumerCtxs.add(currentConsumerCtx);
    }

    // Register this signal with the consumer so that it can keep track of which signals were used in the last computation
    if (
      currentConsumerCtx?.isPure &&
      !currentConsumerCtx.lastActiveSignals.has(signalFunction)
    ) {
      currentConsumerCtx.lastActiveSignals.add(signalFunction);
    }
    return value;
  };
  signalFunction.set = (newValue) => {
    const isSameValue = value === newValue;
    value = newValue;
    [...consumerCtxs].forEach((consumerCtx) => {
      if (consumerCtx.isPure && isSameValue) return; // skip if no new value in pure function

      consumerCtx.requestRecompute(signalFunction);
    });
  };

  signalFunction[PRIV_PROPS] = {
    getValueDirectly: () => value, // provide a way to get the value without worrying about any registering etc
  };

  return signalFunction;
};

export const signal = (initialValue) => {
  return createSignal(initialValue);
};

export const computed = (computationFunc, pure = false) => {
  const innerSignal = createSignal(undefined); // We will populate the value once we make sure the wrapping context is set up. The reason we use a signal internally is so that this `computed` can be nested in other `computed`s and still work as a signal

  const cachedResults = new Map(); // Maps a hash of each signal value input combination to the output value

  const compute = () => {
    console.log('Recomputing!');

    context.lastActiveSignals.clear(); // Reset the last active signals, they will be overwritten when the computationFunc executes because it's possible they will change
    const previousCtx = currentConsumerCtx;
    currentConsumerCtx = context;
    const value = computationFunc();
    innerSignal.set(value);
    currentConsumerCtx = previousCtx; // Makes sure the context is returned to any wrapping `computed`
    return value;
  };

  let computeScheduled = false;
  const scheduleCompute = () => {
    setTimeout(() => {
      if (pure) {
        // Get the hash of all the input signal values, and if we already have the result cached just return that
        const currentInputValues = sortBy(
          Array.from(context.lastActiveSignals),
          (x) => hash(x)
        ).map((inputSignal) => untrackedValue(inputSignal));
        const hashedInputs = hash(currentInputValues);

        if (cachedResults.has(hashedInputs)) {
          innerSignal.set(cachedResults.get(hashedInputs));
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
    isPure: pure,
    lastActiveSignals: new IterableWeakSet(), // All the signals involved in calculating the most recent value
    requestRecompute: (requestingSignal) => {
      // If this computed function is pure, populate the info needed to potentially use one of the cached results
      if (pure && !context.lastActiveSignals.has(requestingSignal)) {
        return; // No recomputation needed, this signal wasn't used last time so it won't change the value
      }

      if (!computeScheduled) {
        scheduleCompute();
        computeScheduled = true;
      }
    },
  };
  compute(); // sets the initial value for this `computed`

  // Only expose the getter function, `computed` is read-only
  const getter = () => {
    return innerSignal();
  };

  return getter;
};
