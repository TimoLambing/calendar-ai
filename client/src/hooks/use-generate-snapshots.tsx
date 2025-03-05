import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from './use-toast';
import { useAppState } from '@/store/appState';
import { usePrivy } from '@privy-io/react-auth';

interface GenerateSnapshotsParams {
    startDate: Date | string;
    endDate: Date | string;
}
/**
 *  Custom hook to manage snapshot generation and navigating between months.
 */
export default function useGenerateSnapshots() {
    const { state: { address, chain } } = useAppState();
    const { ready, authenticated, user } = usePrivy();
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());


    const goToPreviousMonth = useCallback(() => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    }, []);

    const goToNextMonth = useCallback(() => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    }, []);



    const generate = useCallback(
        async ({ startDate, endDate }: GenerateSnapshotsParams) => {
            // Prevent new generation if already in progress
            if (isGenerating) return;

            if (!ready || !authenticated || !user) {
                toast({
                    title: "Not authenticated",
                    description: "Failed to authenticate user.",
                    variant: "destructive",
                });
                return;
            }

            // Validate dates
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                toast({
                    title: "Invalid Date",
                    description: "Please provide valid start and end dates.",
                    variant: "destructive",
                });
                return;
            }

            if (start > end) {
                toast({
                    title: "Invalid Date Range",
                    description: "Start date must be before end date.",
                    variant: "destructive",
                });
                return;
            }

            setIsGenerating(true);

            try {

                await apiRequest("POST", `/api/wallets/${address}/snapshots`, {
                    chain,
                    startDate: start.toISOString(),
                    endDate: end.toISOString()
                });

            } catch (error: any) {
                console.error("Error generating snapshots:", error);
                toast({
                    title: "Snapshot Error",
                    description: error.message,
                    variant: "destructive",
                });
            } finally {
                setIsGenerating(false);
            }
        },
        [user, ready, authenticated, address, chain, isGenerating] // Include isGenerating in dependencies
    );

    useEffect(() => {
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        generate({ startDate, endDate });

    }, [currentDate]);

    return {
        currentDate,
        goToPreviousMonth,
        goToNextMonth,
        generate,
        isGenerating
    };
}



// Usage example:
/*
import useGenerateSnapshots from '@/hooks/useGenerateSnapshots';

function SnapshotGenerator() {
  const { generate, isGenerating } = useGenerateSnapshots();

  const handleGenerate = () => {
    generate({
      startDate: '2025-03-01',
      endDate: '2025-03-31'
    });
  };

  return (
    <button 
      onClick={handleGenerate}
      disabled={isGenerating}
    >
      {isGenerating ? 'Generating...' : 'Generate Snapshots'}
    </button>
  );
}
*/