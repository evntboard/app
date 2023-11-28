interface DashboardHeaderProps {
  heading: string
  text?: string
  children?: React.ReactNode
}

export function DashboardHeader({
  heading,
  text,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="grid gap-1">
        <h1 className="font-heading text-xl md:text-xl">{heading}</h1>
        {text && <p className="text-md text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  )
}
