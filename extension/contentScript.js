// ConsentLens Content Script - DOM Detection & Injection
class ConsentLensContentScript {
  constructor() {
    this.consentKeywords = [
      'terms', 'conditions', 'privacy', 'policy', 'cookie', 'consent',
      'agreement', 'user agreement', 'service terms', 'legal', 'gdpr',
      'by continuing', 'by using', 'i agree', 'accept', 'i accept'
    ];
    
    this.consentSelectors = [
      // Button selectors
      'button[type="submit"]',
      'button:contains("Agree")',
      'button:contains("Accept")',
      'button:contains("I agree")',
      'button:contains("Continue")',
      'button:contains("Sign up")',
      'button:contains("Submit")',
      'input[type="submit"]',
      'input[type="button"][value*="Agree" i]',
      'input[type="button"][value*="Accept" i]',
      'input[type="button"][value*="Continue" i]',
      
      // Link selectors
      'a[href*="terms"]',
      'a[href*="privacy"]',
      'a[href*="legal"]',
      'a[href*="policy"]',
      'a[href*="cookie"]',
      
      // Checkbox selectors
      'input[type="checkbox"][name*="terms"]',
      'input[type="checkbox"][name*="privacy"]',
      'input[type="checkbox"][name*="agree"]',
      'input[type="checkbox"][name*="consent"]',
      
      // Common container selectors
      '.cookie-banner',
      '.cookie-notice',
      '.cookie-consent',
      '.terms-and-conditions',
      '.privacy-policy',
      '.legal-notice',
      '.user-agreement',
      '.tos-modal',
      '.privacy-modal',
      '.gdpr-banner'
    ];

    this.textElementSelectors = [
      'p', 'div', 'span', 'li', 'td', 'article', 'section',
      '.terms-text', '.privacy-text', '.legal-text',
      '[class*="terms"]', '[class*="privacy"]', '[class*="legal"]'
    ];

    this.observer = null;
    this.processedElements = new WeakSet();
    this.init();
  }

