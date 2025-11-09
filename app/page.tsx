export default function RootPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <h1 className="relative text-6xl font-bold tracking-tighter bg-gradient-to-br from-primary via-accent to-primary bg-clip-text text-transparent">
            ARCYN UNIX
          </h1>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
