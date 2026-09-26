import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait a bit before showing to not overwhelm the user
      setTimeout(() => setShowPrompt(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Optionally save to localStorage to not bug them again for X days
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-brand-600 text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Download size={20} />
            </div>
            <div>
              <p className="font-bold text-sm">Install CSE HUB</p>
              <p className="text-xs text-brand-100">Add to home screen</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleInstallClick}
              className="px-4 py-1.5 bg-white text-brand-700 text-sm font-bold rounded-lg hover:bg-brand-50"
            >
              Install
            </button>
            <button onClick={handleDismiss} className="p-2 text-brand-200 hover:text-white rounded-lg">
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
