import { useLocation } from 'wouter';

export function usePageName(): string {
  const [location] = useLocation();
  
  // Map paths to readable page names
  if (location === '/') return 'landing';
  if (location.startsWith('/app')) return 'home';
  if (location.includes('user-profiling')) return 'user-profiling';
  if (location.includes('meal-planning')) return 'meal-planning';
  if (location.includes('live-cooking')) return 'live-cooking';
  if (location.includes('grocery-list')) return 'grocery-list';
  if (location.includes('settings')) return 'settings';
  
  // Default fallback - clean the path
  return location.replace('/', '').replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase() || 'unknown';
}