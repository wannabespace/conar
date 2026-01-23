export function EmptyDefinition() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="space-y-4 text-center">
        <div className="text-lg font-medium">
          No definitions selected
        </div>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Select a definition type from the sidebar to view details.
        </p>
      </div>
    </div>
  )
}
