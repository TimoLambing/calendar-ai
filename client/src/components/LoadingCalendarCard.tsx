import { Skeleton } from "@/components/ui/skeleton";
import { Loader } from "lucide-react";

export function LoadingCalendarCard() {
    return (
        <Skeleton className={"relative w-full h-[200px] border-2 border-neutral-50"}>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Loader className=" animate-spin h-6 w-6" />
            </div>
        </Skeleton>
    );
}