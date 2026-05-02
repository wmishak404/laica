import { useCallback, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useDeleteAllCookingSessions, useDeleteCookingSession } from '@/hooks/useCookingSession';
import type { RecipeSnapshotData } from '@/hooks/useCookingSession';
import type { CookingSession } from '@shared/schema';
import { ChefHat, Clock, History, MoreVertical, Trash2, Utensils } from 'lucide-react';

interface CookingHistoryProps {
  onBackToPlanning: () => void;
}

const HISTORY_HEADLINES = [
  'Recipes worth passing down.',
  'Dear Cooking Diary...',
  'Worth making again.',
  "Your kitchen's greatest hits.",
  'Meals with a story.',
];

function getNextHistoryHeadline() {
  if (typeof window === 'undefined') return HISTORY_HEADLINES[0];

  try {
    const key = 'laica-history-headline-index';
    const storedIndex = Number(window.sessionStorage.getItem(key) ?? '-1');
    const nextIndex = (Number.isFinite(storedIndex) ? storedIndex + 1 : 0) % HISTORY_HEADLINES.length;
    window.sessionStorage.setItem(key, String(nextIndex));
    return HISTORY_HEADLINES[nextIndex];
  } catch {
    return HISTORY_HEADLINES[Math.floor(Math.random() * HISTORY_HEADLINES.length)];
  }
}

