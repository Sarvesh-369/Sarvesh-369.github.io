// Premium SPA Transition Engine for Zero-Flash, Buttery-Smooth Page Changes
let activeTransitionId = 0;

async function navigateToPage(url, pushState = true) {
  const pageContainer = document.getElementById('page-container');
  if (!pageContainer) {
    window.location.href = url;
    return;
  }

  // Increment the active transition ID to track rapid clicks
  const currentTransitionId = ++activeTransitionId;

  // 1. Trigger exit animation
  pageContainer.classList.add('fade-out');

  try {
    // 2. Fetch target page concurrently (bypass local browser cache to get fresh markup)
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error('Failed to fetch page');
    const htmlText = await response.text();

    // Abort if a newer page transition has been triggered in the meantime
    if (currentTransitionId !== activeTransitionId) return;

    // Parse the new page
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(htmlText, 'text/html');
    const newContainer = newDoc.getElementById('page-container');

    if (!newContainer) {
      window.location.href = url;
      return;
    }

    // Wait for the exit animation to finish (220ms)
    await new Promise(resolve => setTimeout(resolve, 220));

    // Abort if a newer page transition has been triggered in the meantime
    if (currentTransitionId !== activeTransitionId) return;

    // 3. Update history state first (so custom elements evaluate the new URL pathname correctly)
    if (pushState) {
      window.history.pushState({ url }, '', url);
    }

    // 4. Swap page content
    pageContainer.innerHTML = newContainer.innerHTML;
    document.title = newDoc.title;
    interpolatePortfolioData();

    // 5. Dynamic Stylesheet Injection: Load any page-specific stylesheet links
    const newLinks = newDoc.querySelectorAll('link[rel="stylesheet"]');
    newLinks.forEach(oldLink => {
      const href = oldLink.getAttribute('href');
      if (href) {
        const alreadyLoaded = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'))
          .some(el => el.getAttribute('href') === href || el.href === oldLink.href);
        
        if (!alreadyLoaded) {
          const newLink = document.createElement('link');
          newLink.setAttribute('rel', 'stylesheet');
          newLink.setAttribute('href', href);
          document.head.appendChild(newLink);
        }
      }
    });

    // 4. Extract and execute page-specific script files (excluding globally persistent ones)
    const newScripts = newDoc.querySelectorAll('script');
    newScripts.forEach(oldScript => {
      const src = oldScript.getAttribute('src');
      
      // Skip persistent UI or libraries already active in memory
      if (src && (
        src.includes('header.js') || 
        src.includes('footer.js') || 
        src.includes('main.js') || 
        src.includes('jquery') || 
        src.includes('bootstrap') || 
        src.includes('popper')
      )) {
        return;
      }

      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      document.body.appendChild(newScript);
      newScript.remove(); // Clean up DOM immediately
    });

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 5. Trigger smooth entrance animation
    pageContainer.classList.remove('fade-out');
    pageContainer.style.animation = 'none';
    pageContainer.offsetHeight; // Force reflow to restart CSS keyframe animation
    pageContainer.style.animation = '';

  } catch (err) {
    console.warn('SPA transition failed, falling back to standard load:', err);
    window.location.href = url;
  }
}

// Global Event Interceptor for all internal page links
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;

  const href = link.getAttribute('href');
  const target = link.getAttribute('target');

  // Intercept internal HTML page links only
  if (href && 
      !href.startsWith('#') && 
      !href.startsWith('mailto:') && 
      !href.startsWith('tel:') && 
      target !== '_blank' && 
      link.hostname === window.location.hostname) {
    
    e.preventDefault();
    navigateToPage(link.href);
  }
});

// Handle browser Back/Forward navigation
window.addEventListener('popstate', (e) => {
  navigateToPage(window.location.href, false);
});

// ==========================================
// Portfolio Dynamic Loader & Interpolation Engine
// ==========================================
window.portfolioData = null;

