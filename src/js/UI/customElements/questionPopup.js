import Popup from './popup.js';


export default class QuestionPopup extends Popup {
  static observedAttributes = ["openState"];
  #title;
  set title(_newTitle) {
    this.#title = _newTitle;
    if (!this.querySelector('.popup .titleHolder')) return;
    this.querySelector('.popup .titleHolder').innerHTML = _newTitle;
  }
  #text;
  set text(_newText) {
    this.#text = _newText;
    if (!this.querySelector('.popup .textHolder')) return;
    this.querySelector('.popup .textHolder').innerHTML = _newText;
  }
  #positiveButtonText;
  set positiveButtonText(_newText) {
    this.#positiveButtonText = _newText;
    if (!this.querySelector('.popup .positiveButton')) return;
    this.querySelector('.popup .positiveButton').innerHTML = _newText;
  }

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();

    let popup = this.querySelector('.popup');
    popup.innerHTML = `
      <div class='titleHolder'></div>
      <div class='textHolder'></div>
      <button class='cancelButton'>Cancel</button>
      <button filled class='positiveButton'>Yes</button>
    `;

    this.querySelector('.popup .titleHolder').innerHTML = this.#title;
    this.querySelector('.popup .textHolder').innerHTML = this.#text;
    this.querySelector('.popup button.positiveButton').innerHTML = this.#positiveButtonText;

    this.querySelector('button.cancelButton').addEventListener('click', () => this.close());
    this.querySelector('button.positiveButton').addEventListener('click', () => {this._resolveOnOpenPromise(true); this.close()});
  }

}

customElements.define("question-popup-element", QuestionPopup);