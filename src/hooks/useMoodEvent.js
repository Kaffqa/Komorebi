// Custom hook for broadcasting mood/journal update events between widgets
export function dispatchMoodUpdate() {
  window.dispatchEvent(new CustomEvent('mood-updated'));
}

export function dispatchJournalUpdate() {
  window.dispatchEvent(new CustomEvent('journal-updated'));
}

export function useMoodUpdateListener(callback) {
  const { useEffect } = require('react');
  useEffect(() => {
    window.addEventListener('mood-updated', callback);
    return () => window.removeEventListener('mood-updated', callback);
  }, [callback]);
}

export function useJournalUpdateListener(callback) {
  const { useEffect } = require('react');
  useEffect(() => {
    window.addEventListener('journal-updated', callback);
    return () => window.removeEventListener('journal-updated', callback);
  }, [callback]);
}
