interface NeoBrutalistBoxProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function NeoBrutalistBox({ children, onClick, className = "" }: NeoBrutalistBoxProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  )
} 