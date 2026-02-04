// Initialize app with environment variables
export const initializeApp = () => {
  // Set API key from env if not already set
  const storedApiKey = localStorage.getItem('gemini-api-key');
  const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!storedApiKey && envApiKey) {
    console.log('Initializing API key from environment');
    localStorage.setItem('gemini-api-key', envApiKey);
  }

  // Set default model if not set
  const storedModel = localStorage.getItem('gemini-model');
  if (!storedModel) {
    localStorage.setItem('gemini-model', 'gemini-2.5-flash');
  }

  // Set default language if not set
  const storedLanguage = localStorage.getItem('app-language');
  if (!storedLanguage) {
    localStorage.setItem('app-language', 'tr');
  }
};
