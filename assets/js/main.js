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
    // 2. Fetch target page concurrently
    const response = await fetch(url);
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