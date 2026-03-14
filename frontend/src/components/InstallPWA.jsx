import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handler = e => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("transitionend", handler);
  }, []);

  const onClick = evt => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      setSupportsPWA(false);
    });
  };

  if (!supportsPWA || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-slate-900 border border-slate-700 text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between animate-springUp">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-500/20 p-2 rounded-xl">
          <Download className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h4 className="font-bold text-sm">Install Smart OD</h4>
          <p className="text-xs text-slate-400">Add to home screen for faster access</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setIsDismissed(true)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
          <X className="w-5 h-5" />
        </button>
        <button onClick={onClick} className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
          Install
        </button>
      </div>
    </div>
  );
}
