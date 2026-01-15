/**
 * Holodex Video Quality Enhancer - Content Script (v1.1.1 - Fixed)
 * Uses iframe size manipulation to enable high-quality playback
 * Fixed: Videos not displaying, chat iframe affected
 */

let settings = {
  targetQuality: 'hd1080',
  forceFullSize: true,
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
 * Inject minimal CSS - most styling is done in JS per-iframe
 */
function injectStyles() {
  const style = document.createElement('style');
  style.id = 'holodex-quality-enhancer-styles';
  style.textContent = `
    /* Only apply styles to enhanced YouTube iframes */
    iframe.holodex-enhanced-yt {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      transform-origin: top left !important;
    }

    /* Debug helper */
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
        if (node.tagName === 'IFRAME') {
          checkAndEnhanceIframe(node);
        }
        if (node.querySelectorAll) {
          node.querySelectorAll('iframe').forEach(checkAndEnhanceIframe);
        }
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Enhance existing iframes
  document.querySelectorAll('iframe').forEach(checkAndEnhanceIframe);
}

/**
 * Check if iframe is YouTube video and should be enhanced
 */
function checkAndEnhanceIframe(iframe) {
  // Skip if already processed
  if (iframe.dataset.qualityChecked) return;
  iframe.dataset.qualityChecked = 'true';

  // Only process YouTube video iframes
  if (!iframe.src) return;

  const src = iframe.src.toLowerCase();
  const isYouTube = src.includes('youtube.com/embed') || src.includes('youtube-nocookie.com/embed');

  // Skip non-YouTube iframes
  if (!isYouTube) {
    console.log('[Holodex Quality Enhancer] Skipping non-YouTube iframe:', iframe.src);
    return;
  }

  // Skip if it looks like a chat iframe (common patterns)
  if (src.includes('chat') || src.includes('livechat')) {
    console.log('[Holodex Quality Enhancer] Skipping chat iframe');
    return;
  }

  // Find the video container - be more specific
  const container = findVideoContainer(iframe);

  if (!container) {
    console.log('[Holodex Quality Enhancer] No suitable container found for iframe');
    return;
  }

  // Enhance this iframe
  enhanceIframe(iframe, container);
}

/**
 * Find the appropriate video container for an iframe
 * Avoids chat containers
 */
function findVideoContainer(iframe) {
  // Try to find a video-specific container
  let container = iframe.closest('[class*="player"]');

  if (!container) {
    // Check if parent element has reasonable dimensions
    const parent = iframe.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      // Only use if parent has reasonable video-like dimensions
      if (rect.width > 100 && rect.height > 100) {
        container = parent;
      }
    }
  }

  // Extra check: make sure container doesn't contain "chat" in class name
  if (container && container.className && container.className.toLowerCase().includes('chat')) {
    console.log('[Holodex Quality Enhancer] Container appears to be chat, skipping');
    return null;
  }

  return container;
}

/**
 * Enhance YouTube iframe for high quality
 * Key strategy: Make iframe actually large, then scale down for display
 */
function enhanceIframe(iframe, container) {
  if (iframe.dataset.qualityEnhanced) return;
  iframe.dataset.qualityEnhanced = 'true';

  try {
    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Sanity check
    if (containerWidth < 50 || containerHeight < 50) {
      console.log('[Holodex Quality Enhancer] Container too small, skipping');
      return;
    }

    // Set iframe to large size (1280x720 minimum for HD)
    const targetWidth = Math.max(1280, containerWidth);
    const targetHeight = Math.max(720, containerHeight);

    // Calculate scale to fit container
    const scaleX = containerWidth / targetWidth;
    const scaleY = containerHeight / targetHeight;
    const scale = Math.min(scaleX, scaleY);

    // Apply dimensions and transform
    iframe.width = targetWidth;
    iframe.height = targetHeight;
    iframe.style.width = `${targetWidth}px`;
    iframe.style.height = `${targetHeight}px`;
    iframe.style.transform = `scale(${scale})`;

    // Add marker class
    iframe.classList.add('holodex-enhanced-yt');

    // Ensure container can hold the scaled iframe
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    // Set container dimensions to match what we expect
    // This prevents the large iframe from expanding the container
    const scaledWidth = targetWidth * scale;
    const scaledHeight = targetHeight * scale;

    // Only set container size if it's not already set properly
    if (container.style.width === '' || container.style.width === 'auto') {
      container.style.width = `${containerWidth}px`;
    }
    if (container.style.height === '' || container.style.height === 'auto') {
      container.style.height = `${containerHeight}px`;
    }

    // Update iframe src with quality parameters
    const url = new URL(iframe.src);
    url.searchParams.set('enablejsapi', '1');
    url.searchParams.set('origin', window.origin);
    url.searchParams.set('vq', settings.targetQuality);
    url.searchParams.set('hd', '1');

    const newSrc = url.toString();
    if (iframe.src !== newSrc) {
      iframe.src = newSrc;
    }

    // Add debug info if requested
    if (window.location.search.includes('debug=1')) {
      const debug = document.createElement('div');
      debug.className = 'holodex-quality-debug';
      debug.textContent = `YT: ${targetWidth}x${targetHeight} @ ${(scale * 100).toFixed(0)}%`;
      container.appendChild(debug);
    }

    // Setup postMessage communication after iframe loads
    iframe.addEventListener('load', () => {
      setupIframeQualityControl(iframe);
    });

    console.log(`[Holodex Quality Enhancer] Enhanced iframe: ${targetWidth}x${targetHeight} scaled to ${(scale * 100).toFixed(0)}%`);
  } catch (error) {
    console.error('[Holodex Quality Enhancer] Error enhancing iframe:', error);
  }
}

/**
 * Setup quality control via postMessage
 */
function setupIframeQualityControl(iframe) {
  try {
    setTimeout(() => {
      const command = {
        event: 'command',
        func: 'setPlaybackQuality',
        args: [settings.targetQuality]
      };
      iframe.contentWindow.postMessage(JSON.stringify(command), '*');
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
    document.querySelectorAll('iframe.holodex-enhanced-yt').forEach(iframe => {
      const container = findVideoContainer(iframe);
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
      playersEnhanced: document.querySelectorAll('iframe.holodex-enhanced-yt').length
    });
  }
});

console.log('[Holodex Quality Enhancer] Content script loaded (v1.1.1 - Fixed)');
