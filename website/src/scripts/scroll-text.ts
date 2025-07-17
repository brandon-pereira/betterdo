type ScrollTextOptions = {
  textAttribute?: string;
  speed?: number;
  scrollAmount?: string;
  delimiter?: string;
  text?: string[];
};

export default class ScrollText {
  private el: HTMLElement;
  private options: Required<ScrollTextOptions>;
  private text: string[];
  private children: HTMLSpanElement[];
  private index: number;
  private currentElement: HTMLSpanElement;
  private timer: number | undefined;

  constructor(el: HTMLElement, options: ScrollTextOptions = {}) {
    this.el = el;
    this.options = Object.assign(
      {
        textAttribute: "data-scroll-text",
        speed: 3000,
        scrollAmount: "20px",
        delimiter: "|",
        text: []
      },
      options
    );
    this.el.innerHTML = "";
    this.text = this.options.text.length
      ? this.options.text
      : (this.el.getAttribute(this.options.textAttribute)?.split(this.options.delimiter) ?? []);
    this.children = this.text.map((el, i) => this._createTextElement(el, i === 0));
    this.index = 0;
    this.currentElement = this.children[this.index]!;
    this.timer = window.setInterval(this.next.bind(this), this.options.speed);
  }

  /**
   * Public method to switch to the next available slide.
   */
  public next() {
    this.index += 1;
    if (this.index > this.text.length - 1) {
      this.index = 0;
    }
    this.setCurrentSlide(this.index);
  }

  /**
   * Method to switch slide, handles delegating animations and setting styles.
   */
  private setCurrentSlide(index: number) {
    const prev = this.currentElement;
    const next = this.children[index];
    if (prev && next) {
      prev.style.position = "absolute";
      next.style.position = "relative";
      this._animate(
        next,
        [
          { opacity: 0, top: this.options.scrollAmount },
          { opacity: 1, top: "0px" }
        ],
        { fill: "both", duration: 200 }
      );
      this._animate(
        prev,
        [
          { opacity: 1, top: "0px" },
          { opacity: 0, top: `-${this.options.scrollAmount}` }
        ],
        { fill: "both", duration: 200 },
        () => {
          prev.classList.remove("current");
          next.classList.add("current");
        }
      );
      this.currentElement = next;
    } else {
      console.warn("Invalid index passed into scrollText!", index);
    }
  }

  /**
   * Method to call Element.animate if available.
   */
  private _animate(el: HTMLElement, transition: Keyframe[], opts: KeyframeAnimationOptions, cb: () => void = () => {}) {
    if (el && "animate" in el) {
      el.animate(transition, opts).onfinish = cb;
    } else if (cb) {
      cb();
    }
  }

  /**
   * Creates and appends a text element to the root node. If index is 0 will make it visible, else will be hidden.
   */
  private _createTextElement(text: string, isCurrent: boolean): HTMLSpanElement {
    const el = document.createElement("span");
    el.innerText = text;
    el.classList.toggle("current", isCurrent);
    this.el.appendChild(el);
    return el;
  }

  /**
   * Cleanup method. Call this if the component needs to unmount and be removed.
   */
  public destroy() {
    if (this.timer) clearInterval(this.timer);
    this.el.innerHTML = this.text[0] || "";
  }
}
