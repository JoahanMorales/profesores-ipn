// Google Analytics helper
export const trackPageView = (path) => {
  if (window.gtag) {
    window.gtag('config', 'G-XXXXXXXXXX', {
      page_path: path,
    });
  }
};

export const trackEvent = (action, category, label, value) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track key user actions
export const trackLogin = () => {
  trackEvent('login', 'Authentication', 'User Login');
};

export const trackSearch = (searchQuery) => {
  trackEvent('search', 'Search', searchQuery);
};

export const trackEvaluation = (profesorName) => {
  trackEvent('submit_evaluation', 'Engagement', profesorName);
};

export const trackProfileView = (profesorName) => {
  trackEvent('view_profile', 'Engagement', profesorName);
};

export const trackCoinsEarned = (amount) => {
  trackEvent('earn_coins', 'Rewards', 'Coins Earned', amount);
};

export const trackError = (errorMessage) => {
  trackEvent('error', 'Error', errorMessage);
};
