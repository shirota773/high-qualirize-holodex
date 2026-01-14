/**
 * Holodex Video Quality Enhancer - Content Script
 * Injects scripts to manipulate YouTube player quality on Holodex
 */

// Load user settings from storage
let settings = {
  targetQuality: 'hd1080',
  minPlayerWidth: 1280,
  minPlayerHeight: 720,
  enabled: true
};

// Load settings
chrome.storage.sync.get(settings, (items) => {
  settings = items;
  if (settings.enabled) {
    injectScript();
  }
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    for (let key in changes) {
      settings[key] = changes[key].newValue;
    }
    // Reload page to apply new settings
    if (changes.enabled || changes.targetQuality) {
      location.reload();
    }
  }
});

/**
 * Inject the main script into the page context
 * This is necessary to access the YouTube player API directly
 */
function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    this.remove();

    // Pass settings to the injected script
    window.postMessage({
      type: 'HOLODEX_QUALITY_SETTINGS',
      settings: settings
    }, '*');
  };

  (document.head || document.documentElement).appendChild(script);
}

/**
 * Inject CSS to ensure minimum player dimensions
 * This triggers YouTube's quality selection based on player size
 */
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Force minimum dimensions for YouTube iframes in Holodex */
    iframe[src*="youtube.com/embed"],
    iframe[src*="youtube-nocookie.com/embed"] {
      min-width: ${settings.minPlayerWidth}px !important;
      min-height: ${settings.minPlayerHeight}px !important;
    }

    /* Ensure the player container can accommodate larger dimensions */
    .video-container,
    .player-wrapper,
    [class*="youtube-player"] {
      position: relative;
      width: 100% !important;
      height: 100% !important;
    }

    /* Override any Holodex styles that might limit player size */
    .multiview-cell iframe {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
    }
  `;
  document.head.appendChild(style);
}

// Inject styles immediately
if (document.head) {
  injectStyles();
} else {
  document.addEventListener('DOMContentLoaded', injectStyles);
}

/**
 * Monitor for iframe creation and modify src to include quality parameters
 */
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.tagName === 'IFRAME' && node.src && node.src.includes('youtube')) {
        modifyYouTubeIframe(node);
      }

      // Check child nodes as well
      if (node.querySelectorAll) {
        node.querySelectorAll('iframe[src*="youtube"]').forEach(modifyYouTubeIframe);
      }
    });
  });
});

// Start observing
observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

/**
 * Modify YouTube iframe to request higher quality
 */
function modifyYouTubeIframe(iframe) {
  if (iframe.dataset.qualityEnhanced) return;
  iframe.dataset.qualityEnhanced = 'true';

  try {
    const url = new URL(iframe.src);

    // Add quality-related parameters
    // vq parameter (legacy but sometimes still works)
    url.searchParams.set('vq', settings.targetQuality);

    // Request high quality explicitly
    url.searchParams.set('hd', '1');

    // Disable adaptive quality (force manual quality selection)
    // url.searchParams.set('aq', '0'); // Removed as this may not work

    // Set larger player size hint
    url.searchParams.set('w', settings.minPlayerWidth.toString());
    url.searchParams.set('h', settings.minPlayerHeight.toString());

    // Update iframe src
    iframe.src = url.toString();

    // Set minimum dimensions
    iframe.style.minWidth = `${settings.minPlayerWidth}px`;
    iframe.style.minHeight = `${settings.minPlayerHeight}px`;

    console.log('[Holodex Quality Enhancer] Enhanced iframe:', iframe.src);
  } catch (error) {
    console.error('[Holodex Quality Enhancer] Error modifying iframe:', error);
  }
}

// Message listener for communication with popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStatus') {
    sendResponse({
      enabled: settings.enabled,
      quality: settings.targetQuality,
      playersEnhanced: document.querySelectorAll('iframe[data-quality-enhanced="true"]').length
    });
  }
});

console.log('[Holodex Quality Enhancer] Content script loaded');
