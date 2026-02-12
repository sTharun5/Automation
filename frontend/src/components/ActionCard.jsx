const colorMap = {
  blue: {
    bar: "from-blue-600 to-indigo-600",
    button: "group-hover:from-blue-600 group-hover:to-indigo-600",
    iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  },
  green: {
    bar: "from-emerald-600 to-teal-600",
    button: "group-hover:from-emerald-600 group-hover:to-teal-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  },
  purple: {
    bar: "from-violet-600 to-purple-600",
    button: "group-hover:from-violet-600 group-hover:to-purple-600",
    iconBg: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
  },
};

export default function ActionCard({
  title,
  description,
  buttonText,
  color = "blue",
  icon,
  onClick,
}) {
  const styles = colorMap[color] || colorMap.blue;

  return (
    <div
      className="
        group bg-white dark:bg-slate-900
        rounded-2xl shadow-sm
        border border-slate-200 dark:border-slate-700/80
        p-6 flex flex-col justify-between
        transition-all duration-300
        hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${styles.iconBg}`}>
          {icon || "→"}
        </div>
        <div className={`h-1 w-10 rounded-full bg-gradient-to-r ${styles.bar} shrink-0`} />
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
          {description}
        </p>
      </div>

      <button
        onClick={onClick}
        className={`
          mt-6 w-full py-3 rounded-xl font-semibold text-sm
          bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900
          transition-all duration-300 hover:opacity-95 active:scale-[0.98]
          group-hover:bg-gradient-to-r ${styles.button}
          group-hover:text-white
        `}
      >
        {buttonText}
      </button>
    </div>
  );
}
