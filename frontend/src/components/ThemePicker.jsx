import { useTheme } from '../context/ThemeContext';

export default function ThemePicker() {
  const { theme, themes, setTheme } = useTheme();

  return (
    <div className="rounded-2xl border border-border bg-bg/70 p-3">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-text">Choose your colour</p>
          <p className="text-[11px] text-text-secondary">Personal theme for CollegeBook</p>
        </div>
        <span className="rounded-full bg-brand-soft px-2 py-1 text-[10px] font-bold text-brand">
          {theme.name}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="CollegeBook colour theme">
        {themes.map((item) => {
          const selected = item.id === theme.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${item.name}: ${item.description}`}
              title={item.name}
              onClick={() => setTheme(item.id)}
              className={`group relative flex h-9 w-full items-center justify-center rounded-xl border transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${selected ? 'border-brand bg-surface shadow-sm' : 'border-border bg-surface'}`}
            >
              <span
                className="h-5 w-5 rounded-full border-2 border-white shadow-sm ring-1 ring-black/10"
                style={{ backgroundColor: item.swatch }}
              />
              {selected && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white shadow-sm">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
