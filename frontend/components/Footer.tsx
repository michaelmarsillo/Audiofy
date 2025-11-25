export default function Footer() {
  return (
    <footer className="text-center text-[var(--text-muted)] pt-6 border-t border-[var(--bg-accent)]">
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
    </footer>
  );
}

