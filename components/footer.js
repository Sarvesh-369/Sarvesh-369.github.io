class Footer extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
    // Listen for data load event to re-render with fresh values
    window.addEventListener('portfolioDataLoaded', () => this.render());
  }

  render() {
    const isPageSubdir = window.location.pathname.includes('/pages/');
    const prefix = isPageSubdir ? '../' : './';
    const email = "baskarsarvesh@gmail.com";
    const linkedin = "https://linkedin.com/in/sarvesh-b-0bb062223/";
    const scholar = "https://scholar.google.com/citations?user=95VFgm8AAAAJ&hl=en&authuser=3";
    const github = "https://github.com/sarvesh-369";
    const twitter = "https://x.com/Sarvesh__369";

    this.innerHTML = `
    <div class="footer-lemos mt-5">
        <div class="py-3 px-md-5 container-fluid">
            <div class="row">
                <div class="col-auto col-md-5 align-middle">
                    <p class="mb-0" style="color: var(--light-gray);">© 2026 Sarvesh Baskar</p>
                    <p class="my-0 pt-0"><a class="footer-email" href="mailto:${email}">${email}</a></p>
                </div>
                <div class="col col-md-7 text-right">
                    <p class="mb-0" style="color: var(--light-gray);">Quick Links</p>
                    <p class="my-0 pt-0">
                        <a href="${prefix}index.html"><i class="mr-3 footer-icons fa-solid fa-house" aria-hidden="true"></i></a>
                        <a class="footer-link-linkedin" href="${linkedin}" target="_blank"><i class="mr-3 fab footer-icons fa-linkedin" aria-hidden="true"></i></a>
                        <a class="footer-link-scholar" href="${scholar}" target="_blank"><i class="mr-3 footer-icons fa-brands fa-google-scholar" aria-hidden="true"></i></a>
                        <a class="footer-link-github" href="${github}" target="_blank"><i class="mr-3 fab footer-icons fa-github" aria-hidden="true"></i></a>
                        <a class="footer-link-twitter" href="${twitter}" target="_blank"><i class="footer-icons fa-brands fa-x-twitter" aria-hidden="true"></i></a>
                    </p>
                </div>
            </div>
        </div>
    </div>
    `;
  }
}

customElements.define('footer-component', Footer);