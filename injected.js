/**
 * Holodex Video Quality Enhancer - Injected Script (Improved v2)
 * Runs in the page context to directly intercept YouTube Player API
 */

(function() {
  'use strict';

  let settings = {
    targetQuality: 'hd1080',
    enabled: true
  };

  const qualityMap = {
    'hd2160': 'hd2160',
    'hd1440': 'hd1440',
    'hd1080': 'hd1080',
    'hd720': 'hd720',
    'large': 'large',
    'medium': 'medium',
    'small': 'small',
    'tiny': 'tiny'
  };

  // Listen for settings from content script
  window.addEventListener('message', (event) => {
    if (event.data.type === 'HOLODEX_QUALITY_SETTINGS') {
      settings = event.data.settings;
      console.log('[Holodex Quality Enhancer] Settings received:', settings);
    }
  });

  /**
   * Intercept YouTube Player creation
   */
  function interceptYouTubePlayerCreation() {
    // Wait for YT API to load
    if (window.YT && window.YT.Player) {
      wrapYTPlayer();
    }

    const originalOnYouTubeIframeAPIReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function() {
      console.log('[Holodex Quality Enhancer] YouTube IFrame API ready');
      if (typeof originalOnYouTubeIframeAPIReady === 'function') {
        originalOnYouTubeIframeAPIReady();
      }
      wrapYTPlayer();
    };
  }

  /**
   * Wrap YT.Player constructor to modify options and behavior
   */
  function wrapYTPlayer() {
    if (!window.YT || !window.YT.Player) return;

    const OriginalPlayer = window.YT.Player;

    window.YT.Player = function(elementId, options) {
      console.log('[Holodex Quality Enhancer] Creating YouTube player:', elementId, options);

      options = options || {};

      // CRITICAL: Set large player dimensions
      // YouTube uses these dimensions to determine available qualities
      options.width = Math.max(options.width || 0, 1280);
      options.height = Math.max(options.height || 0, 720);

      // Ensure playerVars exists
      options.playerVars = options.playerVars || {};

      // Add quality-related parameters
      options.playerVars.vq = settings.targetQuality;
      options.playerVars.hd = 1;

      // Store original onReady callback
      const originalOnReady = options.events?.onReady;
      const originalOnStateChange = options.events?.onStateChange;

      options.events = options.events || {};

      // Enhanced onReady handler
      options.events.onReady = function(event) {
        console.log('[Holodex Quality Enhancer] Player ready:', event.target);

        // Try multiple methods to set quality
        trySetQualityMultipleMethods(event.target);

        // Call original onReady
        if (typeof originalOnReady === 'function') {
          originalOnReady(event);
        }
      };

      // Enhanced onStateChange to retry quality setting when playing
      options.events.onStateChange = function(event) {
        // YT.PlayerState.PLAYING = 1
        if (event.data === 1) {
          setTimeout(() => {
            trySetQualityMultipleMethods(event.target);
          }, 500);
        }

        // Call original onStateChange
        if (typeof originalOnStateChange === 'function') {
          originalOnStateChange(event);
        }
      };

      // Create player with modified options
      const player = new OriginalPlayer(elementId, options);

      // Store player reference
      if (!window.holodexQualityEnhancer) {
        window.holodexQualityEnhancer = {
          players: [],
          settings: settings
        };
      }
      window.holodexQualityEnhancer.players.push(player);

      // Monitor player for quality changes
      monitorPlayerQuality(player);

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
   * Try multiple methods to set quality
   */
  function trySetQualityMultipleMethods(player) {
    if (!player) return;

    try {
      // Method 1: Try setPlaybackQuality (deprecated but may work)
      if (typeof player.setPlaybackQuality === 'function') {
        console.log('[Holodex Quality Enhancer] Trying setPlaybackQuality:', settings.targetQuality);
        player.setPlaybackQuality(settings.targetQuality);
      }

      // Method 2: Try setPlaybackQualityRange (if available)
      if (typeof player.setPlaybackQualityRange === 'function') {
        console.log('[Holodex Quality Enhancer] Trying setPlaybackQualityRange');
        player.setPlaybackQualityRange(settings.targetQuality, settings.targetQuality);
      }

      // Method 3: Check available quality levels
      if (typeof player.getAvailableQualityLevels === 'function') {
        const levels = player.getAvailableQualityLevels();
        console.log('[Holodex Quality Enhancer] Available quality levels:', levels);

        // If target quality is available, try to set it
        if (levels.includes(settings.targetQuality)) {
          player.setPlaybackQuality(settings.targetQuality);
        } else if (levels.length > 0) {
          // Set to highest available
          console.log('[Holodex Quality Enhancer] Target quality not available, using:', levels[0]);
          player.setPlaybackQuality(levels[0]);
        }
      }

      // Method 4: Check current quality
      if (typeof player.getPlaybackQuality === 'function') {
        const currentQuality = player.getPlaybackQuality();
        console.log('[Holodex Quality Enhancer] Current quality:', currentQuality);
      }

      // Method 5: Access iframe and send postMessage directly
      const iframe = player.getIframe?.();
      if (iframe) {
        console.log('[Holodex Quality Enhancer] Sending postMessage to iframe');

        // Ensure iframe is large
        if (parseInt(iframe.width) < 1280) {
          iframe.width = 1280;
          iframe.height = 720;
          console.log('[Holodex Quality Enhancer] Resized iframe to 1280x720');
        }

        // Send quality command via postMessage
        setTimeout(() => {
          const command = {
            event: 'command',
            func: 'setPlaybackQuality',
            args: [settings.targetQuality]
          };
          iframe.contentWindow.postMessage(JSON.stringify(command), '*');
        }, 500);
      }

    } catch (error) {
      console.error('[Holodex Quality Enhancer] Error setting quality:', error);
    }
  }

  /**
   * Monitor player quality and re-apply if needed
   */
  function monitorPlayerQuality(player) {
    let attempts = 0;
    const maxAttempts = 10;

    const qualityMonitor = setInterval(() => {
      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(qualityMonitor);
        return;
      }

      try {
        if (typeof player.getPlaybackQuality === 'function') {
          const currentQuality = player.getPlaybackQuality();

          if (currentQuality && currentQuality !== settings.targetQuality) {
            console.log(`[Holodex Quality Enhancer] Quality monitor: current=${currentQuality}, target=${settings.targetQuality}`);

            // Try to set quality again
            if (typeof player.setPlaybackQuality === 'function') {
              player.setPlaybackQuality(settings.targetQuality);
            }
          }
        }
      } catch (error) {
        // Ignore errors in monitoring
      }
    }, 3000);

    // Stop monitoring after 30 seconds
    setTimeout(() => clearInterval(qualityMonitor), 30000);
  }

  /**
   * Expose manual quality control function
   */
  window.setHolodexQuality = function(quality) {
    if (!qualityMap[quality]) {
      console.error('[Holodex Quality Enhancer] Invalid quality:', quality);
      return;
    }

    settings.targetQuality = quality;
    console.log('[Holodex Quality Enhancer] Manual quality change to:', quality);

    if (window.holodexQualityEnhancer?.players) {
      window.holodexQualityEnhancer.players.forEach((player, index) => {
        console.log(`[Holodex Quality Enhancer] Setting quality for player ${index}`);
        trySetQualityMultipleMethods(player);
      });
    }
  };

  /**
   * Expose debug function
   */
  window.debugHolodexQuality = function() {
    console.log('=== Holodex Quality Enhancer Debug ===');
    console.log('Settings:', settings);
    console.log('Players:', window.holodexQualityEnhancer?.players);

    if (window.holodexQualityEnhancer?.players) {
      window.holodexQualityEnhancer.players.forEach((player, i) => {
        try {
          console.log(`Player ${i}:`);
          console.log('  Current quality:', player.getPlaybackQuality?.());
          console.log('  Available qualities:', player.getAvailableQualityLevels?.());
          console.log('  Iframe:', player.getIframe?.());
        } catch (e) {
          console.log(`  Error getting player ${i} info:`, e);
        }
      });
    }
  };

  // Initialize
  interceptYouTubePlayerCreation();

  console.log('[Holodex Quality Enhancer] Injected script loaded (Improved v2)');

  // Expose for debugging
  window.holodexQualityEnhancer = window.holodexQualityEnhancer || {
    players: [],
    settings: settings,
    setQuality: window.setHolodexQuality,
    debug: window.debugHolodexQuality
  };

})();