async function loadPortfolioData() {
  if (window.portfolioData) return window.portfolioData;
  // Always fetch from the site root — works on both localhost and GitHub Pages.
  const jsonUrl = new URL('assets/data/portfolio_extra.json', window.location.origin + '/').href;

  try {
    const response = await fetch(jsonUrl);
    if (!response.ok) throw new Error('Failed to load portfolio_extra.json');
    window.portfolioData = await response.json();
    
    // Dispatch custom event to notify components (like footer)
    window.dispatchEvent(new CustomEvent('portfolioDataLoaded'));
    return window.portfolioData;
  } catch (err) {
    console.error('Error fetching portfolio extra data:', err);
    return null;
  }
}

function interpolatePortfolioData() {
  if (!window.portfolioData) return;
  const p = window.portfolioData;

  // Update email links
  document.querySelectorAll('.email-link').forEach(el => {
    el.href = `mailto:${p.personal.email}`;
    if (el.dataset.fillText) {
      el.innerText = p.personal.email;
    }
  });

  // Update social links
  document.querySelectorAll('.social-link-linkedin').forEach(el => el.href = p.personal.socials.linkedin || '#');
  document.querySelectorAll('.social-link-github').forEach(el => el.href = p.personal.socials.github || '#');
  document.querySelectorAll('.social-link-scholar').forEach(el => el.href = p.personal.socials.google_scholar || '#');
  document.querySelectorAll('.social-link-twitter').forEach(el => el.href = p.personal.socials.twitter || '#');

  // Update company links
  document.querySelectorAll('.exp-link-umd').forEach(el => el.href = p.experience?.umd?.link || '#');
  document.querySelectorAll('.exp-link-umbc').forEach(el => el.href = p.experience?.umbc?.link || '#');
  document.querySelectorAll('.exp-link-avyott').forEach(el => el.href = p.experience?.avyott?.link || '#');
  document.querySelectorAll('.exp-link-techisy').forEach(el => el.href = p.experience?.techisy?.link || '#');
  document.querySelectorAll('.exp-link-appcair').forEach(el => el.href = p.experience?.appcair?.link || '#');

  // Render education dynamics whenever the containers are present in the DOM
  // (works for both direct load and SPA navigation)
  if (document.getElementById('cs-courses-container') ||
      document.getElementById('physics-courses-container') ||
      document.getElementById('activities-container')) {
    renderEducationPageDynamics();
  }
}

function renderEducationPageDynamics() {
  const p = window.portfolioData;
  if (!p || !p.education) return;

  // CS Courses
  const csContainer = document.getElementById('cs-courses-container');
  if (csContainer && p.education.courses && p.education.courses.cs) {
    csContainer.innerHTML = p.education.courses.cs.map(course => `
      <div class="col-12 col-md-6 mb-2">
        <li class="pl-2" style="list-style: square;">${course}</li>
      </div>
    `).join('');
  }

  // Physics Courses
  const physicsContainer = document.getElementById('physics-courses-container');
  if (physicsContainer && p.education.courses && p.education.courses.physics) {
    physicsContainer.innerHTML = p.education.courses.physics.map(course => `
      <div class="col-12 col-md-6 mb-2">
        <li class="pl-2" style="list-style: square;">${course}</li>
      </div>
    `).join('');
  }

  // Activities
  const activitiesContainer = document.getElementById('activities-container');
  if (activitiesContainer && p.education.activities) {
    activitiesContainer.innerHTML = p.education.activities.map(act => `
      <div class="row mb-2">
        <div class="col-12">
          <ul class="pb-0 mb-1">
            <li class="activity-lemos">
              <span class="activity-names" style="font-weight: bold; color: var(--blue-medium);">${act.name}:</span> 
              <span>${act.description}</span>
            </li>
          </ul>
        </div>
      </div>
    `).join('');
  }
}

// Auto-run on first load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadPortfolioData().then(() => interpolatePortfolioData());
  });
} else {
  loadPortfolioData().then(() => interpolatePortfolioData());
}