/**
 * Holodex Video Quality Enhancer - Popup Script
 */

// Default settings
const defaultSettings = {
  targetQuality: 'hd1080',
  minPlayerWidth: 1280,
  minPlayerHeight: 720,
  enabled: true
};

// Load settings on popup open
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
  updateStatus();
});

/**
 * Load settings from storage
 */
function loadSettings() {
  chrome.storage.sync.get(defaultSettings, (items) => {
    // Update UI
    document.getElementById('enableToggle').checked = items.enabled;

    // Select the correct quality radio button
    const qualityRadio = document.querySelector(`input[name="quality"][value="${items.targetQuality}"]`);
    if (qualityRadio) {
      qualityRadio.checked = true;
      updateQualitySelection(items.targetQuality);
    }
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Enable/disable toggle
  document.getElementById('enableToggle').addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.sync.set({ enabled }, () => {
      updateStatus();
      showNotification(enabled ? '拡張機能が有効になりました' : '拡張機能が無効になりました');
    });
  });

  // Quality selection
  document.querySelectorAll('input[name="quality"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      updateQualitySelection(e.target.value);
    });
  });

  // Quality option click (for better UX)
  document.querySelectorAll('.quality-option').forEach((option) => {
    option.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') {
        const radio = option.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          updateQualitySelection(radio.value);
        }
      }
    });
  });

  // Apply button
  document.getElementById('applyBtn').addEventListener('click', applySettings);
}

/**
 * Update quality option visual selection
 */
function updateQualitySelection(quality) {
  document.querySelectorAll('.quality-option').forEach((option) => {
    if (option.dataset.quality === quality) {
      option.classList.add('selected');
    } else {
      option.classList.remove('selected');
    }
  });
}

/**
 * Apply settings and reload Holodex tabs
 */
function applySettings() {
  const selectedQuality = document.querySelector('input[name="quality"]:checked').value;
  const enabled = document.getElementById('enableToggle').checked;

  const settings = {
    targetQuality: selectedQuality,
    minPlayerWidth: 1280,
    minPlayerHeight: 720,
    enabled: enabled
  };

  // Save settings
  chrome.storage.sync.set(settings, () => {
    showNotification('設定を保存しました。ページをリロードしています...');

    // Find all Holodex tabs and reload them
    chrome.tabs.query({ url: 'https://holodex.net/*' }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.reload(tab.id);
      });

      // Close popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1500);
    });
  });
}

/**
 * Update status display
 */
function updateStatus() {
  const statusEl = document.getElementById('status');
  const statusText = document.getElementById('status-text');
  const enabled = document.getElementById('enableToggle').checked;

  if (enabled) {
    statusEl.className = 'status status-active';
    statusText.textContent = '✅ 拡張機能は有効です';
  } else {
    statusEl.className = 'status status-inactive';
    statusText.textContent = '❌ 拡張機能は無効です';
  }

  // Query active tab to check if it's Holodex
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url && tabs[0].url.includes('holodex.net')) {
      // Query the tab for enhanced player count
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getStatus' }, (response) => {
        if (response && response.playersEnhanced > 0) {
          statusText.textContent = `✅ ${response.playersEnhanced}個のプレイヤーを最適化中`;
        }
      });
    }
  });
}

/**
 * Show notification
 */
function showNotification(message) {
  const statusText = document.getElementById('status-text');
  const originalText = statusText.textContent;

  statusText.textContent = message;

  setTimeout(() => {
    statusText.textContent = originalText;
  }, 2000);
}

/**
 * Get quality display name
 */
function getQualityDisplayName(quality) {
  const qualityNames = {
    'hd2160': '4K (2160p)',
    'hd1440': '1440p',
    'hd1080': '1080p (Full HD)',
    'hd720': '720p (HD)',
    'large': '480p',
    'medium': '360p',
    'small': '240p',
    'tiny': '144p'
  };

  return qualityNames[quality] || quality;
}
