/**
 * Holodex Video Quality Enhancer - Content Script (Improved)
 * Uses iframe size manipulation to enable high-quality playback
 */

let settings = {
  targetQuality: 'hd1080',
  forceFullSize: true,  // Force iframe to large size
  enabled: true
};

// Load settings
chrome.storage.sync.get(settings, (items) => {
  settings = items;
  if (settings.enabled) {
    init();
  }
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    for (let key in changes) {
      settings[key] = changes[key].newValue;
    }
    if (changes.enabled || changes.targetQuality) {
      location.reload();
    }
  }
});

function init() {
  injectScript();
  injectStyles();
  observeIframes();
}

/**
 * Inject the main script into the page context
 */
function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    this.remove();
    window.postMessage({
      type: 'HOLODEX_QUALITY_SETTINGS',
      settings: settings
    }, '*');
  };
  (document.head || document.documentElement).appendChild(script);
}

/**
 * Inject CSS for iframe manipulation
 * Key insight: We need to make iframes ACTUALLY large, not just min-size
 */
function injectStyles() {
  const style = document.createElement('style');
  style.id = 'holodex-quality-enhancer-styles';
  style.textContent = `
    /* CRITICAL: Force iframes to render at large dimensions */
    /* YouTube checks actual rendered size, not CSS min-size */
    iframe[src*="youtube.com/embed"],
    iframe[src*="youtube-nocookie.com/embed"] {
      /* Set actual dimensions that YouTube will detect */
      width: 1280px !important;
      height: 720px !important;
    }

    /* Scale down for display while keeping internal size large */
    /* This is the KEY to the solution */
    [class*="video-container"],
    [class*="player-wrapper"],
    [class*="VideoCell"] {
      position: relative !important;
      overflow: hidden !important;
    }

    /* Scale the iframe to fit the container */
    [class*="video-container"] iframe[src*="youtube"],
    [class*="player-wrapper"] iframe[src*="youtube"],
    [class*="VideoCell"] iframe[src*="youtube"] {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      transform-origin: top left !important;
    }

    /* Debug helper - shows actual iframe size */
    .holodex-quality-debug {
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(0,0,0,0.7);
      color: #0f0;
      padding: 5px;
      font-size: 10px;
      z-index: 9999;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Monitor for iframe creation and enhance them
 */
function observeIframes() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'IFRAME' && node.src && node.src.includes('youtube')) {
          enhanceIframe(node);
        }
        if (node.querySelectorAll) {
          node.querySelectorAll('iframe[src*="youtube"]').forEach(enhanceIframe);
        }
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Enhance existing iframes
  document.querySelectorAll('iframe[src*="youtube"]').forEach(enhanceIframe);
}

/**
 * Enhance YouTube iframe for high quality
 * Key strategy: Make iframe actually large, then scale down for display
 */
function enhanceIframe(iframe) {
  if (iframe.dataset.qualityEnhanced) return;
  iframe.dataset.qualityEnhanced = 'true';

  try {
    // Step 1: Ensure iframe has enablejsapi parameter
    const url = new URL(iframe.src);
    if (!url.searchParams.has('enablejsapi')) {
      url.searchParams.set('enablejsapi', '1');
      // Don't set src yet, we'll do it later
    }

    // Step 2: Find the parent container
    const container = iframe.closest('[class*="video-container"], [class*="player-wrapper"], [class*="VideoCell"]')
                      || iframe.parentElement;

    if (container) {
      // Get container dimensions
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Step 3: Set iframe to large size (1280x720 minimum)
      const targetWidth = Math.max(1280, containerWidth);
      const targetHeight = Math.max(720, containerHeight);

      iframe.width = targetWidth;
      iframe.height = targetHeight;
      iframe.style.width = `${targetWidth}px`;
      iframe.style.height = `${targetHeight}px`;

      // Step 4: Calculate scale to fit container
      const scaleX = containerWidth / targetWidth;
      const scaleY = containerHeight / targetHeight;
      const scale = Math.min(scaleX, scaleY);

      // Apply scale transform
      iframe.style.transform = `scale(${scale})`;
      iframe.style.transformOrigin = 'top left';
      iframe.style.position = 'absolute';
      iframe.style.top = '0';
      iframe.style.left = '0';

      // Step 5: Update iframe src with parameters
      url.searchParams.set('enablejsapi', '1');
      url.searchParams.set('origin', window.origin);

      // Add quality hints
      url.searchParams.set('vq', settings.targetQuality);
      url.searchParams.set('hd', '1');

      // Only reload iframe if src changed
      const newSrc = url.toString();
      if (iframe.src !== newSrc) {
        iframe.src = newSrc;
      }

      // Step 6: Add debug info (optional)
      if (window.location.search.includes('debug=1')) {
        const debug = document.createElement('div');
        debug.className = 'holodex-quality-debug';
        debug.textContent = `${targetWidth}x${targetHeight} @ ${(scale * 100).toFixed(0)}%`;
        container.style.position = 'relative';
        container.appendChild(debug);
      }

      // Step 7: Setup postMessage communication after iframe loads
      iframe.addEventListener('load', () => {
        setupIframeQualityControl(iframe);
      });

      console.log(`[Holodex Quality Enhancer] Enhanced iframe: ${targetWidth}x${targetHeight} scaled to ${(scale * 100).toFixed(0)}%`);
    }
  } catch (error) {
    console.error('[Holodex Quality Enhancer] Error enhancing iframe:', error);
  }
}

/**
 * Setup quality control via postMessage
 */
function setupIframeQualityControl(iframe) {
  try {
    // Wait a bit for player to initialize
    setTimeout(() => {
      // Send quality change command via postMessage
      const command = {
        event: 'command',
        func: 'setPlaybackQuality',
        args: [settings.targetQuality]
      };

      iframe.contentWindow.postMessage(JSON.stringify(command), '*');

      // Also try to open settings menu (may not work due to user interaction requirements)
      setTimeout(() => {
        const openSettings = {
          event: 'command',
          func: 'openVideoSettings'
        };
        iframe.contentWindow.postMessage(JSON.stringify(openSettings), '*');
      }, 1000);
    }, 2000);
  } catch (error) {
    console.error('[Holodex Quality Enhancer] Error setting up quality control:', error);
  }
}

/**
 * Handle window resize to adjust iframe scaling
 */
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    document.querySelectorAll('iframe[data-quality-enhanced="true"]').forEach(iframe => {
      const container = iframe.closest('[class*="video-container"], [class*="player-wrapper"], [class*="VideoCell"]')
                        || iframe.parentElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const iframeWidth = parseInt(iframe.width);
        const iframeHeight = parseInt(iframe.height);
        const scaleX = containerRect.width / iframeWidth;
        const scaleY = containerRect.height / iframeHeight;
        const scale = Math.min(scaleX, scaleY);
        iframe.style.transform = `scale(${scale})`;
      }
    });
  }, 250);
});

// Message listener for popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStatus') {
    sendResponse({
      enabled: settings.enabled,
      quality: settings.targetQuality,
      playersEnhanced: document.querySelectorAll('iframe[data-quality-enhanced="true"]').length
    });
  }
});

console.log('[Holodex Quality Enhancer] Content script loaded (Improved v2)');
