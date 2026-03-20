import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function InstallPWA() {
  // const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    const handler = e => {
      e.preventDefault();
      
      setPromptInstall(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onClick = evt => {
    evt.preventDefault();
    if (!promptInstall) {
      showToast("App is already installed, or your browser requires manual installation (e.g., iOS Safari 'Add to Home Screen').", "info");
      return;
    }
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      
    });
  };

// Button is always visible now. Fallback toast handles unsupported states.
  return (
    <button
      onClick={onClick}
      className="flex w-full sm:w-auto justify-center sm:justify-start items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold text-sm sm:text-xs rounded-xl sm:rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-200 dark:border-indigo-800"
      title="Install Smart OD App"
    >
      <Download className="w-5 h-5 sm:w-4 sm:h-4" />
      <span>Install App</span>
    </button>
  );
}
