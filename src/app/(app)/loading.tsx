export default function Loading() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-5 space-y-5">
      {/* Cabeçalho */}
      <div className="space-y-2.5">
        <div className="shimmer" style={{ width: 90, height: 12 }} />
        <div className="shimmer" style={{ width: 220, height: 28 }} />
        <div className="shimmer" style={{ width: 150, height: 13 }} />
      </div>

      {/* Barra de filtros */}
      <div className="flex gap-2">
        <div className="shimmer" style={{ width: 130, height: 34, borderRadius: 12 }} />
        <div className="shimmer" style={{ width: 96, height: 34, borderRadius: 12 }} />
        <div className="shimmer" style={{ width: 96, height: 34, borderRadius: 12 }} />
      </div>

      {/* Cards de conteúdo */}
      <div className="space-y-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="card p-4 flex items-center gap-3" style={{ opacity: 1 - i * 0.14 }}>
            <div className="shimmer flex-none" style={{ width: 40, height: 40, borderRadius: 12 }} />
            <div className="flex-1 space-y-2">
              <div className="shimmer" style={{ width: `${68 - i * 8}%`, height: 14 }} />
              <div className="shimmer" style={{ width: `${42 - i * 4}%`, height: 11 }} />
            </div>
            <div className="shimmer flex-none" style={{ width: 64, height: 26, borderRadius: 999 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
