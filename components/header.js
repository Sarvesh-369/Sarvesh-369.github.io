class Header extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Detect whether the current page is inside the 'pages' directory.
    // This allows us to construct robust relative links regardless of where the site is hosted (localhost, user pages, or project pages).
    const isPageSubdir = window.location.pathname.includes('/pages/');
    const prefix = isPageSubdir ? '../' : './';
    
    this.innerHTML = `
      <header>
        <nav class="navbar navbar-expand-lg navbar-dark sticky-top">
        <h1><a class="navbar-brand" href="${prefix}index.html">Your Name</a></h1>
        <button class="navbar-toggler collapsed" type="button" data-toggle="collapse" data-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="navbar-collapse collapse" id="navbarCollapse" style="">
          <ul class="navbar-nav ml-auto">
            <li class="nav-item mr-2">
              <a class="nav-link" href="${prefix}index.html">Home</a>
            </li>
            <li class="nav-item mr-2">
              <a class="nav-link" href="${prefix}pages/education.html">Education</a>
            </li>
            <li class="nav-item mr-2">
              <a class="nav-link" href="${prefix}pages/experience.html">Experience</a>
            </li>
            <li class="nav-item mr-2">
              <a class="nav-link" href="${prefix}pages/projects.html">Projects</a>
            </li> 
            <li class="nav-item mr-2">
              <a class="nav-link" href="${prefix}pages/publications.html">Publications</a>
            </li>
          </ul>
        </div>
        </nav>
      </header>
    `;
  }
}

customElements.define('header-component', Header);