/**
 * Holodex Video Quality Enhancer - Injected Script
 * Runs in the page context to directly access YouTube Player API
 */

(function() {
  'use strict';

  let settings = {
    targetQuality: 'hd1080',
    minPlayerWidth: 1280,
    minPlayerHeight: 720,
    enabled: true
  };

  const qualityMap = {
    'hd2160': 'hd2160',  // 4K
    'hd1440': 'hd1440',  // 1440p
    'hd1080': 'hd1080',  // 1080p
    'hd720': 'hd720',    // 720p
    'large': 'large',    // 480p
    'medium': 'medium',  // 360p
    'small': 'small',    // 240p
    'tiny': 'tiny'       // 144p
  };

  // Listen for settings from content script
  window.addEventListener('message', (event) => {
    if (event.data.type === 'HOLODEX_QUALITY_SETTINGS') {
      settings = event.data.settings;
      console.log('[Holodex Quality Enhancer] Settings received:', settings);
    }
  });

  /**
   * Override the youtube-player package's createPlayer function
   * to inject our quality settings
   */
  function interceptYouTubePlayerCreation() {
    // Store reference to original YT.Player constructor
    const originalYTPlayer = window.YT?.Player;

    // Check if YT API is already loaded
    if (window.YT && window.YT.Player) {
      wrapYTPlayer();
    }

    // Also intercept when YT API loads
    const originalOnYouTubeIframeAPIReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = function() {
      console.log('[Holodex Quality Enhancer] YouTube IFrame API ready');

      // Call original handler if exists
      if (typeof originalOnYouTubeIframeAPIReady === 'function') {
        originalOnYouTubeIframeAPIReady();
      }

      wrapYTPlayer();
    };
  }

  /**
   * Wrap YT.Player constructor to modify player options
   */
  function wrapYTPlayer() {
    if (!window.YT || !window.YT.Player) return;

    const OriginalPlayer = window.YT.Player;

    window.YT.Player = function(elementId, options) {
      console.log('[Holodex Quality Enhancer] Creating YouTube player:', elementId, options);

      // Modify player options
      options = options || {};
      options.width = options.width || settings.minPlayerWidth;
      options.height = options.height || settings.minPlayerHeight;

      // Modify playerVars for quality
      options.playerVars = options.playerVars || {};

      // Request HD
      options.playerVars.hd = 1;
      options.playerVars.vq = settings.targetQuality;

      // Store original onReady callback
      const originalOnReady = options.events?.onReady;

      // Add our own onReady handler
      options.events = options.events || {};
      options.events.onReady = function(event) {
        console.log('[Holodex Quality Enhancer] Player ready:', event.target);

        // Try to set quality after player is ready
        setTimeout(() => {
          trySetQuality(event.target);
        }, 1000);

        // Call original onReady if exists
        if (typeof originalOnReady === 'function') {
          originalOnReady(event);
        }
      };

      // Create player with modified options
      const player = new OriginalPlayer(elementId, options);

      // Store player reference for later access
      if (!window.holodexQualityEnhancer) {
        window.holodexQualityEnhancer = {
          players: []
        };
      }
      window.holodexQualityEnhancer.players.push(player);

      return player;
    };

    // Copy static properties
    for (let prop in OriginalPlayer) {
      if (OriginalPlayer.hasOwnProperty(prop)) {
        window.YT.Player[prop] = OriginalPlayer[prop];
      }
    }

    console.log('[Holodex Quality Enhancer] YT.Player wrapped successfully');
  }

  /**
   * Try to set quality on a YouTube player
   * Uses multiple methods as fallback
   */
  function trySetQuality(player) {
    if (!player) return;

    try {
      // Method 1: Try the deprecated but sometimes still working setPlaybackQuality
      if (typeof player.setPlaybackQuality === 'function') {
        console.log('[Holodex Quality Enhancer] Attempting setPlaybackQuality:', settings.targetQuality);
        player.setPlaybackQuality(settings.targetQuality);
      }

      // Method 2: Try to access internal player and set quality
      if (typeof player.setPlaybackQualityRange === 'function') {
        console.log('[Holodex Quality Enhancer] Attempting setPlaybackQualityRange');
        player.setPlaybackQualityRange(settings.targetQuality, settings.targetQuality);
      }

      // Method 3: Get available quality levels and log them
      if (typeof player.getAvailableQualityLevels === 'function') {
        const levels = player.getAvailableQualityLevels();
        console.log('[Holodex Quality Enhancer] Available quality levels:', levels);
      }

      // Method 4: Access iframe directly and manipulate it
      const iframe = player.getIframe?.();
      if (iframe) {
        // Ensure minimum dimensions
        iframe.style.minWidth = `${settings.minPlayerWidth}px`;
        iframe.style.minHeight = `${settings.minPlayerHeight}px`;

        // Try to reload with quality parameter
        const currentSrc = iframe.src;
        if (currentSrc && !currentSrc.includes('vq=')) {
          const separator = currentSrc.includes('?') ? '&' : '?';
          iframe.src = `${currentSrc}${separator}vq=${settings.targetQuality}&hd=1`;
        }
      }

      // Method 5: Monitor and re-apply quality settings periodically
      let attempts = 0;
      const qualityInterval = setInterval(() => {
        attempts++;

        if (attempts > 10) {
          clearInterval(qualityInterval);
          return;
        }

        if (typeof player.setPlaybackQuality === 'function') {
          const currentQuality = player.getPlaybackQuality?.();
          if (currentQuality && currentQuality !== settings.targetQuality) {
            console.log(`[Holodex Quality Enhancer] Current quality: ${currentQuality}, setting to: ${settings.targetQuality}`);
            player.setPlaybackQuality(settings.targetQuality);
          }
        }
      }, 2000);

      // Clear interval after 20 seconds
      setTimeout(() => clearInterval(qualityInterval), 20000);

    } catch (error) {
      console.error('[Holodex Quality Enhancer] Error setting quality:', error);
    }
  }

  /**
   * Expose function to manually set quality on all players
   */
  window.setHolodexQuality = function(quality) {
    if (!qualityMap[quality]) {
      console.error('[Holodex Quality Enhancer] Invalid quality:', quality);
      return;
    }

    settings.targetQuality = quality;

    if (window.holodexQualityEnhancer?.players) {
      window.holodexQualityEnhancer.players.forEach((player, index) => {
        console.log(`[Holodex Quality Enhancer] Setting quality for player ${index}:`, quality);
        trySetQuality(player);
      });
    }
  };

  /**
   * Override XMLHttpRequest to intercept API calls
   * and modify player configuration requests
   */
  function interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._url = url;
      return originalOpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function(data, ...args) {
      // Intercept YouTube player config requests
      if (this._url && this._url.includes('youtube.com')) {
        console.log('[Holodex Quality Enhancer] YouTube API request:', this._url);
      }

      return originalSend.call(this, data, ...args);
    };
  }

  // Initialize
  interceptYouTubePlayerCreation();
  interceptXHR();

  console.log('[Holodex Quality Enhancer] Injected script loaded');

  // Expose for debugging
  window.holodexQualityEnhancer = window.holodexQualityEnhancer || {};
  window.holodexQualityEnhancer.trySetQuality = trySetQuality;
  window.holodexQualityEnhancer.settings = settings;

})();
