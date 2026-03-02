function colorFromText(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function initialsFromText(text) {
  if (!text) {
    return 'MP';
  }
  const words = text
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  if (words.length === 0) {
    return 'MP';
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function SongCover({ imageUrl, label, compact = false }) {
  const size = compact ? 'h-9 w-9' : 'h-16 w-16';

  if (imageUrl) {
    return (
      <div className={`${size} shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-900`}>
        <img src={imageUrl} alt={label || 'Song cover'} className="h-full w-full object-cover" />
      </div>
    );
  }

  const hue = colorFromText(label || 'market');
  const initials = initialsFromText(label || 'market');
  const bg = `linear-gradient(145deg, hsl(${hue} 60% 18%), hsl(${(hue + 40) % 360} 70% 28%) 55%, hsl(${(hue + 85) % 360} 75% 45%))`;

  return (
    <div className={`${size} shrink-0 rounded-lg border border-slate-700 grid place-items-center`} style={{ background: bg }}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-100">{initials}</span>
    </div>
  );
}
