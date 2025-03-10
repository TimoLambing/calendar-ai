import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  ScrollText,
  TrendingUp,
  TrendingDown,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TradingDiaryComment, TradingDiaryEntry } from "./CalendarCard";

interface Props {
  date?: Date; // Optional date filter
  value?: number; // Optional portfolio value for that day
  valueChange?: number; // Optional daily performance change
  entries?: TradingDiaryEntry[]; // Optional entries to display
}

export function JournalEntries({ date, value, valueChange, entries }: Props) {
  // If date is provided, we fetch only that day's entries. Otherwise, all.
  const queryKey = date
    ? ["diary-entries", "date", date.toISOString()]
    : ["diary-entries"];

  // // Load diary entries from your backend
  // const { data: entries } = useQuery<TradingDiaryEntry[]>({
  //   queryKey,
  //   queryFn: async () => {
  //     const endpoint = date
  //       ? `/api/diary-entries/date/${date.toISOString()}`
  //       : "/api/diary-entries";
  //     const response = await fetch(endpoint);
  //     if (!response.ok) throw new Error("Failed to fetch diary entries");
  //     return response.json();
  //   },
  // });

  // Track which entries are expanded (to show comments)
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(
    new Set()
  );
  // Track new comment text, keyed by entry ID
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // For each expanded entry, load comments
  const { data: commentsMap } = useQuery<Record<string, TradingDiaryComment[]>>(
    {
      queryKey: ["diary-comments", Array.from(expandedEntries)],
      queryFn: async () => {
        const commentPromises = Array.from(expandedEntries).map(
          async (entryId) => {
            const response = await fetch(
              `/api/diary-entries/${entryId}/comments`
            );
            if (!response.ok) throw new Error("Failed to fetch comments");
            const comments = await response.json();
            return [entryId, comments];
          }
        );
        const results = await Promise.all(commentPromises);
        return Object.fromEntries(results);
      },
      enabled: expandedEntries.size > 0,
    }
  );

  const toggleComments = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const handleAddComment = async (entryId: string) => {
    const comment = newComments[entryId];
    if (!comment?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("POST", `/api/diary-entries/${entryId}/comments`, {
        comment,
        authorAddress: window.ethereum?.selectedAddress || "Anonymous", // Fallback
      });

      // Refresh the comments for this entry
      queryClient.invalidateQueries({ queryKey: ["diary-comments"] });

      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully.",
      });

      setNewComments((prev) => ({ ...prev, [entryId]: "" }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  // If no entries found
  if (!entries?.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            {date
              ? `No journal entries for ${date.toLocaleDateString()}`
              : "No journal entries yet"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {entries?.map((entry) => (
        <Card key={entry.id}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ScrollText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {new Date(entry.timestamp).toLocaleDateString()}
                      {entry.authorAddress && (
                        <span className="text-sm text-muted-foreground">
                          by {entry.authorAddress.slice(0, 6)}...
                          {entry.authorAddress.slice(-4)}
                        </span>
                      )}
                    </div>

                    {/* If we want to show performance stats */}
                    {(entry.valueChange || valueChange) &&
                      (entry.portfolioValue || value) && (
                        <div
                          className={cn(
                            "text-sm font-medium flex items-center gap-1",
                            parseFloat(
                              entry.valueChange?.toString() ||
                                valueChange?.toString() ||
                                ""
                            ) > 0
                              ? "text-green-600"
                              : "text-red-600"
                          )}
                        >
                          {parseFloat(
                            entry.valueChange?.toString() ||
                              valueChange?.toString() ||
                              ""
                          ) > 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {parseFloat(
                            entry.valueChange?.toString() ||
                              valueChange?.toString() ||
                              ""
                          ) > 0
                            ? "+"
                            : ""}
                          {parseFloat(
                            entry.valueChange?.toString() ||
                              valueChange?.toString() ||
                              ""
                          ).toFixed(2)}
                          %
                          <span className="text-muted-foreground ml-2">
                            $
                            {parseFloat(
                              entry.portfolioValue?.toString() ||
                                value?.toString() ||
                                "0"
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleComments(entry.id)}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {entry.comments.length || 0} Comments
                  </Button>
                </div>

                {/* The main diary comment */}
                <div className="mt-2 text-sm whitespace-pre-wrap">
                  {entry.comment}
                </div>

                {/* Comments thread */}
                {expandedEntries.has(entry.id) && (
                  <div className="mt-4 pl-4 border-l-2 space-y-4">
                    {commentsMap?.[entry.id]?.map((c) => (
                      <div key={c.id} className="text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {c.authorAddress && (
                            <span>
                              {c.authorAddress.slice(0, 6)}...
                              {c.authorAddress.slice(-4)}
                            </span>
                          )}
                          <span>•</span>
                          <span>{new Date(c.createdAt!).toLocaleString()}</span>
                        </div>
                        <div className="mt-1">{c.comment}</div>
                      </div>
                    ))}

                    {/* Add a new comment */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComments[entry.id] || ""}
                        onChange={(e) =>
                          setNewComments((prev) => ({
                            ...prev,
                            [entry.id]: e.target.value,
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddComment(entry.id)}
                      >
                        Add Comment
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
