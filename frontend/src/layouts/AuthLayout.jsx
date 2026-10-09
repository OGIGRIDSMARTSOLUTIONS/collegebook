import { DotWaveField } from '../components/DotWaveField';

const features = [
  {
    title: 'Connect with classmates',
    text: 'Keep in touch within your school and across institutions.',
    tone: 'teal',
    icon: 'people',
  },
  {
    title: 'Preserve every graduating class',
    text: 'A modern YearBook for today and tomorrow.',
    tone: 'gold',
    icon: 'cap',
  },
  {
    title: 'Build your community',
    text: 'Share, collaborate and grow your network.',
    tone: 'blue',
    icon: 'globe',
  },
];

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[56%_44%]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#eefafd] lg:block">
        <HeroContent desktop />
      </section>

      <section className="order-2 flex min-h-screen flex-col bg-white px-5 py-7 sm:px-8 lg:order-none lg:px-12 xl:px-20">
        <div className="ml-auto flex w-full max-w-xl flex-1 flex-col justify-center">
          <div className="mb-7 flex items-center lg:hidden">
            <Brand />
          </div>

          <div className="mx-auto w-full max-w-[520px]">
            <h1 className="text-[30px] font-bold tracking-[-0.025em] text-text sm:text-[34px]">{title}</h1>
            {subtitle && <p className="mt-2 text-[15px] leading-6 text-text-secondary sm:text-base">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>

        <div className="mt-8 text-center text-[11px] text-text-secondary">
          © {new Date().getFullYear()} CollegeBook · An OgiGrid platform
        </div>
      </section>

      <section className="order-1 relative overflow-hidden bg-[#eefafd] px-5 py-8 lg:hidden">
        <HeroContent />
      </section>
    </div>
  );
}

function HeroContent({ desktop = false }) {
  return (
    <div className={desktop ? 'absolute inset-0' : 'relative'}>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_76%_28%,rgba(28,174,196,0.16),transparent_34%),radial-gradient(circle_at_12%_86%,rgba(255,205,85,0.16),transparent_28%)]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] opacity-70"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(24,151,174,0.34) 1.15px, transparent 1.15px)',
          backgroundSize: '18px 18px',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.78), rgba(0,0,0,0.95) 72%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.78), rgba(0,0,0,0.95) 72%, transparent 100%)',
        }}
      />
      <DotWaveField
        className="z-[2]"
        color="rgba(24,151,174,0.78)"
        density="high"
        opacity={0.9}
        dotSize={1.2}
        waveStrength={1.35}
        coverage="full"
      />
      <div className={desktop ? 'relative z-10 h-full px-10 py-9 xl:px-14 xl:py-11' : 'relative z-10'}>
        <div className="flex items-center justify-between">
          <Brand dark />
        </div>

        <div className={desktop ? 'mt-10 grid grid-cols-[minmax(270px,0.86fr)_minmax(320px,1.14fr)] gap-5 xl:mt-12 xl:gap-7' : 'mt-7'}>
          <div className={desktop ? 'relative z-10 pt-3' : ''}>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Your institution. Your people. Your story.</p>
            <h2 className="mt-3 max-w-xl text-[42px] font-extrabold leading-[0.96] tracking-[-0.045em] text-[#10242c] xl:text-[58px]">
              Connect.<br />
              Remember.<br />
              <span className="text-brand">Belong.</span>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-6 text-slate-600 xl:text-[17px] xl:leading-7">
              A social home for students and a permanent digital YearBook for every graduating class.
            </p>

            <div className="mt-7 space-y-4">
              {features.map((feature) => (
                <Feature key={feature.title} {...feature} />
              ))}
            </div>

            <div className="mt-8 max-w-md">
              <p className="font-serif text-[21px] italic leading-7 text-brand xl:text-[24px]">
                Every student has a story.<br />
                Every graduating class has a legacy.
              </p>
              <div className="mt-2 h-1 w-36 -rotate-2 rounded-full bg-[#f4c84e]" />
            </div>
          </div>

          <PhotoCollage compact={!desktop} />
        </div>
      </div>
    </div>
  );
}

function Brand({ dark = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M5 6.5 12 3l7 3.5v10L12 21l-7-4.5v-10Z" strokeLinejoin="round" />
          <path d="M5 6.5 12 10l7-3.5M12 10v11" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <div className={`text-[21px] font-bold tracking-[-0.04em] ${dark ? 'text-[#10242c]' : 'text-brand'}`}>
          College<span className="text-brand">Book</span>
        </div>
        <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.25em] text-slate-500">
          <img src="/assets/collegebook/ogigrid-logo.png" alt="OgiGrid" className="h-3.5 w-3.5 object-contain" />
          <span>by OgiGrid</span>
        </div>
      </div>
    </div>
  );
}

