interface Props {
  message: string | null
}

export function Toast({ message }: Props) {
  if (!message) return null
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 text-[11px] py-1 px-3 rounded bg-chart-1/20 text-chart-1 animate-fade-in border border-chart-1/30">
      {message}
    </div>
  )
}
