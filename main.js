import './style.css';
import { signal, computed, untrackedValue } from './signal.js';

const counter = signal(0, 'Counter');
const doubled = computed(() => counter() * 2, true, 'Doubled');
const tripled = computed(() => doubled() + untrackedValue(counter), true, 'Tripled');

document.querySelector('#app').innerHTML = `
  <div>
    <h1>Signals</h1>
    <div class="card">
      <h3 id="displayValues"></h3>
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
const updateText = () => {
  header.textContent = `Counter value: ${counter()} Double Value: ${doubled()} Triple Value: ${tripled()}`;
}
updateText();

function updateCounter(newValue) {
  counter.set(newValue);

  // Using timeout to simulate the render phase in frameworks like angular
  setTimeout(updateText);
}
incrementBtn.addEventListener('click', () => updateCounter(counter() + 1));
decrementBtn.addEventListener('click', () => updateCounter(counter() - 1));
