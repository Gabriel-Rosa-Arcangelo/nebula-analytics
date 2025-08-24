export default function Topbar() {
    return (
      <header className="h-14 border-b border-[--color-border] bg-[--color-card] flex items-center justify-between px-5">
        <div className="text-sm opacity-80">/ Dashboard</div>
        <div className="flex items-center gap-3">
          <input
            placeholder="Search…"
            className="bg-[--color-bg] border border-[--color-border] rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[--color-purple]"
          />
          <div className="w-8 h-8 rounded-full bg-[--color-purple]" />
        </div>
      </header>
    );
  }
  