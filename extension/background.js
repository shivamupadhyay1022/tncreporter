// ConsentLens Background Service Worker
class ConsentLensBackground {
  constructor() {
    this.API_ENDPOINT = 'http://localhost:3000/api/analyze';
    this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    this.init();
  }

  init() {
    this.setupMessageListeners();
    this.setupAlarm();
    console.log('ConsentLens Background Service Initialized');
  }

  setupMessageListeners() {
    // Handle messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Handle messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'GET_ANALYSIS_HISTORY') {
        this.getAnalysisHistory(sendResponse);
        return true;
      }
      if (message.type === 'GET_USER_PREFERENCES') {
        this.getUserPreferences(sendResponse);
        return true;
      }
      if (message.type === 'UPDATE_USER_PREFERENCES') {
        this.updateUserPreferences(message.preferences, sendResponse);
        return true;
      }
    });
  }

  setupAlarm() {
    // Clean up old cache entries daily
    chrome.alarms.create('cleanup-cache', { periodInMinutes: 60 * 24 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'cleanup-cache') {
        this.cleanupCache();
      }
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'DETECT_CONSENT_MOMENT':
          await this.handleConsentDetection(message, sender, sendResponse);
          break;
        case 'ANALYZE_TEXT':
          await this.analyzeLegalText(message.text, message.url, sendResponse);
          break;
        case 'GET_CACHED_ANALYSIS':
          await this.getCachedAnalysis(message.url, sendResponse);
          break;
        default:
          console.warn('Unknown message type:', message.type);
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  async handleConsentDetection(message, sender, sendResponse) {
    const { url, elements } = message;
    
    // Check cache first
    const cached = await this.getCachedAnalysis(url);
    if (cached && !this.isCacheExpired(cached.timestamp)) {
      sendResponse({ 
        status: 'CACHED', 
        analysis: cached.analysis,
        elements 
      });
      return;
    }

    // Extract text from detected elements
    const textToAnalyze = await this.extractTextFromElements(sender.tab.id, elements);
    
    if (textToAnalyze) {
      await this.analyzeLegalText(textToAnalyze, url, sendResponse);
    } else {
      sendResponse({ status: 'NO_TEXT_FOUND', elements });
    }
  }

  async extractTextFromElements(tabId, elements) {
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (elementSelectors) => {
          return elementSelectors.map(selector => {
            const element = document.querySelector(selector);
            return element ? element.innerText || element.textContent : '';
          }).join('\n\n');
        },
        args: [elements]
      });
      return result;
    } catch (error) {
      console.error('Error extracting text:', error);
      return null;
    }
  }

  async analyzeLegalText(text, url, sendResponse) {
    try {
      // Check cache first
      const cached = await this.getCachedAnalysis(url);
      if (cached && !this.isCacheExpired(cached.timestamp)) {
        sendResponse({ status: 'CACHED', analysis: cached.analysis });
        return;
      }

      // Call AI analysis API
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          url,
          language: 'en',
          user_preferences: await this.getUserPreferences(),
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const analysis = await response.json();
      
      // Cache the result
      await this.cacheAnalysis(url, analysis);
      
      // Store in history
      await this.storeAnalysisHistory(url, analysis);

      sendResponse({ status: 'ANALYZED', analysis });
    } catch (error) {
      console.error('Analysis error:', error);
      sendResponse({ 
        status: 'ERROR', 
        error: error.message,
        fallback: this.getFallbackAnalysis()
      });
    }
  }

  async cacheAnalysis(url, analysis) {
    const cacheKey = `analysis:${url}`;
    await chrome.storage.local.set({
      [cacheKey]: {
        analysis,
        timestamp: Date.now(),
        url,
      }
    });
  }

  async getCachedAnalysis(url) {
    const cacheKey = `analysis:${url}`;
    const result = await chrome.storage.local.get(cacheKey);
    return result[cacheKey] || null;
  }

  isCacheExpired(timestamp) {
    return Date.now() - timestamp > this.CACHE_DURATION;
  }

  async storeAnalysisHistory(url, analysis) {
    const historyKey = 'analysis_history';
    const result = await chrome.storage.local.get(historyKey);
    const history = result[historyKey] || [];
    
    const newEntry = {
      url,
      analysis,
      timestamp: Date.now(),
      domain: new URL(url).hostname,
    };

    // Keep only last 100 analyses
    const updatedHistory = [newEntry, ...history].slice(0, 100);
    await chrome.storage.local.set({ [historyKey]: updatedHistory });
  }

  async getAnalysisHistory() {
    const result = await chrome.storage.local.get('analysis_history');
    return result.analysis_history || [];
  }

  async getUserPreferences() {
    const result = await chrome.storage.local.get('user_preferences');
    return result.user_preferences || {
      privacy_weight: 0.4,
      legal_rights_weight: 0.4,
      convenience_weight: 0.2,
      risk_threshold: 50,
      enable_notifications: true,
    };
  }

  async updateUserPreferences(preferences, sendResponse) {
    await chrome.storage.local.set({ user_preferences: preferences });
    sendResponse({ success: true });
  }

  getFallbackAnalysis() {
    return {
      risk_score: 0,
      risk_level: 'UNKNOWN',
      red_flags: [
        {
          text: 'Unable to analyze terms',
          explanation: 'AI service is temporarily unavailable',
          implication: 'Manual review recommended',
          irreversible: false,
          confidence: 1.0,
        }
      ],
      categories: [],
      confidence: 1.0,
    };
  }

  async cleanupCache() {
    const allData = await chrome.storage.local.get(null);
    const now = Date.now();

    for (const [key, value] of Object.entries(allData)) {
      if (key.startsWith('analysis:') && value.timestamp) {
        if (now - value.timestamp > this.CACHE_DURATION) {
          await chrome.storage.local.remove(key);
        }
      }
    }
  }
}

// Initialize background service
const consentLensBackground = new ConsentLensBackground();

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('ConsentLens installed');
    // Set default preferences
    chrome.storage.local.set({
      user_preferences: {
        privacy_weight: 0.4,
        legal_rights_weight: 0.4,
        convenience_weight: 0.2,
        risk_threshold: 50,
        enable_notifications: true,
      }
    });
  }
});

// Handle tab updates to detect page changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Notify content script that page has loaded
    chrome.tabs.sendMessage(tabId, {
      type: 'PAGE_LOADED',
      url: tab.url,
    }).catch(() => {
      // Content script might not be injected yet
    });
  }
});