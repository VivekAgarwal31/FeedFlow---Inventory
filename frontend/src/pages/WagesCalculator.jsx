import React, { useState, useEffect } from 'react';
import { Calculator, Calendar, Save, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { formatCurrency, formatDate } from '../lib/utils';
import { useToast } from '../hooks/use-toast';

const WagesCalculator = () => {
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [recording, setRecording] = useState(false);
    const [manualOverride, setManualOverride] = useState(false);
    const [manualTotalBags, setManualTotalBags] = useState(0);
    const [wagesData, setWagesData] = useState({
        bagsReceived: 0,
        bagsMoved: 0,
        bagsDelivered: 0,
        totalBags: 0,
        wagesPerBag: 0,
        totalWages: 0
    });

    useEffect(() => {
        fetchWagesCalculation();
    }, [selectedDate]);

    const fetchWagesCalculation = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/accounting/wages/calculate?date=${selectedDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!response.ok) throw new Error('Failed to fetch wages calculation');

            const result = await response.json();
            setWagesData(result);
        } catch (error) {
            console.error('Error fetching wages:', error);
            toast({
                title: 'Error',
                description: 'Failed to calculate wages',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRecordWages = async () => {
        const effectiveTotalBags = manualOverride ? manualTotalBags : wagesData.totalBags;
        const effectiveTotalWages = effectiveTotalBags * wagesData.wagesPerBag;

        if (effectiveTotalWages <= 0) {
            toast({
                title: 'Error',
                description: 'Total wages must be greater than 0',
                variant: 'destructive'
            });
            return;
        }

        setRecording(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/accounting/wages/record`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        date: selectedDate,
                        totalWages: effectiveTotalWages,
                        description: `Daily wages for ${formatDate(selectedDate)}${manualOverride ? ' (manual override)' : ''}`
                    })
                }
            );

            if (!response.ok) throw new Error('Failed to record wages');

            toast({
                title: 'Success',
                description: 'Wages recorded successfully'
            });
        } catch (error) {
            console.error('Error recording wages:', error);
            toast({
                title: 'Error',
                description: 'Failed to record wages',
                variant: 'destructive'
            });
        } finally {
            setRecording(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Wages Calculator</h1>
                    <p className="text-muted-foreground">Calculate and record daily worker wages</p>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-auto"
                    />
                </div>
            </div>

            {/* Calculation Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Bags Received
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{wagesData.bagsReceived}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            From purchase deliveries
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Bags Moved
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{wagesData.bagsMoved}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            From stock movements
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Bags Delivered
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{wagesData.bagsDelivered}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            From sales deliveries
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Calculation Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Wages Calculation</CardTitle>
                    <CardDescription>
                        Based on total bags handled and wages per bag rate
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                <span className="text-sm font-medium">Total Bags</span>
                                {manualOverride ? (
                                    <Input
                                        type="number"
                                        min="0"
                                        value={manualTotalBags}
                                        onChange={(e) => setManualTotalBags(parseInt(e.target.value) || 0)}
                                        className="w-24 h-8 text-right font-bold"
                                    />
                                ) : (
                                    <span className="text-lg font-bold">{wagesData.totalBags}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="manualOverride"
                                    checked={manualOverride}
                                    onChange={(e) => {
                                        setManualOverride(e.target.checked);
                                        if (e.target.checked) {
                                            setManualTotalBags(wagesData.totalBags);
                                        }
                                    }}
                                    className="rounded"
                                />
                                <label htmlFor="manualOverride" className="text-sm text-muted-foreground cursor-pointer">
                                    Manual override (for additional wages)
                                </label>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                <span className="text-sm font-medium">Wages per Bag</span>
                                <span className="text-lg font-bold font-mono">
                                    {formatCurrency(wagesData.wagesPerBag)}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-center">
                            <div className="text-center p-6 bg-primary/5 rounded-lg border-2 border-primary/20 w-full">
                                <p className="text-sm text-muted-foreground mb-2">Total Wages</p>
                                <p className="text-4xl font-bold text-primary font-mono">
                                    {formatCurrency((manualOverride ? manualTotalBags : wagesData.totalBags) * wagesData.wagesPerBag)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {manualOverride ? manualTotalBags : wagesData.totalBags} bags × {formatCurrency(wagesData.wagesPerBag)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <Button
                            onClick={handleRecordWages}
                            disabled={recording || (manualOverride ? manualTotalBags : wagesData.totalBags) * wagesData.wagesPerBag <= 0}
                            className="w-full md:w-auto"
                        >
                            {recording ? (
                                <>
                                    <Save className="mr-2 h-4 w-4 animate-pulse" />
                                    Recording...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Record Wages
                                </>
                            )}
                        </Button>
                        {(manualOverride ? manualTotalBags : wagesData.totalBags) * wagesData.wagesPerBag <= 0 && (
                            <p className="text-sm text-muted-foreground mt-2">
                                No wages to record for this date
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-900 mb-1">How it works</h4>
                            <p className="text-sm text-blue-800">
                                Wages are calculated based on the total number of bags handled by workers:
                                bags received from suppliers, bags moved between warehouses, and bags delivered
                                to customers. Set your wages per bag rate in Company Settings.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default WagesCalculator;