export default function CookingHistory({ onBackToPlanning }: CookingHistoryProps) {
  const { toast } = useToast();
  const { data: sessions, isLoading } = useQuery<CookingSession[]>({
    queryKey: ['/api/cooking/sessions'],
  });
  const deleteSessionMutation = useDeleteCookingSession();
  const deleteAllMutation = useDeleteAllCookingSessions();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [historyHeadline] = useState(getNextHistoryHeadline);
  const deleteTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const deleteAllTimerRef = useRef<NodeJS.Timeout | null>(null);

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
      ' at ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const handleDelete = useCallback((sessionId: number, e: MouseEvent) => {
    e.stopPropagation();
    if (expandedId === sessionId) setExpandedId(null);

    const existingTimer = deleteTimersRef.current.get(sessionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      deleteTimersRef.current.delete(sessionId);
    }

    setHiddenIds(prev => new Set(prev).add(sessionId));

    const timer = setTimeout(() => {
      deleteTimersRef.current.delete(sessionId);
      deleteSessionMutation.mutate(sessionId, {
        onError: () => {
          setHiddenIds(prev => {
            const next = new Set(prev);
            next.delete(sessionId);
            return next;
          });
          toast({ title: "Failed to delete", variant: "destructive" });
        },
      });
    }, 5000);
    deleteTimersRef.current.set(sessionId, timer);

    toast({
      title: "Recipe removed",
      duration: 5000,
      action: (
        <ToastAction
          altText="Undo delete"
          onClick={() => {
            const t = deleteTimersRef.current.get(sessionId);
            if (t) {
              clearTimeout(t);
              deleteTimersRef.current.delete(sessionId);
            }
            setHiddenIds(prev => {
              const next = new Set(prev);
              next.delete(sessionId);
              return next;
            });
          }}
        >
          Undo
        </ToastAction>
      ),
    });
  }, [expandedId, deleteSessionMutation, toast]);

  const handleDeleteAll = () => {
    setShowDeleteAllDialog(false);

    if (deleteAllTimerRef.current) {
      clearTimeout(deleteAllTimerRef.current);
      deleteAllTimerRef.current = null;
    }

    const allIds = sessions?.map(s => s.id) || [];
    setHiddenIds(prev => {
      const next = new Set(prev);
      allIds.forEach(id => next.add(id));
      return next;
    });
    setExpandedId(null);

    const timer = setTimeout(() => {
      deleteAllTimerRef.current = null;
      deleteAllMutation.mutate(undefined, {
        onError: () => {
          setHiddenIds(prev => {
            const next = new Set(prev);
            allIds.forEach(id => next.delete(id));
            return next;
          });
          toast({ title: "Failed to delete history", variant: "destructive" });
        },
      });
    }, 5000);
    deleteAllTimerRef.current = timer;

    toast({
      title: "All history removed",
      duration: 5000,
      action: (
        <ToastAction
          altText="Undo delete all"
          onClick={() => {
            if (deleteAllTimerRef.current) {
              clearTimeout(deleteAllTimerRef.current);
              deleteAllTimerRef.current = null;
            }
            setHiddenIds(prev => {
              const next = new Set(prev);
              allIds.forEach(id => next.delete(id));
              return next;
            });
          }}
        >
          Undo
        </ToastAction>
      ),
    });
  };

  const visibleSessions = sessions?.filter(s => !hiddenIds.has(s.id)) || [];

  return (
    <main className="history-ui min-h-screen pb-24">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            className="returning-back-button"
            onClick={onBackToPlanning}
          >
            Back
          </Button>
          <span className="returning-mini-chip">History</span>
        </div>

        <section className="history-hero">
          <div>
            <p className="returning-kicker">Cooked meals</p>
            <h1 className="returning-display text-[2.45rem] font-extrabold leading-none">{historyHeadline}</h1>
            <p className="returning-copy mt-3 text-sm leading-relaxed">
              Meals you finished live here, separate from kitchen settings.
            </p>
          </div>
          {visibleSessions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="returning-menu-icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => setShowDeleteAllDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete all history
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </section>

        {isLoading ? (
          <div className="mt-5 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="history-card">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : visibleSessions.length === 0 ? (
          <section className="history-empty">
            <History className="h-12 w-12 text-primary/70" />
            <p className="font-extrabold text-[hsl(var(--returning-ink))]">No cooking history yet.</p>
            <p className="returning-copy text-sm">Finished recipes will appear here after you cook.</p>
          </section>
        ) : (
          <div className="mt-5 space-y-3">
            {visibleSessions.map((session) => {
              const snapshot = session.recipeSnapshot as RecipeSnapshotData | null;
              const isExpanded = expandedId === session.id;
              const missingIngredients = snapshot?.missingIngredients ?? [];
              const recipeIngredients = snapshot?.ingredients ?? [];
              const recipeSteps = snapshot?.steps ?? [];

              return (
                <article
                  key={session.id}
                  className="history-card"
                  data-expanded={isExpanded}
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="history-recipe-icon">
                      <ChefHat className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-extrabold leading-tight text-[hsl(var(--returning-ink))]">{session.recipeName}</h2>
                      <p className="returning-copy mt-1 text-xs">{formatDate(session.startedAt)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(session.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {(snapshot?.description || session.recipeDescription) && (
                    <p className="returning-copy mt-3 text-sm">{snapshot?.description || session.recipeDescription}</p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-extrabold text-[hsl(var(--returning-ink)/0.68)]">
                    {snapshot?.cookTime && (
                      <span className="history-meta-pill">
                        <Clock className="h-3.5 w-3.5" />
                        {snapshot.cookTime} min
                      </span>
                    )}
                    {snapshot?.difficulty && <span className="history-meta-pill">{snapshot.difficulty}</span>}
                    {snapshot?.cuisine && snapshot.cuisine !== 'International' && (
                      <span className="history-meta-pill">{snapshot.cuisine}</span>
                    )}
                    {snapshot?.isFusion && <Badge className="bg-accent text-accent-foreground text-xs">Fusion</Badge>}
                  </div>

                  {missingIngredients.length > 0 && (
                    <div className="mt-3">
                      <p className="returning-copy text-xs">Extra ingredients used:</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {missingIngredients.map((ingredient: string) => (
                          <Badge key={ingredient} variant="outline" className="rounded-full text-xs">
                            {ingredient}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-primary/10 pt-4">
                      {recipeIngredients.length > 0 && (
                        <div>
                          <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[hsl(var(--returning-ink))]">
                            <Utensils className="h-4 w-4 text-primary" />
                            Ingredients
                          </h3>
                          <div className="space-y-1.5">
                            {recipeIngredients.map((ingredient: RecipeSnapshotData['ingredients'][number], idx: number) => (
                              <div key={idx} className="flex gap-2 text-sm">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                <span>{ingredient.quantity ? `${ingredient.quantity} ` : ''}{ingredient.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {recipeSteps.length > 0 && (
                        <div>
                          <h3 className="mb-2 text-sm font-extrabold text-[hsl(var(--returning-ink))]">Steps</h3>
                          <ol className="space-y-3">
                            {recipeSteps.map((step: RecipeSnapshotData['steps'][number], idx: number) => (
                              <li key={idx} className="flex gap-3 text-sm">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">
                                  {idx + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p>{step.instruction}</p>
                                  {step.tips && <p className="returning-copy mt-1 text-xs">Tip: {step.tips}</p>}
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {recipeSteps.length === 0 && recipeIngredients.length === 0 && (
                        <p className="returning-copy py-2 text-center text-sm">No detailed recipe data available for this session.</p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete all cooking history?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove all {visibleSessions.length} cooking session{visibleSessions.length !== 1 ? 's' : ''} from your history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">
                Delete all
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
}
