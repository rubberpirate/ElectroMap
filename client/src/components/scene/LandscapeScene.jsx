function Star({ x, y, size = 1, color = '#e6f2ef', delay = 0 }) {
  const half = 6 * size
  const point = 1.6 * size

  return (
    <path
      className="scene-star"
      style={{ animationDelay: `${delay}s` }}
      d={`M${x} ${y - half}L${x + point} ${y - point}L${x + half} ${y}L${x + point} ${y + point}L${x} ${y + half}L${x - point} ${y + point}L${x - half} ${y}L${x - point} ${y - point}Z`}
      fill={color}
    />
  )
}

function Pine({ x, y, scale = 1, opacity = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <rect x="-3" y="27" width="6" height="21" rx="2" fill="#091722" />
      <polygon points="0,0 -18,32 18,32" fill="#0b2635" />
      <polygon points="0,-14 -15,18 15,18" fill="#0f3040" />
      <polygon points="0,-28 -11,3 11,3" fill="#14384a" />
    </g>
  )
}

function House({ x, y, roof = '#fd7a01', accent = '#00e8cc', scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="0" y="30" width="72" height="46" rx="5" fill="#b9c3c7" opacity="0.9" />
      <polygon points="-8,34 36,0 80,34" fill={roof} />
      <rect x="9" y="44" width="17" height="18" rx="2" fill="#fdbe5a" filter="url(#windowGlow)" />
      <rect x="45" y="44" width="17" height="18" rx="2" fill={accent} opacity="0.8" />
      <rect x="30" y="52" width="13" height="24" rx="2" fill="#193044" />
    </g>
  )
}

function Cloud({ x, y, scale = 1, opacity = 0.75, delay = 0 }) {
  return (
    <g
      className="scene-cloud"
      style={{ animationDelay: `${delay}s` }}
      transform={`translate(${x} ${y}) scale(${scale})`}
      opacity={opacity}
      fill="#162840"
    >
      <path d="M18 38h112c14 0 25-11 25-25S144-12 130-12h-4C119-31 101-44 80-44c-24 0-44 16-50 38-4-2-9-3-14-3-18 0-32 14-32 32s16 15 34 15z" />
    </g>
  )
}

function LandscapeScene({ compact = false, className = '', style }) {
  return (
    <div
      className={`landscape-scene ${compact ? 'landscape-scene-compact' : ''} ${className}`}
      style={style}
      aria-hidden="true"
    >
      <svg viewBox="0 0 1440 520" role="presentation" preserveAspectRatio="none">
        <defs>
          <filter id="windowGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#fd7a01" floodOpacity="0.68" />
          </filter>
          <linearGradient id="sceneSky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0b1220" />
            <stop offset="100%" stopColor="#0d2233" />
          </linearGradient>
        </defs>

        <rect width="1440" height="520" fill="url(#sceneSky)" opacity="0.12" />
        <Cloud x="130" y="124" scale="0.75" delay="0.2" />
        <Cloud x="1010" y="98" scale="0.92" opacity="0.58" delay="1.5" />
        <Cloud x="760" y="156" scale="0.52" opacity="0.55" delay="2.6" />

        <Star x={170} y={90} size={1.1} />
        <Star x={345} y={168} size={0.8} color="#fdbe5a" delay={0.7} />
        <Star x={675} y={76} size={1.3} delay={1.1} />
        <Star x={938} y={178} size={0.9} color="#fdbe5a" delay={1.8} />
        <Star x={1190} y={116} size={1.1} delay={2.3} />

        <ellipse cx="270" cy="496" rx="430" ry="155" fill="#0d2233" />
        <ellipse cx="1055" cy="500" rx="520" ry="170" fill="#0f2a3f" />
        <ellipse cx="705" cy="532" rx="670" ry="160" fill="#0a1c2c" />

        <Pine x={90} y={320} scale={1.06} opacity={0.72} />
        <Pine x={155} y={338} scale={0.86} opacity={0.78} />
        <Pine x={1160} y={315} scale={1.18} opacity={0.72} />
        <Pine x={1260} y={342} scale={0.9} opacity={0.78} />
        <Pine x={1338} y={325} scale={1.04} opacity={0.7} />

        <House x={270} y={326} scale={1.05} roof="#fd7a01" />
        <House x={604} y={338} scale={0.9} roof="#588197" accent="#00e8cc" />
        <House x={1000} y={316} scale={1.1} roof="#0f7280" accent="#fd7a01" />

        <path d="M0 448C166 408 294 430 434 462C596 499 735 501 894 454C1060 405 1232 404 1440 446V520H0Z" fill="#091826" />
        <path d="M0 486C201 442 430 461 646 492C863 524 1072 518 1440 468V520H0Z" fill="#07131f" />
      </svg>
    </div>
  )
}

export default LandscapeScene
