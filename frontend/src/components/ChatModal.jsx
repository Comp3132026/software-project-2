export default function ChatModal({
  title = 'Modal Title',
  placeholder = '',
  value,
  setValue,
  buttonText = 'Submit',
  buttonColor = 'bg-blue-600',
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] p-6 rounded-xl shadow-lg">
        <h2 className="text-lg text-black font-bold mb-4">{title}</h2>

        <textarea
          rows="4"
          className={`text-black w-full border rounded-lg p-3 focus:outline-none focus:ring-2 
            ${buttonColor.replace('bg-', 'focus:ring-')}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        <div className="flex justify-end mt-4 gap-3">
          <button className="px-3 py-2 bg-gray-300 rounded-lg" onClick={onClose}>
            Cancel
          </button>

          <button className={`px-4 py-2 text-white rounded-lg ${buttonColor}`} onClick={onSubmit}>
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
