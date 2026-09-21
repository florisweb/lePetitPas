// Create a class for the element
export default class Popup extends HTMLElement {
  static observedAttributes = ["openState"];
  constructor(_habit) {
    super();
    // this.attachShadow({ mode: 'open' });
    // this.shadowRoot.innerHTML = ``;
    
  }

  get openState() {
    return this.getAttribute('openState') === 'true';
  }
  set openState(_newState) {
    this.setAttribute('openState', _newState);
  }

  connectedCallback() {
    this.innerHTML = `
      <div class='popupOverlay'>
        <div class='popup'>
          Hey
        </div>
      </div>
    `;
    this.openState = false;
    

    this.addEventListener('click', (_e) => {
      if (!_e.target.classList.contains('popupOverlay')) return;
      this.openState = false;
    });
  }
  
  disconnectedCallback() {
    console.log("Custom element removed from page.");
  }

  connectedMoveCallback() {
    console.log("Custom element moved with moveBefore()");
  }

  adoptedCallback() {
    console.log("Custom element moved to new page.");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`Attribute ${name} has changed.`);
  }
}

customElements.define("popup-element", Popup);