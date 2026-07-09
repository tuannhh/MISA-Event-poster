
import React, { useState, useEffect } from 'react';
import { Share, MoreVertical, PlusSquare, X, Download } from 'lucide-react';

const InstallPWA: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Check if already in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Don't show if already installed
    }

    // 2. Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
      // Show immediately on iOS (since there's no event)
      // Use a small delay to not annoy immediately on load
      setTimeout(() => setShowPrompt(true), 2000);
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
      // On Android, we wait for the beforeinstallprompt event
    }
  }, []);

  // 3. Handle Android Install Prompt Event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
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

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 p-4 max-w-sm mx-auto relative overflow-hidden">
        {/* Close Button */}
        <button 
          onClick={() => setShowPrompt(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 shrink-0">
             <img 
                src="https://www.misa.vn/wp-content/uploads/2021/03/logo.svg" 
                alt="App Icon" 
                className="w-10 h-10 object-contain"
             />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-sm mb-1">Cài đặt MISA Event App</h4>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              Thêm ứng dụng vào màn hình chính để sử dụng mượt mà, toàn màn hình như App thật.
            </p>

            {platform === 'ios' && (
              <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-700 border border-gray-100">
                <div className="flex items-center gap-2 mb-1.5">
                  1. Bấm nút <Share className="w-4 h-4 text-blue-500" /> <strong>Chia sẻ</strong>
                </div>
                <div className="flex items-center gap-2">
                  2. Chọn <PlusSquare className="w-4 h-4 text-gray-600" /> <strong>Thêm vào MH chính</strong>
                </div>
              </div>
            )}

            {platform === 'android' && (
              deferredPrompt ? (
                <button 
                  onClick={handleInstallClick}
                  className="w-full bg-misa-blue text-white font-bold py-2 rounded-lg text-sm shadow-md hover:bg-misa-dark transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Cài đặt ngay
                </button>
              ) : (
                <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-700 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    1. Bấm nút <MoreVertical className="w-4 h-4 text-gray-600" /> <strong>Menu</strong> (3 chấm)
                  </div>
                  <div className="flex items-center gap-2">
                    2. Chọn <Download className="w-4 h-4 text-gray-600" /> <strong>Cài đặt ứng dụng</strong>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