function Feature({ title, text, tone, icon }) {
  const tones = {
    teal: 'bg-[#d9f5f7] text-brand',
    gold: 'bg-[#fff0bf] text-[#8b6516]',
    blue: 'bg-[#dcecff] text-[#1769b0]',
  };
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
        <FeatureIcon type={icon} />
      </span>
      <div>
        <p className="text-[13px] font-bold text-[#172c34] xl:text-sm">{title}</p>
        <p className="mt-0.5 max-w-[280px] text-[11px] leading-4 text-slate-500 xl:text-xs xl:leading-5">{text}</p>
      </div>
    </div>
  );
}

function FeatureIcon({ type }) {
  if (type === 'cap') {
    return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
<path d="m3 9 9-5 9 5-9 5-9-5Z" strokeLinejoin="round"/>
<path d="M7 11.5V16c2.8 2 7.2 2 10 0v-4.5M21 10v5" strokeLinecap="round"/>
</svg>;
  }
  if (type === 'globe') {
    return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
<circle cx="12" cy="12" r="8.5"/>
<path d="M3.8 12h16.4M12 3.5c2.1 2.3 3.2 5.1 3.2 8.5S14.1 18.2 12 20.5c-2.1-2.3-3.2-5.1-3.2-8.5S9.9 5.8 12 3.5Z" strokeLinecap="round"/>
</svg>;
  }
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
<circle cx="8" cy="8" r="3"/>
<circle cx="17" cy="9" r="2.5"/>
<path d="M2.8 19c.6-3 2.4-4.7 5.2-4.7S12.6 16 13.2 19M14.2 14.8c2.5-.4 4.7 1 5.5 3.8" strokeLinecap="round"/>
</svg>;
}

function PhotoCollage({ compact }) {
  return (
    <div className={`relative ${compact ? 'mt-8 h-[235px]' : 'min-h-[590px]'}`}>
      <div className="absolute left-[12%] top-[7%] h-28 w-28 rounded-[2rem] bg-brand/10 blur-2xl" />
      <div className="absolute right-[3%] top-[11%] h-24 w-24 rounded-full bg-[#f4c84e]/30 blur-xl" />

      <div className={`absolute z-20 overflow-hidden rounded-[22px] border-[6px] border-white shadow-[0_22px_55px_rgba(18,54,64,0.16)] ${compact ? 'left-[8%] top-0 h-40 w-32 rotate-[-3deg]' : 'left-[4%] top-[5%] h-[370px] w-[275px] rotate-[-3deg] xl:h-[405px] xl:w-[300px]'}`}>
        <img src="/assets/collegebook/graduate.png" alt="Graduating student" className="h-full w-full object-cover" />
      </div>

      <div className={`absolute z-30 overflow-hidden rounded-[18px] border-[5px] border-white shadow-[0_18px_40px_rgba(18,54,64,0.14)] ${compact ? 'right-[2%] top-0 h-28 w-40 rotate-[2deg]' : 'right-[1%] top-[1%] h-[205px] w-[330px] rotate-[2deg] xl:h-[225px] xl:w-[355px]'}`}>
        <img src="/assets/collegebook/friends.png" alt="Students together" className="h-full w-full object-cover" />
      </div>

      <div className={`absolute z-10 overflow-hidden rounded-[18px] border-[5px] border-white shadow-[0_18px_40px_rgba(18,54,64,0.14)] ${compact ? 'right-[4%] bottom-0 h-28 w-40 rotate-[-2deg]' : 'right-[2%] top-[40%] h-[180px] w-[290px] rotate-[-2deg] xl:h-[205px] xl:w-[325px]'}`}>
        <img src="/assets/collegebook/campus.png" alt="Institution campus" className="h-full w-full object-cover" />
      </div>

      {!compact && (
        <div className="absolute bottom-[3%] left-[20%] z-40 h-[150px] w-[275px] rotate-[2deg] overflow-hidden rounded-[18px] border-[5px] border-white shadow-[0_18px_40px_rgba(18,54,64,0.14)] xl:h-[165px] xl:w-[300px]">
          <img src="/assets/collegebook/students.png" alt="Students walking together" className="h-full w-full object-cover" />
        </div>
      )}

      <span className="absolute right-[-1%] top-[34%] z-50 rounded-full border border-white bg-white/95 px-3 py-2 text-[11px] font-bold text-[#263b42] shadow-lg backdrop-blur">
        👥 Friends for life
      </span>
      <span className="absolute bottom-[24%] right-[0%] z-50 rounded-full bg-brand px-3 py-2 text-[11px] font-bold text-white shadow-lg">
        ♥ Your community
      </span>
    </div>
  );
}
