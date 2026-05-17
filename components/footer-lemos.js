class Footer_L extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const startYear = 2024;
    const currentYear = new Date().getFullYear();
    const yearDisplay = startYear === currentYear ? `${startYear}` : `${startYear}–${currentYear}`;
    this.innerHTML = ``;
  }
}

customElements.define('footer-component-lemos', Footer_L);