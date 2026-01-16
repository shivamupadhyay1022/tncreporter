import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Tailwind is loaded via CDN in popup.html
function ConsentLensPopup() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [userPreferences, setUserPreferences] = useState({
    privacy_weight: 0.4,
    legal_rights_weight: 0.4,
    convenience_weight: 0.2,
    risk_threshold: 50,
    enable_notifications: true,
  });
  const [viewMode, setViewMode] = useState('current'); // current, history, settings
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize popup
    initializePopup();
  }, []);

  const initializePopup = async () => {
    try {
      // Get current tab URL
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        setCurrentUrl(tab.url);
        
        // Get cached analysis for current URL
        const cachedAnalysis = await getCachedAnalysis(tab.url);
        if (cachedAnalysis) {
          setCurrentAnalysis(cachedAnalysis);
        }
      }
      
      // Load analysis history
      const history = await getAnalysisHistory();
      setAnalysisHistory(history);
      
      // Load user preferences
      const preferences = await getUserPreferences();
      setUserPreferences(preferences);
      
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      setError('Failed to initialize extension');
    }
  };

  const analyzeCurrentPage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject content script if needed and extract text
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'DETECT_CONSENT_MOMENT',
        url: currentUrl,
        elements: ['body'] // For manual analysis, extract main body text
      });
      
      if (response?.status === 'ANALYZED') {
        setCurrentAnalysis(response.analysis);
        const history = await getAnalysisHistory();
        setAnalysisHistory(history);
      } else if (response?.status === 'CACHED') {
        setCurrentAnalysis(response.analysis);
      } else {
        setError('No consent elements found on this page. Try visiting a signup or terms page.');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to analyze page. Ensure you\'re on a web page with terms or privacy policies.');
    } finally {
      setLoading(false);
    }
  };

  const getCachedAnalysis = async (url) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CACHED_ANALYSIS',
        url
      });
      return response?.analysis || null;
    } catch (error) {
      console.error('Failed to get cached analysis:', error);
      return null;
    }
  };

  const getAnalysisHistory = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_ANALYSIS_HISTORY'
      });
      return response || [];
    } catch (error) {
      console.error('Failed to get analysis history:', error);
      return [];
    }
  };

  const getUserPreferences = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_USER_PREFERENCES'
      });
      return response || userPreferences;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return userPreferences;
    }
  };

  const updateUserPreferences = async (newPreferences) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_USER_PREFERENCES',
        preferences: newPreferences
      });
      setUserPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      setError('Failed to update preferences');
    }
  };

  const getRiskLevel = (score) => {
    if (score > 70) return { level: 'HIGH', color: 'red' };
    if (score > 40) return { level: 'MEDIUM', color: 'orange' };
    return { level: 'LOW', color: 'green' };
  };

  const getRiskColorClass = (score) => {
    const { color } = getRiskLevel(score);
    switch (color) {
      case 'red': return 'text-red-600';
      case 'orange': return 'text-orange-600';
      case 'green': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBgColorClass = (score) => {
    const { color } = getRiskLevel(score);
    switch (color) {
      case 'red': return 'bg-red-100';
      case 'orange': return 'bg-orange-100';
      case 'green': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <h1 className="text-xl font-bold flex items-center">
          🔍 ConsentLens
        </h1>
        <p className="text-sm text-blue-100 mt-1">AI-Powered Contract Intelligence</p>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setViewMode('current')}
          className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
            viewMode === 'current'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Current Page
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
            viewMode === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          History
        </button>
        <button
          onClick={() => setViewMode('settings')}
          className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
            viewMode === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {viewMode === 'current' && (
          <CurrentView
            currentUrl={currentUrl}
            currentAnalysis={currentAnalysis}
            onAnalyze={analyzeCurrentPage}
            loading={loading}
            getRiskColorClass={getRiskColorClass}
            getRiskBgColorClass={getRiskBgColorClass}
          />
        )}

        {viewMode === 'history' && (
          <HistoryView
            analysisHistory={analysisHistory}
            getRiskColorClass={getRiskColorClass}
            getRiskBgColorClass={getRiskBgColorClass}
          />
        )}

        {viewMode === 'settings' && (
          <SettingsView
            userPreferences={userPreferences}
            onUpdatePreferences={updateUserPreferences}
          />
        )}
      </div>
    </div>
  );
}

function CurrentView({ currentUrl, currentAnalysis, onAnalyze, loading, getRiskColorClass, getRiskBgColorClass }) {
  const [showDetails, setShowDetails] = useState(false);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-600">Analyzing terms and policies...</p>
      </div>
    );
  }

  if (!currentAnalysis) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Analysis Available</h3>
        <p className="text-gray-600 text-sm mb-4">
          Visit a page with terms, privacy policies, or consent forms to see AI analysis.
        </p>
        <p className="text-gray-500 text-xs mb-4">
          {currentUrl ? `Current: ${new URL(currentUrl).hostname}` : 'No active page'}
        </p>
        <button
          onClick={onAnalyze}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Analyze Current Page
        </button>
      </div>
    );
  }

  const riskLevel = currentAnalysis.risk_level || 
    (currentAnalysis.risk_score > 70 ? 'HIGH' : currentAnalysis.risk_score > 40 ? 'MEDIUM' : 'LOW');

  return (
    <div>
      <div className={`text-center p-4 rounded-lg mb-4 ${getRiskBgColorClass(currentAnalysis.risk_score)}`}>
        <div className={`text-3xl font-bold ${getRiskColorClass(currentAnalysis.risk_score)}`}>
          {Math.round(currentAnalysis.risk_score)}/100
        </div>
        <div className={`text-lg font-semibold ${getRiskColorClass(currentAnalysis.risk_score)}`}>
          {riskLevel} RISK
        </div>
      </div>

      {currentAnalysis.benchmark && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            {currentAnalysis.benchmark.percentage > 50 ? '⚠️ Worse' : '✅ Better'} than 
            <span className="font-semibold"> {Math.abs(currentAnalysis.benchmark.percentage)}% </span>
            of {currentAnalysis.benchmark.category}
          </p>
        </div>
      )}

      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 mb-2">🚩 Critical Red Flags</h3>
        <div className="space-y-2">
          {currentAnalysis.red_flags.slice(0, 3).map((flag, index) => (
            <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start">
                <span className="text-red-500 mr-2">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{flag.explanation}</p>
                  <p className="text-xs text-red-600 mt-1"><strong>Impact:</strong> {flag.implication}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition-colors text-sm"
      >
        {showDetails ? 'Hide' : 'Show'} Detailed Analysis
      </button>

      {showDetails && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Risk Categories</h4>
          <div className="space-y-1">
            {currentAnalysis.categories?.map((cat, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">{cat.name}</span>
                <span className={getRiskColorClass(cat.severity)}>{cat.severity.toFixed(1)}/100</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 text-center">
        <button
          onClick={onAnalyze}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          Re-analyze Page
        </button>
      </div>
    </div>
  );
}

function HistoryView({ analysisHistory, getRiskColorClass, getRiskBgColorClass }) {
  if (!analysisHistory || analysisHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">📚</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No History</h3>
        <p className="text-gray-600 text-sm">
          Consent analyses will appear here after you visit pages with terms and policies.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-3">Analysis History</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {analysisHistory.map((entry, index) => {
          const date = new Date(entry.timestamp).toLocaleDateString();
          const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          return (
            <div key={index} className={`p-3 rounded-lg border ${getRiskBgColorClass(entry.analysis.risk_score)} border-gray-200`}>
              <div className="flex justify-between items-start mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {entry.domain || new URL(entry.url).hostname}
                  </p>
                  <p className="text-xs text-gray-500">{date} at {time}</p>
                </div>
                <div className={`text-sm font-bold ${getRiskColorClass(entry.analysis.risk_score)} ml-2`}>
                  {Math.round(entry.analysis.risk_score)}/100
                </div>
              </div>
              
              {entry.analysis.red_flags?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600">
                    {entry.analysis.red_flags.length} red flag{entry.analysis.red_flags.length !== 1 ? 's' : ''} detected
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingsView({ userPreferences, onUpdatePreferences }) {
  const [tempPreferences, setTempPreferences] = useState(userPreferences);

  useEffect(() => {
    setTempPreferences(userPreferences);
  }, [userPreferences]);

  const handleSliderChange = (key, value) => {
    const newPrefs = { ...tempPreferences, [key]: value };
    setTempPreferences(newPrefs);
    
    // Auto-save with debounce
    clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(() => {
      onUpdatePreferences(newPrefs);
    }, 500);
  };

  const handleCheckboxChange = (key, checked) => {
    const newPrefs = { ...tempPreferences, [key]: checked };
    setTempPreferences(newPrefs);
    onUpdatePreferences(newPrefs);
  };

  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-4">Risk Preferences</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Privacy Protection Priority
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={tempPreferences.privacy_weight}
            onChange={(e) => handleSliderChange('privacy_weight', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Legal Rights Protection
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={tempPreferences.legal_rights_weight}
            onChange={(e) => handleSliderChange('legal_rights_weight', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Convenience vs Protection
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={tempPreferences.convenience_weight}
            onChange={(e) => handleSliderChange('convenience_weight', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Protection</span>
            <span>Balanced</span>
            <span>Convenience</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Risk Alert Threshold
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={tempPreferences.risk_threshold}
            onChange={(e) => handleSliderChange('risk_threshold', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>Show alerts above: {tempPreferences.risk_threshold}</span>
            <span>100</span>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="notifications"
            checked={tempPreferences.enable_notifications}
            onChange={(e) => handleCheckboxChange('enable_notifications', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="notifications" className="ml-2 block text-sm text-gray-700">
            Enable risk notifications
          </label>
        </div>
      </div>

      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-1">How Preferences Work</h4>
        <p className="text-xs text-blue-700">
          Your preferences adjust how ConsentLens weighs different types of risks. 
          Higher privacy weighting will flag data collection clauses more heavily, 
          while legal rights weighting focuses on arbitration and liability clauses.
        </p>
      </div>

      <div className="mt-4 text-center">
        <a 
          href="https://github.com/consentlens/consentlens" 
          target="_blank" 
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          About ConsentLens
        </a>
      </div>
    </div>
  );
}

// Mount React app
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<ConsentLensPopup />);