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
    if (!elem) elem = this.querySelector('input[value="activeVolcano"]');
    elem.checked = true;
  }
  
  constructor() {
    super();
  }


  connectedCallback() {
    this.innerHTML = `
      <input type='radio' id="typeSelect.activeVolcano" name="typeSelect" value="activeVolcano" checked>
      <label for="typeSelect.activeVolcano">
        <img src='images/activeVolcanoIcon.png'>
        <a class='typeName'>Active Volcano</a>
        <a class='typeDescription'>maintanance: can errupt when neglected, though usefull when well maintained: "one can heat one's breakfast" [IX].</a>
      </label><hr>
      <input type='radio' id="typeSelect.inactiveVolcano" name="typeSelect" value="inactiveVolcano">
      <label for="typeSelect.inactiveVolcano">
      <img src='images/inactiveVolcanoIcon.png'>
        <a class='typeName'>Inactive Volcano</a>
        <a class='typeDescription'>hope: although inactive, "one never knows" [IX], hope should be nurtured.</a>
      </label><hr>
      <input type='radio' id="typeSelect.rose" name="typeSelect" value="rose">
      <label for="typeSelect.rose">
        <img src='images/roseIcon.png'>
        <a class='typeName'>Rose</a>
        <a class='typeDescription'>caring: "It is the time you have wasted for your rose that makes your rose so important." [XXI]</a>
      </label>
    `;
    // <hr><input type='radio' id="typeSelect.baobab" name="typeSelect" value="baobab">
    // <label for="typeSelect.baobab">
    //     <img src='images/baobabIcon.png'>
    //     <a class='typeName'>Baobab</a>
    //     <a class='typeDescription'>dicipline: some things are always bad, and must be removed, lest they fester and tear your planet apart.</a>
    //   </label>
  

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