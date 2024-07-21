import './style.css';
import { signal, computed } from './signal.js';

const counter = signal(0);
const doubled = computed(() => counter() * 2, true);
const tripled = computed(() => doubled() + counter(), true);

document.querySelector('#app').innerHTML = `
  <div>
    <h1>Signals</h1>
    <div class="card">
      <h3 id="displayValues">Initial Value: 0</h3>
      <button id="increment" type="button">Increment</button>
      <button id="decrement" type="button">Decrement</button>
    </div>
    <p class="read-the-docs">
      All state is managed by a custom implementation of signals. Check console logs to see when values are recomputed (previous calculations are cached).
    </p>
  </div>
`;

const header = document.querySelector('#displayValues');
const incrementBtn = document.querySelector('#increment');
const decrementBtn = document.querySelector('#decrement');

function updateCounter(newValue) {
  counter.set(newValue);

  // Using timeout to simulate the render phase in frameworks like angular
  setTimeout(() => {
    header.textContent = `Counter value: ${counter()} Triple Value: ${tripled()}`;
  });
}
incrementBtn.addEventListener('click', () => updateCounter(counter() + 1));
decrementBtn.addEventListener('click', () => updateCounter(counter() - 1));
