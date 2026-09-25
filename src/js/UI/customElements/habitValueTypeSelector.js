import App from '../../app.js';
// Create a class for the element
export default class HabitValueTypeSelector extends HTMLElement {
  static observedAttributes = ["valueType"];

  #config = {};
  
  get valueType() {
    return this.getAttribute('valueType');
  }
  set valueType(_newValue) {
    this.#setValueType(_newValue);
    this.querySelector('select').value = _newValue;
  }
  get config() {
    switch (this.valueType)
    {
      case "check": return {};
      case "count": return {
        maxCount: parseInt(this.querySelector('.configPage.count input').value)
      }
    }
  }
  set config(_config) {
    switch (this.valueType)
    {
      case "check": break;
      case "count":
        this.querySelector('.configPage.count input').value = _config.maxCount || 1;
      break;
    }
  }

  reset() {
    this.set('check', {});
  }
  set(_valueType, _config) {
    this.valueType = _valueType;
    this.config = _config;
  }
  
  constructor() {
    super();
  }


  connectedCallback() {
    this.innerHTML = `
      <select>
        <option value='check'>Check</option>
        <option value='count'>Count</option>
      </select>
      <div class='configSelector'>
        <div class='configPage count hide'>
          <label for='habitValueTypeSelector.count'>Maximum count</label>
          <input type='number' min='1' id='habitValueTypeSelector.count'>
        </div>
      </div>
    `;
    
    this.querySelector('select').addEventListener('change', () => this.#setValueType(this.querySelector('select').value));
  }

  #setValueType(_valueType) {
    this.setAttribute('valueType', _valueType);
    this.querySelectorAll('.configSelector .configPage:not(.hide)').forEach((el) => el.classList.add('hide'));
    this.querySelector('.configSelector .configPage.' + _valueType)?.classList.remove('hide');
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name !== 'value' || oldValue === newValue) return;
    this.value = newValue;
  }
}


customElements.define("habit-value-type-selector", HabitValueTypeSelector);