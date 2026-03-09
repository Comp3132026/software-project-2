export default function DashboardCircle({
  values = [],
  colors = ['#14b8a6', '#fbbf24', '#ef4444'],
  size = 200,
}) {
  // Convert undefined or non-numbers to 0
  const safeValues = values.map((v) => (typeof v === 'number' ? v : 0));
  const total = safeValues.reduce((a, b) => a + b, 0);

  // Default colors for: completed (teal), pending (amber), overdue (red)
  const defaultColors = ['#14b8a6', '#fbbf24', '#ef4444'];
  const chartColors = colors.length > 0 ? colors : defaultColors;

  // If all values = 0, show empty gradient circle
  if (total === 0) {
    return (
      <div
        className="rounded-full relative"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(from 0deg, ${chartColors[0]}40 0%, ${chartColors[0]}20 100%)`,
        }}
      >
        {/* Inner circle for donut effect */}
        <div
          className="absolute bg-white rounded-full"
          style={{
            width: size * 0.65,
            height: size * 0.65,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    );
  }

  let cumulative = 0;

  const segments = safeValues
    .map((v, i) => {
      const start = (cumulative / total) * 100;
      cumulative += v;
      const end = (cumulative / total) * 100;

      // If colors array is short, use the last color for remaining values
      const color = chartColors[i] ?? chartColors[chartColors.length - 1];

      return `${color} ${start}% ${end}%`;
    })
    .join(', ');

  return (
    <div
      className="rounded-full relative"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(from -90deg, ${segments})`,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Inner circle for donut effect */}
      <div
        className="absolute bg-white rounded-full shadow-inner flex items-center justify-center"
        style={{
          width: size * 0.65,
          height: size * 0.65,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="text-center">
          <span className="font-display font-bold text-dark-800" style={{ fontSize: size * 0.12 }}>
            {total}
          </span>
          <span className="block text-surface-300 font-medium" style={{ fontSize: size * 0.06 }}>
            total
          </span>
        </div>
      </div>

      {/* Subtle glow effect */}
      <div
        className="absolute inset-0 rounded-full opacity-20 blur-xl -z-10"
        style={{
          background: `conic-gradient(from -90deg, ${segments})`,
        }}
      />
    </div>
  );
}
