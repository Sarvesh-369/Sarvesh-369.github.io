// Premium SPA Transition Engine for Zero-Flash, Buttery-Smooth Page Changes
if (history.scrollRestoration) {
  history.scrollRestoration = 'manual';
}

let activeTransitionId = 0;

async function navigateToPage(url, pushState = true) {
  const pageContainer = document.getElementById('page-container');
  if (!pageContainer) {
    window.location.href = url;
    return;
  }

  // Increment the active transition ID to track rapid clicks
  const currentTransitionId = ++activeTransitionId;

  // Clean up previous ScrollSpy scroll listener if it exists
  if (window._currentScrollSpyHandler) {
    window.removeEventListener('scroll', window._currentScrollSpyHandler);
    window._currentScrollSpyHandler = null;
  }

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

    // Abort if a newer page transition has been triggered in the meantime
    if (currentTransitionId !== activeTransitionId) return;

    // 3. Update history state first (so custom elements evaluate the new URL pathname correctly)
    if (pushState) {
      window.history.pushState({ url }, '', url);
    }

    // 4. Swap page content
    pageContainer.innerHTML = newContainer.innerHTML;
    document.title = newDoc.title;
    if (typeof interpolatePortfolioData === 'function') {
      interpolatePortfolioData();
    }

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

    // Helper to force scroll position to top in any browser
    const forceScrollToTop = () => {
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    };

    // Scroll to top immediately on DOM swap
    forceScrollToTop();

    // Scroll to top and initialize ScrollSpy after a short layout/scroll-restoration timeout
    setTimeout(() => {
      forceScrollToTop();
      initSubnavScrollSpy();
    }, 50);

    // Redundant scroll resets to guarantee viewport stays at the very top after delayed layout changes
    setTimeout(forceScrollToTop, 150);
    setTimeout(forceScrollToTop, 300);
    setTimeout(forceScrollToTop, 600);

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

// Lightweight, dynamic ScrollSpy for sticky sub-navigation
function initSubnavScrollSpy() {
  const navPills = document.querySelectorAll('.custom-project-nav .nav-link');
  const sections = document.querySelectorAll('.scroll-section');
  if (navPills.length === 0 || sections.length === 0) return;

  const scrollHandler = () => {
    let currentActiveId = '';
    
    // Find active section using bounding rect (direct viewport measurement)
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 180 && rect.bottom > 80) {
        currentActiveId = section.getAttribute('id');
      }
    });

    // UX override: highlight the last section if scrolled to the very bottom
    const isAtBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 15;
    if (isAtBottom && sections.length > 0) {
      currentActiveId = sections[sections.length - 1].getAttribute('id');
    }

    if (currentActiveId) {
      navPills.forEach(pill => {
        const href = pill.getAttribute('href');
        // Match either full href or hash
        const targetId = href.split('#')[1];
        if (targetId === currentActiveId) {
          if (!pill.classList.contains('active')) {
            pill.classList.add('active');
            pill.setAttribute('aria-selected', 'true');
          }
        } else {
          if (pill.classList.contains('active')) {
            pill.classList.remove('active');
            pill.setAttribute('aria-selected', 'false');
          }
        }
      });
    }
  };

  window.addEventListener('scroll', scrollHandler);
  // Run once to initialize correct state on load
  scrollHandler();

  // Smooth scroll override to prevent abrupt hash jumps
  navPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      const href = pill.getAttribute('href');
      if (href && href.includes('#')) {
        const targetId = href.split('#')[1];
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
          e.preventDefault();
          // Update URL hash without jumping
          window.history.pushState(null, null, '#' + targetId);
          // Scroll smoothly
          targetSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Keep a reference to clean up if we transition pages in SPA
  window._currentScrollSpyHandler = scrollHandler;
}

// Initialize on initial page load
document.addEventListener('DOMContentLoaded', initSubnavScrollSpy);