
import HabitManager from '../data/habitManager.js';
import Habit from '../data/habit.js';
// Create a class for the element
export default class HabitEditPanel extends HTMLElement {
  static observedAttributes = ["openState"];

  #habit;
  #editResolver;
  #nameInputField;
  #inEditMode = false;

  get openState() {
    return this.getAttribute('openState') === 'true';
  }
  set openState(_openState) {
    this.setAttribute('openState', _openState);
  }
  
  constructor() {
    super();
  }

  open() {
    App.curOpenPanel = this;
    this.#habit = new Habit();
    this.#nameInputField.value = null;
    this.#nameInputField.focus();
    return new Promise((resolve) => this.#editResolver = resolve);
  }

  openEdit(_habit) {
    let promise = this.open();
    this.#habit = _habit;
    this.#nameInputField.value = this.#habit.name;
    return promise;
  }


  connectedCallback() {
    this.classList.add('UIPanel');
    this.openState = false;
    this.innerHTML = `
      <input class='habitNameEditField panelTitle'></input>
      <button class='saveButton' filled>Save</button>
      <button class='cancelButton'>cancel</button>
    `;
    this.#nameInputField = this.querySelector('.habitNameEditField');
    this.querySelector('.saveButton').addEventListener('click', () => this.#save());
    this.querySelector('.cancelButton').addEventListener('click', () => this.#close());
  }

  async #update() {
    
  }

  #close() {
    this.#editResolver(false);
    this.openState = false;
  }
  
  async #save() {
    this.#habit.name = this.#nameInputField.value;
    await HabitManager.update(this.#habit);
    this.#editResolver(this.#habit);
    this.#close();
  }
}

customElements.define("habit-edit-panel", HabitEditPanel);



