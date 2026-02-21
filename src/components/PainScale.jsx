export default function PainScale({ onSelect }) {
  const getColor = (n) => {
    if (n <= 3) return '#10B981';
    if (n <= 6) return '#F59E0B';
    if (n <= 8) return '#F97316';
    return '#EF4444';
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 6,
        width: '100%',
        height: '100%',
      }}
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <button
          key={n}
          onClick={() => onSelect('My pain is ' + n + ' out of 10')}
          style={{
            borderRadius: 14,
            border: 'none',
            cursor: 'pointer',
            fontSize: 32,
            fontWeight: 700,
            color: '#fff',
            background: getColor(n),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
