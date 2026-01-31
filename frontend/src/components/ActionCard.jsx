export default function ActionCard({
  title,
  description,
  buttonText,
  onClick
}) {
  return (
    <div className="
      group bg-white dark:bg-slate-900
      rounded-2xl shadow-md
      border border-slate-200 dark:border-slate-800
      p-6 flex flex-col justify-between
      transition-all duration-300
      hover:shadow-xl hover:-translate-y-1
    ">

      {/* Accent bar */}
      <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4" />

      {/* Content */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
          {title}
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          {description}
        </p>
      </div>

      {/* Button */}
      <button
        onClick={onClick}
        className="
          mt-6 w-full py-2.5 rounded-xl font-semibold
          bg-slate-900 dark:bg-white
          text-white dark:text-slate-900
          transition-all
          group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600
          group-hover:text-white
        "
      >
        {buttonText}
      </button>


    </div>


  );
}
