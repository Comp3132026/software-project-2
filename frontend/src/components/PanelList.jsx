import { X } from 'lucide-react';

export default function PanelList({
  title,
  items,
  onClose,
  renderItem,
  showFrequency = false,
  frequency = '1h',
  setFrequency,
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg max-h-[80vh] overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        {/* Title + frequency*/}
        <div className="flex items-center gap-1 px-6 pt-5 pb-3 border-b">
          <h2 className="text-lg text-black font-semibold">{title}</h2>

          {showFrequency && (
            <div className="px-6 py-3 border-b bg-gray-50">
              <label className="text-sm font-medium text-gray-600">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="mt-1 w-full p-2 border rounded bg-white text-gray-700"
              >
                <option value="1h">Every hour</option>
                <option value="6h">Every 6 hours</option>
                <option value="12h">Every 12 hours</option>
                <option value="1d">Daily</option>
                <option value="3d">Every 3 days</option>
                <option value="1w">Weekly</option>
              </select>
            </div>
          )}
        </div>

        {/* Scrollable Item List */}
        <div className="p-6 space-y-3 overflow-y-auto max-h-[65vh]">
          {items && items.length > 0 ? (
            items.map((item) => (
              <div key={item._id || Math.random()} className="bg-gray-100 p-3 rounded">
                {renderItem(item)}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No items</p>
          )}
        </div>
      </div>
    </div>
  );
}
