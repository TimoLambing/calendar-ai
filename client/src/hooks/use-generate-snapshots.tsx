import { useCallback, useEffect, useState, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from './use-toast';
import { useAppState } from '@/store/appState';
import { usePrivy } from '@privy-io/react-auth';

interface GenerateSnapshotsParams {
    startDate: Date | string;
    endDate: Date | string;
}

/**
 * Custom hook to manage snapshot generation and navigating between months.
 */
export default function useGenerateSnapshots() {
    const { state: { address, chain } } = useAppState();
    const { ready, authenticated, user } = usePrivy();
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const startDateRef = useRef<Date>(
        new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    );
    const endDateRef = useRef<Date>(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    );

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
        async ({ startDate: startDateParam, endDate: endDateParam }: GenerateSnapshotsParams) => {
            if (isGenerating) return;

            if (!ready || !authenticated || !user) {
                toast({
                    title: "Not authenticated",
                    description: "Failed to authenticate user.",
                    variant: "destructive",
                });
                return;
            }

            const start = new Date(startDateParam);
            const end = new Date(endDateParam);

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
            startDateRef.current = start;
            endDateRef.current = end;

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
        [user, ready, authenticated, address, chain] // Removed isGenerating from dependencies
    );

    // Run generate only on initial mount or when currentDate changes intentionally
    useEffect(() => {
        const newStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const newEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        startDateRef.current = newStartDate;
        endDateRef.current = newEndDate;

        // Only generate if not already generating
        if (!isGenerating) {
            generate({ startDate: newStartDate, endDate: newEndDate });
        }
    }, [currentDate]); // Removed generate from dependencies

    return {
        currentDate,
        startDate: startDateRef.current,
        endDate: endDateRef.current,
        goToPreviousMonth,
        goToNextMonth,
        generate,
        isGenerating
    };
}