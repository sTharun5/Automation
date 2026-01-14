export default function ActionCard({ title, description, color, buttonText }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:scale-105 transition">
      <h3 className={`text-lg font-semibold text-${color}-800`}>
        {title}
      </h3>
      <p className="text-sm text-gray-600 mt-2">
        {description}
      </p>
      <button
        className={`mt-4 w-full bg-${color}-700 text-white py-2 rounded-lg font-semibold`}
      >
        {buttonText}
      </button>
    </div>
  );
}
