import { wait } from '../../polyfill.js';

export default class HorizontalInfiniteScroller extends HTMLElement {
  static observedAttributes = [];
  static pageCount = 3;
  #pages = [];
  #relOffset = 0; // Offset with respect to initial placement

  #onOffsetChange;
  get mainPage() {
    return this.#pages[this.mainPageIndex];
  }
  get mainPageIndex() {
    return Math.round((HorizontalInfiniteScroller.pageCount - 1) / 2)
  }

  get curOffset() {
    return this.#relOffset;
  }
  resetRelOffset() {
    this.#relOffset = 0;
    this.update();
  }

  
  constructor({createPage, onOffsetChange}) {
    super();

    for (let i = 0; i < HorizontalInfiniteScroller.pageCount; i++)
    {
      let page = createPage();
      this.#pages.push(page);
    }
    this.#onOffsetChange = onOffsetChange;
  }

  async connectedCallback() {
    for (let i = 0; i < HorizontalInfiniteScroller.pageCount; i++)
    {
      let pageHolder = document.createElement('div');
      pageHolder.classList.add('page');
      if (this.#pages[i] instanceof Array)
      { 
        this.#pages[i].forEach((el) => pageHolder.append(el));
      } else {
        pageHolder.append(this.#pages[i]);
      }
      this.append(pageHolder);
    }
    
    this.parentNode.addEventListener('scroll', () => this.#onScroll());
    this.parentNode.scrollLeft = 1 / this.constructor.pageCount * this.scrollWidth;
    this.update();
  }

  update() {  
    for (let i = 0; i < this.#pages.length; i++)
    {
      let curVal = this.#relOffset + i - this.mainPageIndex;
      this.#pages[i].infScroll_updateContents(curVal);
    }
  }

  async #onScroll() {
    let perc = this.parentNode.scrollLeft / this.parentNode.scrollWidth;
    const margin = 0.001;

    if (perc < margin)
    {
      this.#shiftPages(-1);
    } else if (perc > (1 - 1/HorizontalInfiniteScroller.pageCount) - margin)
    {
      this.#shiftPages(1);
    }
  }

 
  async #shiftPages(_dx) {
    this.parentNode.scrollLeft = 1 / HorizontalInfiniteScroller.pageCount * this.parentNode.scrollWidth;
    this.#relOffset += _dx;
    this.update();
    if (this.#onOffsetChange) this.#onOffsetChange(this.#relOffset);
  }
}

customElements.define("horizontal-infinite-scroller", HorizontalInfiniteScroller);