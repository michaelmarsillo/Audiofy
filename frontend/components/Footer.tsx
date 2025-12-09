export default function Footer() {
  // Systems status - hardcoded for now
  const systemsStatus = {
    desktop: 'green',
    mobile: 'green',
    websockets: 'red'
  };

  return (
    <footer className="text-center text-[var(--text-muted)] pt-6 border-t border-[var(--bg-accent)]">
      <div className="flex items-center justify-center gap-8 flex-wrap">
        <p className="text-sm">
          made with <span className="heartbeat text-[var(--accent-danger)]">♥</span> by{' '}
          <a 
            href="https://github.com/michaelmarsillo" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors"
          >
            michael marsillo
          </a>
        </p>

        {/* Systems Status */}
        <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--bg-secondary)] rounded-lg border border-[var(--bg-accent)] shadow-sm max-w-full">
          <span className="text-xs text-[var(--text-secondary)] font-medium whitespace-nowrap">systems status:</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                systemsStatus.desktop === 'green' 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-red-500'
              }`}></div>
              <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">desktop</span>
            </div>
            <div className="w-px h-4 bg-[var(--bg-accent)]"></div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                systemsStatus.mobile === 'green' 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-red-500'
              }`}></div>
              <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">mobile</span>
            </div>
            <div className="w-px h-4 bg-[var(--bg-accent)]"></div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                systemsStatus.websockets === 'green' 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-red-500'
              }`}></div>
              <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">web sockets</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

