import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

export function MarketCardSkeleton() {
    return (
        <Card className="flex flex-col">
            <div className="animate-pulse">
                <CardHeader>
                    <div className="mb-3 bg-muted h-6 w-24 rounded-lg" />
                    <div className="bg-muted h-6 w-full rounded" />
                    <div className="bg-muted h-5 w-3/4 rounded mt-2" />
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <div className="flex justify-between mb-3">
                            <div className="flex flex-col gap-1">
                                <div className="bg-muted h-4 w-20 rounded" />
                                <div className="bg-muted h-3 w-16 rounded" />
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                                <div className="bg-muted h-4 w-20 rounded" />
                                <div className="bg-muted h-3 w-16 rounded" />
                            </div>
                        </div>
                        <div className="bg-muted h-3 w-full rounded-full" />
                    </div>
                    <div className="bg-muted h-10 w-full rounded-lg" />
                </CardContent>
            </div>
        </Card>
    );
}
