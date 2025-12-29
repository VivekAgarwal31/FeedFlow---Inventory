import React, { useState, useEffect } from 'react';
import { FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { formatCurrency, formatDate } from '../lib/utils';
import { useToast } from '../hooks/use-toast';

const EntriesRegister = () => {
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        creditSales: [],
        paymentsReceived: [],
        totals: {
            totalCreditSales: 0,
            totalPaymentsReceived: 0
        }
    });

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/accounting/entries-register?date=${selectedDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!response.ok) throw new Error('Failed to fetch data');

            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching entries register:', error);
            toast({
                title: 'Error',
                description: 'Failed to load entries register',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const getPaymentStatusBadge = (status) => {
        const variants = {
            pending: 'destructive',
            partial: 'secondary',
            paid: 'default'
        };
        return variants[status] || 'default';
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Entries Register</h1>
                    <p className="text-muted-foreground">Credit sales vs payments received</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payments Received */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payments Received</CardTitle>
                        <CardDescription>
                            Payments collected on {formatDate(selectedDate)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : data.paymentsReceived.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No payments received on this date
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Invoice Ref</TableHead>
                                            <TableHead>Mode</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.paymentsReceived.map((payment, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">
                                                    {payment.customerName}
                                                </TableCell>
                                                <TableCell>{payment.invoiceReference}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{payment.paymentMode}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatCurrency(payment.amountReceived)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                    <span className="font-semibold">Total Received</span>
                                    <span className="text-lg font-bold font-mono text-green-600">
                                        {formatCurrency(data.totals.totalPaymentsReceived)}
                                    </span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Credit Sales */}
                <Card>
                    <CardHeader>
                        <CardTitle>Credit Sales</CardTitle>
                        <CardDescription>
                            Unpaid/partially paid invoices from {formatDate(selectedDate)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : data.creditSales.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No credit sales on this date
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="text-right">Pending</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.creditSales.map((sale) => (
                                            <TableRow key={sale._id}>
                                                <TableCell className="font-medium">
                                                    #{sale.orderNumber}
                                                </TableCell>
                                                <TableCell>{sale.clientName}</TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatCurrency(sale.totalAmount)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-orange-600">
                                                    {formatCurrency(sale.amountDue)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getPaymentStatusBadge(sale.paymentStatus)}>
                                                        {sale.paymentStatus}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                    <span className="font-semibold">Total Credit Sales</span>
                                    <span className="text-lg font-bold font-mono text-orange-600">
                                        {formatCurrency(data.totals.totalCreditSales)}
                                    </span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default EntriesRegister;
