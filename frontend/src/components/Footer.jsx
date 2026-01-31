export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-5">
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} SMART OD Automation System · Bannari Amman Institute of Technology
        </p>
      </div>
    </footer>
  );
}
