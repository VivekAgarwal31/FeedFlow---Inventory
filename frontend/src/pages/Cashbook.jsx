import React, { useState, useEffect } from 'react';
import { Book, Calendar, Edit2, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { formatCurrency, formatDate } from '../lib/utils';
import { useToast } from '../hooks/use-toast';

const Cashbook = () => {
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [editingOpening, setEditingOpening] = useState(false);
    const [openingBalanceInput, setOpeningBalanceInput] = useState('');
    const [data, setData] = useState({
        openingBalance: 0,
        incomes: [],
        expenses: [],
        totals: {
            totalIncome: 0,
            totalExpense: 0
        },
        closingBalance: 0,
        isEdited: false
    });

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/accounting/cashbook?date=${selectedDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!response.ok) throw new Error('Failed to fetch data');

            const result = await response.json();
            setData(result);
            setOpeningBalanceInput(result.openingBalance.toString());
        } catch (error) {
            console.error('Error fetching cashbook:', error);
            toast({
                title: 'Error',
                description: 'Failed to load cashbook',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOpeningBalance = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/accounting/cashbook/opening-balance`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        date: selectedDate,
                        openingBalance: parseFloat(openingBalanceInput)
                    })
                }
            );

            if (!response.ok) throw new Error('Failed to update opening balance');

            toast({
                title: 'Success',
                description: 'Opening balance updated successfully'
            });

            setEditingOpening(false);
            fetchData();
        } catch (error) {
            console.error('Error updating opening balance:', error);
            toast({
                title: 'Error',
                description: 'Failed to update opening balance',
                variant: 'destructive'
            });
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Cashbook</h1>
                    <p className="text-muted-foreground">Daily cash flow tracking</p>
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

            {/* Opening Balance */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Opening Balance</p>
                            {editingOpening ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <Input
                                        type="number"
                                        value={openingBalanceInput}
                                        onChange={(e) => setOpeningBalanceInput(e.target.value)}
                                        className="w-40"
                                        step="0.01"
                                    />
                                    <Button size="sm" onClick={handleSaveOpeningBalance}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setEditingOpening(false);
                                            setOpeningBalanceInput(data.openingBalance.toString());
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-2xl font-bold font-mono">
                                    {formatCurrency(data.openingBalance)}
                                    {data.isEdited && (
                                        <Badge variant="secondary" className="ml-2 text-xs">Edited</Badge>
                                    )}
                                </p>
                            )}
                        </div>
                        {!editingOpening && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingOpening(true)}
                            >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Incomes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-green-600">Incomes</CardTitle>
                        <CardDescription>
                            Money received on {formatDate(selectedDate)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : data.incomes.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No income entries for this date
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Source</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead>Mode</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.incomes.map((income, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">
                                                    {income.source}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {income.reference}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{income.paymentMode}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-green-600">
                                                    +{formatCurrency(income.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                    <span className="font-semibold">Total Income</span>
                                    <span className="text-lg font-bold font-mono text-green-600">
                                        +{formatCurrency(data.totals.totalIncome)}
                                    </span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Expenses */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-600">Expenses</CardTitle>
                        <CardDescription>
                            Money paid out on {formatDate(selectedDate)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : data.expenses.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No expense entries for this date
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Paid To</TableHead>
                                            <TableHead>Mode</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.expenses.map((expense, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">
                                                    {expense.category}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {expense.paidTo}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{expense.paymentMode}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-red-600">
                                                    -{formatCurrency(expense.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                    <span className="font-semibold">Total Expense</span>
                                    <span className="text-lg font-bold font-mono text-red-600">
                                        -{formatCurrency(data.totals.totalExpense)}
                                    </span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Closing Balance */}
            <Card className="bg-primary/5">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Closing Balance</p>
                            <p className="text-3xl font-bold font-mono">
                                {formatCurrency(data.closingBalance)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Opening ({formatCurrency(data.openingBalance)}) +
                                Income ({formatCurrency(data.totals.totalIncome)}) -
                                Expense ({formatCurrency(data.totals.totalExpense)})
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Cashbook;
