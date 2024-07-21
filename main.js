import './style.css';
import { signal, computed, untrackedValue } from './signal.js';

const counter = signal(0);
const doubled = computed(() => counter() * 2, true);
const tripled = computed(() => doubled() + untrackedValue(counter), true);

// const counter2 = signal(0);
// const summed = computed(() => counter() + untrackedValue(counter2));

document.querySelector('#app').innerHTML = `
  <div>
    <h1>Signals</h1>
    <div class="card">
      <h3 id="displayValues">Initial Value: 0</h3>
      <button id="increment" type="button">Increment</button>
      <button id="decrement" type="button">Decrement</button>
    </div>
    <div class="card">
      <h3 id="displayValues2">Second Counter Value: 0</h3>
      <button id="increment2" type="button">Increment Second Counter</button>
    </div>
    <p class="read-the-docs">
      All state is managed by a custom implementation of signals. Check console logs to see when values are recomputed (previous calculations are cached).
    </p>
  </div>
`;

const header = document.querySelector('#displayValues');
const incrementBtn = document.querySelector('#increment');
const decrementBtn = document.querySelector('#decrement');

const header2 = document.querySelector('#displayValues2');
const increment2Btn = document.querySelector('#increment2');

function updateCounter(newValue) {
  counter.set(newValue);

  // Using timeout to simulate the render phase in frameworks like angular
  setTimeout(() => {
    header.textContent = `Counter value: ${counter()} Double Value: ${doubled()} Triple Value: ${tripled()}`;
  });
}
incrementBtn.addEventListener('click', () => updateCounter(counter() + 1));
decrementBtn.addEventListener('click', () => updateCounter(counter() - 1));

// function updateCounter2(newValue) {
//   counter2.set(newValue);

//   // Using timeout to simulate the render phase in frameworks like angular
//   setTimeout(() => {
//     header2.textContent = `Second Counter value: ${counter()} Summed Value: ${summed()}`;
//   });
// }
// increment2Btn.addEventListener('click', () => updateCounter2(counter2() + 1));