  init() {
    console.log('ConsentLens Content Script Initialized');
    this.setupMessageListeners();
    this.startDetection();
    this.setupMutationObserver();
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'PAGE_LOADED':
          this.handlePageLoaded(message.url);
          break;
        case 'ANALYSIS_COMPLETE':
          this.handleAnalysisComplete(message.analysis);
          break;
        case 'SHOW_OVERLAY':
          this.showAnalysisOverlay(message.analysis);
          break;
        case 'HIDE_OVERLAY':
          this.hideAnalysisOverlay();
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    });
  }

  handlePageLoaded(url) {
    console.log('Page loaded:', url);
    this.processedElements = new WeakSet(); // Reset for new page
    this.startDetection();
  }

  startDetection() {
    // Look for consent elements
    const consentElements = this.detectConsentElements();
    
    if (consentElements.length > 0) {
      console.log('Consent elements detected:', consentElements.length);
      this.processConsentElements(consentElements);
    }
  }

  detectConsentElements() {
    const elements = [];
    
    // Method 1: Direct keyword search near buttons
    const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
    buttons.forEach(button => {
      if (this.isProcessed(button)) return;
      
      const isConsentButton = this.isConsentButton(button);
      if (isConsentButton) {
        const textElements = this.findNearbyTextElements(button, 3);
        if (textElements.length > 0) {
          elements.push({
            button: button,
            textElements: textElements,
            type: 'button_with_text'
          });
          this.markAsProcessed(button);
        }
      }
    });

    // Method 2: Look for common consent containers
    const containerSelectors = [
      '.cookie-banner', '.cookie-notice', '.cookie-consent',
      '.terms-modal', '.privacy-modal', '.gdpr-banner',
      '[class*="cookie"]', '[class*="consent"]', '[class*="gdpr"]'
    ];
    
    containerSelectors.forEach(selector => {
      const containers = document.querySelectorAll(selector);
      containers.forEach(container => {
        if (this.isProcessed(container)) return;
        
        const button = container.querySelector('button, input[type="submit"], input[type="button"]');
        if (button && !this.isProcessed(button)) {
          elements.push({
            container: container,
            button: button,
            type: 'container_with_button'
          });
          this.markAsProcessed(container);
          this.markAsProcessed(button);
        }
      });
    });

    // Method 3: Look for forms with legal checkboxes
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (this.isProcessed(form)) return;
      
      const legalCheckbox = this.findLegalCheckbox(form);
      if (legalCheckbox) {
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitButton && !this.isProcessed(submitButton)) {
          elements.push({
            form: form,
            checkbox: legalCheckbox,
            button: submitButton,
            type: 'form_with_legal_checkbox'
          });
          this.markAsProcessed(form);
          this.markAsProcessed(submitButton);
        }
      }
    });

    return elements;
  }

  isConsentButton(button) {
    const text = (button.innerText || button.value || button.textContent || '').toLowerCase();
    const buttonText = text.trim();
    
    // Check button text
    const consentPhrases = [
      'agree', 'accept', 'i agree', 'i accept', 'continue', 'submit',
      'sign up', 'register', 'create account', 'get started'
    ];
    
    if (consentPhrases.some(phrase => buttonText.includes(phrase))) {
      // Check if there's legal text nearby
      const nearbyText = this.getNearbyText(button, 200).toLowerCase();
      return this.consentKeywords.some(keyword => nearbyText.includes(keyword));
    }
    
    return false;
  }

  findNearbyTextElements(element, maxDistance = 3) {
    const textElements = [];
    const allTextElements = document.querySelectorAll(this.textElementSelectors.join(', '));
    
    allTextElements.forEach(textEl => {
      if (this.isProcessed(textEl)) return;
      
      const distance = this.getElementDistance(element, textEl);
      if (distance <= maxDistance) {
        const text = (textEl.innerText || textEl.textContent || '').trim();
        if (text.length > 50 && this.containsLegalKeywords(text)) { // At least 50 chars and legal keywords
          textElements.push(textEl);
          this.markAsProcessed(textEl);
        }
      }
    });
    
    return textElements;
  }

  findLegalCheckbox(form) {
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    
    for (const checkbox of checkboxes) {
      const label = this.getCheckboxLabel(checkbox);
      if (label) {
        const labelText = label.toLowerCase();
        if (this.consentKeywords.some(keyword => labelText.includes(keyword))) {
          return checkbox;
        }
      }
    }
    
    return null;
  }

  getCheckboxLabel(checkbox) {
    // Method 1: Check for associated label element
    const label = document.querySelector(`label[for="${checkbox.id}"]`);
    if (label) return label.textContent;
    
    // Method 2: Check parent label
    const parentLabel = checkbox.closest('label');
    if (parentLabel) return parentLabel.textContent;
    
    // Method 3: Check following text
    const nextSibling = checkbox.nextSibling;
    if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
      return nextSibling.textContent;
    }
    
    return '';
  }

  containsLegalKeywords(text) {
    const lowerText = text.toLowerCase();
    return this.consentKeywords.some(keyword => lowerText.includes(keyword));
  }

  getNearbyText(element, radius = 200) {
    const elementRect = element.getBoundingClientRect();
    const centerX = elementRect.left + elementRect.width / 2;
    const centerY = elementRect.top + elementRect.height / 2;
    
    const nearbyElements = [];
    const allElements = document.querySelectorAll(this.textElementSelectors.join(', '));
    
    allElements.forEach(el => {
      if (el === element) return;
      
      const rect = el.getBoundingClientRect();
      const elCenterX = rect.left + rect.width / 2;
      const elCenterY = rect.top + rect.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(centerX - elCenterX, 2) + Math.pow(centerY - elCenterY, 2)
      );
      
      if (distance <= radius) {
        const text = (el.innerText || el.textContent || '').trim();
        if (text.length > 0) {
          nearbyElements.push({ element: el, text, distance });
        }
      }
    });
    
    // Sort by distance and return concatenated text
    nearbyElements.sort((a, b) => a.distance - b.distance);
    return nearbyElements.map(item => item.text).join('\n');
  }

  getElementDistance(element1, element2) {
    // Calculate DOM tree distance (number of nodes between elements)
    const path1 = this.getElementPath(element1);
    const path2 = this.getElementPath(element2);
    
    // Find common ancestor
    let commonIndex = 0;
    const minLength = Math.min(path1.length, path2.length);
    
    while (commonIndex < minLength && path1[commonIndex] === path2[commonIndex]) {
      commonIndex++;
    }
    
    // Distance is the sum of remaining paths
    return (path1.length - commonIndex) + (path2.length - commonIndex);
  }

  getElementPath(element) {
    const path = [];
    let current = element;
    
    while (current && current !== document.body) {
      path.unshift(current);
      current = current.parentElement;
    }
    
    return path;
  }

  isProcessed(element) {
    return this.processedElements.has(element);
  }

  markAsProcessed(element) {
    this.processedElements.add(element);
  }

  processConsentElements(elements) {
    elements.forEach(element => {
      this.injectConsentAnalysis(element);
    });
  }

  async injectConsentAnalysis(element) {
    // Extract text based on element type
    let textToAnalyze = '';
    let elementSelector = '';
    
    switch (element.type) {
      case 'button_with_text':
        textToAnalyze = element.textElements.map(el => el.innerText || el.textContent).join('\n\n');
        elementSelector = this.getElementSelector(element.button);
        break;
      
      case 'container_with_button':
        textToAnalyze = element.container.innerText || element.container.textContent;
        elementSelector = this.getElementSelector(element.container);
        break;
      
      case 'form_with_legal_checkbox':
        textToAnalyze = element.form.innerText || element.form.textContent;
        elementSelector = this.getElementSelector(element.form);
        break;
    }
    
    if (textToAnalyze.trim().length > 0) {
      // Send to background for analysis
      chrome.runtime.sendMessage({
        type: 'ANALYZE_TEXT',
        text: textToAnalyze,
        url: window.location.href,
        elements: [elementSelector],
      }, (response) => {
        if (response && response.analysis) {
          this.injectRiskIndicator(element, response.analysis);
        }
      });
    }
  }

  getElementSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }
    
    // Fallback to tag name
    return element.tagName.toLowerCase();
  }

  injectRiskIndicator(element, analysis) {
    const button = element.button || element.container?.querySelector('button, input[type="submit"]');
    
    if (!button || this.isProcessed(button)) return;

    // Create risk indicator
    const indicator = document.createElement('div');
    indicator.className = 'consentlens-risk-indicator';
    indicator.style.cssText = `
      position: absolute;
      top: -30px;
      right: 0;
      background: ${this.getRiskColor(analysis.risk_score)};
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      z-index: 999999;
      white-space: nowrap;
    `;
    
    const riskLevel = analysis.risk_level || (analysis.risk_score > 70 ? 'HIGH' : analysis.risk_score > 40 ? 'MEDIUM' : 'LOW');
    indicator.textContent = `⚠️ ${riskLevel} RISK: ${Math.round(analysis.risk_score)}/100`;
    
    // Add click handler to show detailed analysis
    indicator.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showDetailedAnalysis(analysis, button);
    });
    
    // Position the indicator relative to button
    button.style.position = 'relative';
    button.appendChild(indicator);
    
    this.markAsProcessed(button);
  }

  getRiskColor(score) {
    if (score > 70) return '#dc2626'; // red-600
    if (score > 40) return '#ea580c'; // orange-600
    return '#16a34a'; // green-600
  }

  showDetailedAnalysis(analysis, anchorElement) {
    // Remove existing overlay if any
    const existingOverlay = document.getElementById('consentlens-analysis-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'consentlens-analysis-overlay';
    overlay.innerHTML = this.generateAnalysisHTML(analysis);
    overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid ${this.getRiskColor(analysis.risk_score)};
      border-radius: 8px;
      padding: 20px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      z-index: 999999;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #333;
    `;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
    `;
    closeButton.onclick = () => overlay.remove();
    overlay.appendChild(closeButton);
    
    document.body.appendChild(overlay);
  }

  generateAnalysisHTML(analysis) {
    const riskLevel = analysis.risk_level || (analysis.risk_score > 70 ? 'HIGH' : analysis.risk_score > 40 ? 'MEDIUM' : 'LOW');
    const riskColor = this.getRiskColor(analysis.risk_score);
    
    return `
      <h2 style="color: ${riskColor}; margin-top: 0; margin-bottom: 16px;">
        🚨 Consent Risk Analysis
      </h2>
      
      <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
        <div style="font-size: 24px; font-weight: bold; color: ${riskColor};">
          ${Math.round(analysis.risk_score)}/100
        </div>
        <div style="font-size: 18px; font-weight: bold; color: ${riskColor};">
          ${riskLevel} RISK
        </div>
        <div style="margin-top: 8px;">
          ${analysis.benchmark ? `This policy is ${analysis.benchmark.percentage > 50 ? 'worse' : 'better'} than ${Math.abs(analysis.benchmark.percentage)}% of ${analysis.benchmark.category}` : ''}
        </div>
      </div>
      
      <h3 style="margin-bottom: 12px;">🚩 Critical Red Flags</h3>
      <div style="margin-bottom: 20px;">
        ${analysis.red_flags.map(flag => `
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin-bottom: 12px; border-radius: 4px;">
            <div style="font-weight: bold; color: #dc2626; margin-bottom: 4px;">
              ${flag.explanation}
            </div>
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">
              <strong>Impact:</strong> ${flag.implication}
            </div>
            ${flag.irreversible ? '<div style="color: #dc2626; font-size: 12px; font-weight: bold;">⚠️ This is IRREVERSIBLE</div>' : ''}
            <details style="margin-top: 8px; font-size: 12px;">
              <summary style="cursor: pointer; color: #4b5563;">View original text</summary>
              <div style="margin-top: 8px; padding: 8px; background: #f9fafb; border-radius: 4px; font-family: monospace;">
                "${flag.text}"
              </div>
              <div style="margin-top: 4px; color: #6b7280;">
                AI confidence: ${Math.round(flag.confidence * 100)}%
              </div>
            </details>
          </div>
        `).join('')}
      </div>
      
      ${analysis.categories ? `
        <h3 style="margin-bottom: 12px;">📊 Risk Categories</h3>
        <div style="margin-bottom: 20px;">
          ${analysis.categories.map(cat => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span>${cat.name}</span>
              <span style="color: ${this.getRiskColor(cat.severity)}; font-weight: bold;">
                ${cat.severity.toFixed(1)}/100
              </span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div style="background: #fef3c7; padding: 12px; border-radius: 4px; font-size: 12px; color: #92400e;">
        ⚖️ <strong>Disclaimer:</strong> This analysis is for informational purposes only and does not constitute legal advice. 
        Always consult with a qualified legal professional for legal matters.
      </div>
    `;
  }

  setupMutationObserver() {
    // Watch for dynamically loaded content
    this.observer = new MutationObserver((mutations) => {
      let shouldDetect = false;
      
      mutations.forEach(mutation => {
        // Check if any new nodes were added
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if it's a consent-related element
            const element = node;
            const className = element.className || '';
            const id = element.id || '';
            
            const isConsentRelated = 
              className.toLowerCase().includes('cookie') ||
              className.toLowerCase().includes('consent') ||
              className.toLowerCase().includes('modal') ||
              id.toLowerCase().includes('cookie') ||
              id.toLowerCase().includes('consent') ||
              element.tagName === 'BUTTON' ||
              element.tagName === 'FORM';
            
            if (isConsentRelated) {
              shouldDetect = true;
            }
          }
        });
      });
      
      if (shouldDetect) {
        // Debounce detection to avoid excessive checks
        clearTimeout(this.detectionTimeout);
        this.detectionTimeout = setTimeout(() => {
          this.startDetection();
        }, 500);
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ConsentLensContentScript();
  });
} else {
  new ConsentLensContentScript();
}