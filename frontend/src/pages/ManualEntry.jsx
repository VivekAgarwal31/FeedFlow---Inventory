import React, { useState } from 'react';
import { PlusCircle, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';

const ManualEntry = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        entryDate: new Date().toISOString().split('T')[0],
        type: 'expense',
        category: '',
        description: '',
        amount: '',
        paymentMode: 'cash'
    });

    const expenseCategories = [
        'Rent',
        'Utilities',
        'Transportation',
        'Maintenance',
        'Office Supplies',
        'Communication',
        'Insurance',
        'Taxes',
        'Miscellaneous'
    ];

    const incomeCategories = [
        'Interest',
        'Refund',
        'Commission',
        'Rental Income',
        'Other Income'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.amount || parseFloat(form.amount) <= 0) {
            toast({
                title: 'Error',
                description: 'Please enter a valid amount',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/accounting/manual-entry`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        ...form,
                        amount: parseFloat(form.amount)
                    })
                }
            );

            if (!response.ok) throw new Error('Failed to create entry');

            toast({
                title: 'Success',
                description: `${form.type === 'income' ? 'Income' : 'Expense'} entry created successfully`
            });

            // Reset form
            setForm({
                entryDate: new Date().toISOString().split('T')[0],
                type: 'expense',
                category: '',
                description: '',
                amount: '',
                paymentMode: 'cash'
            });
        } catch (error) {
            console.error('Error creating entry:', error);
            toast({
                title: 'Error',
                description: 'Failed to create entry',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold">Manual Entry</h1>
                <p className="text-muted-foreground">Record income or expense transactions</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Create Entry</CardTitle>
                    <CardDescription>
                        Add manual income or expense entries to your accounting records
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Entry Type */}
                        <div className="space-y-3">
                            <Label>Entry Type</Label>
                            <RadioGroup
                                value={form.type}
                                onValueChange={(value) => setForm({ ...form, type: value, category: '' })}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="income" id="income" />
                                    <Label htmlFor="income" className="flex items-center gap-2 cursor-pointer">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        <span>Income</span>
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="expense" id="expense" />
                                    <Label htmlFor="expense" className="flex items-center gap-2 cursor-pointer">
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                        <span>Expense</span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Entry Date */}
                        <div className="space-y-2">
                            <Label htmlFor="entryDate">Entry Date</Label>
                            <Input
                                id="entryDate"
                                type="date"
                                value={form.entryDate}
                                onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                                required
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={form.category}
                                onValueChange={(value) => setForm({ ...form, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(form.type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Enter details about this transaction"
                                rows={3}
                            />
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₹)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    className="pl-10"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        {/* Payment Mode */}
                        <div className="space-y-2">
                            <Label htmlFor="paymentMode">Payment Mode</Label>
                            <Select
                                value={form.paymentMode}
                                onValueChange={(value) => setForm({ ...form, paymentMode: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="bank">Bank Transfer</SelectItem>
                                    <SelectItem value="upi">UPI</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? (
                                    <>
                                        <PlusCircle className="mr-2 h-4 w-4 animate-pulse" />
                                        Creating Entry...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Create {form.type === 'income' ? 'Income' : 'Expense'} Entry
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <DollarSign className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-amber-900 mb-1">About Manual Entries</h4>
                            <p className="text-sm text-amber-800">
                                Use manual entries to record income or expenses that don't come from regular
                                business transactions, such as interest received, utility bills, rent payments,
                                or other miscellaneous financial activities. All entries will appear in your
                                cashbook automatically.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManualEntry;
