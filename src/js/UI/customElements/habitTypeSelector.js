import App from '../../app.js';
// Create a class for the element
export default class HabitTypeSelector extends HTMLElement {
  static observedAttributes = ["value"];
  
  get value() {
    return this.getAttribute('value');
  }
  set value(_newValue) {
    this.setAttribute('value', _newValue);
    let elem = this.querySelector('input[value="' + _newValue + '"]');
    if (!elem) elem = this.querySelector('input[value="activeVulcano"]');
    elem.checked = true;
  }
  
  constructor() {
    super();
  }


  connectedCallback() {
    this.innerHTML = `
      <input type='radio' id="typeSelect.activeVulcano" name="typeSelect" value="activeVulcano" checked>
      <label for="typeSelect.activeVulcano">
        <img src='images/activeVulcanoIcon.png'>
        <a class='typeName'>Active Vulcano</a>
        <a class='typeDescription'>Maintenance lorem ipsum dolar set amet bla bla bla etc have a very nice day placeholder</a>
      </label><hr>
      <input type='radio' id="typeSelect.inactiveVulcano" name="typeSelect" value="inactiveVulcano">
      <label for="typeSelect.inactiveVulcano">
      <img src='images/inactiveVulcanoIcon.png'>
        <a class='typeName'>Inactive Vulcano</a>
        <a class='typeDescription'>Hope lorem ipsum dolar set amet bla bla bla etc have a very nice day placeholder</a>
      </label><hr>
      <input type='radio' id="typeSelect.rose" name="typeSelect" value="rose">
      <label for="typeSelect.rose">
        <img src='images/roseIcon.png'>
        <a class='typeName'>Rose</a>
        <a class='typeDescription'>Caring: lorem ipsum dolar set amet bla bla bla etc have a very nice day placeholder</a>
      </label>
    `;

     this.querySelectorAll('input[type="radio"]').forEach((rad) => {
      rad.addEventListener('change', () => this.setAttribute('value', rad.value));
    })
  }
  


  attributeChangedCallback(name, oldValue, newValue) {
    if (name !== 'value' || oldValue === newValue) return;
    this.value = newValue;
  }
}

customElements.define("habit-type-selector", HabitTypeSelector);