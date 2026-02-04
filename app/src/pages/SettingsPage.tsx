import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Globe, 
  Key, 
  TestTube, 
  Save,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [language, setLanguage] = useState(localStorage.getItem('app-language') || 'tr');
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('gemini-model') || 'gemini-2.5-flash');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleTestAPI = async () => {
    if (!apiKey.trim()) {
      setTestStatus('error');
      setTestMessage('Lütfen API anahtarı girin');
      return;
    }

    setTestStatus('testing');
    setTestMessage('API test ediliyor...');

    try {
      // Test with selected model
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello' }] }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTestStatus('success');
        setTestMessage(`✓ API anahtarı geçerli! Model: ${selectedModel}`);
      } else {
        const error = await response.json();
        setTestStatus('error');
        setTestMessage(`Hata: ${error.error?.message || 'API anahtarı geçersiz'}`);
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage('Bağlantı hatası. İnternet bağlantınızı kontrol edin.');
    }
  };

  const handleSave = () => {
    setSaveStatus('saving');
    
    // Save to localStorage
    localStorage.setItem('gemini-api-key', apiKey);
    localStorage.setItem('app-language', language);
    localStorage.setItem('gemini-model', selectedModel);
    
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="h-16 bg-black/80 backdrop-blur-xl border-b border-white/10 flex items-center px-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Geri Dön</span>
        </button>
        <h1 className="ml-6 text-xl font-bold text-white">Ayarlar</h1>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          {/* Language Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-950 border border-white/15 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Sistem Dili</h2>
                <p className="text-sm text-white/50">Uygulama dilini seçin</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/70">Dil</Label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white
                         focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>
            </div>
          </motion.div>

          {/* API Key Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-950 border border-white/15 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Gemini API Anahtarı</h2>
                <p className="text-sm text-white/50">AI analiz için gerekli</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/70">API Anahtarı</Label>
                <Input
                  type="password"
                  placeholder="AIza..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-white/5 border-white/15 text-white placeholder:text-white/30
                           focus:border-white/40 focus:ring-white/20 font-mono"
                />
                <p className="text-xs text-white/40">
                  API anahtarını{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:underline"
                  >
                    Google AI Studio
                  </a>
                  'dan alabilirsiniz
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">AI Modeli</Label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white
                           focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Önerilen - En Yeni)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (En Güçlü)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Hızlı)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </select>
                <p className="text-xs text-white/40">
                  Gemini 2.5 Flash en yeni ve dengeli modeldir
                </p>
              </div>

              <Button
                onClick={handleTestAPI}
                disabled={testStatus === 'testing'}
                variant="outline"
                className="w-full bg-transparent border-white/20 text-white hover:bg-white/5"
              >
                {testStatus === 'testing' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Test Ediliyor...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    API Anahtarını Test Et
                  </>
                )}
              </Button>

              {testStatus !== 'idle' && testStatus !== 'testing' && (
                <div
                  className={`p-3 rounded-lg border flex items-center gap-2 ${
                    testStatus === 'success'
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  {testStatus === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <p
                    className={`text-sm ${
                      testStatus === 'success' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {testMessage}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="w-full bg-white text-black hover:bg-gray-100 font-medium py-6"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Kaydedildi!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Ayarları Kaydet
                </>
              )}
            </Button>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4"
          >
            <p className="text-sm text-blue-400">
              <strong>Not:</strong> API anahtarınız tarayıcınızda güvenli bir şekilde saklanır.
              Sunucuya gönderilmez. Değişikliklerin etkili olması için sayfayı yenilemeniz gerekebilir.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
