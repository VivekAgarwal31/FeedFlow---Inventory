import { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, AlertCircle, Building2, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';
import { getAccountsPayable, getPayableSuppliers, getOutstandingBills, recordSupplierPayment } from '../lib/paymentApi';
import { supplierAPI } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

export default function AccountsPayable() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [allSuppliers, setAllSuppliers] = useState([]); // For dropdown
    const [bills, setBills] = useState([]);
    const [activeTab, setActiveTab] = useState('summary');

    // Centralized payment state
    const [centralPaymentDialogOpen, setCentralPaymentDialogOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [supplierSearch, setSupplierSearch] = useState('');
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentMode: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        referenceNumber: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
        fetchAllSuppliers();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [summaryData, suppliersData, billsData] = await Promise.all([
                getAccountsPayable(),
                getPayableSuppliers(),
                getOutstandingBills()
            ]);

            setSummary(summaryData);
            setSuppliers(suppliersData.suppliers || []);
            setBills(billsData.bills || []);
        } catch (error) {
            console.error('Error fetching AP data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load accounts payable data',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };



    const fetchAllSuppliers = async () => {
        try {
            const response = await supplierAPI.getAll();
            setAllSuppliers(response.data.suppliers || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const handleOpenPaymentDialog = () => {
        setPaymentForm({
            amount: '',
            paymentMode: 'cash',
            paymentDate: new Date().toISOString().split('T')[0],
            referenceNumber: '',
            notes: ''
        });
        setSelectedSupplier(null);
        setSupplierSearch('');
        setCentralPaymentDialogOpen(true);
    };

    const handleSupplierSelect = (supplier) => {
        setSelectedSupplier(supplier);
        setSupplierSearch(supplier.name);
        setShowSupplierDropdown(false);
    };

    const filteredSuppliers = allSuppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));

    const handleSubmitPayment = async (e) => {
        e.preventDefault();

        if (!selectedSupplier) {
            toast({
                title: 'Error',
                description: 'Please select a supplier',
                variant: 'destructive'
            });
            return;
        }

        setSubmittingPayment(true);

        try {
            const response = await recordSupplierPayment({
                supplierId: selectedSupplier._id,
                amount: parseFloat(paymentForm.amount),
                paymentMode: paymentForm.paymentMode,
                paymentDate: paymentForm.paymentDate,
                referenceNumber: paymentForm.referenceNumber,
                notes: paymentForm.notes
            });

            toast({
                title: 'Success',
                description: `Payment recorded! ${response.purchasesUpdated.length} bill(s) updated.${response.overpaidAmount > 0 ? ` Overpaid: ${formatCurrency(response.overpaidAmount)}` : ''}`
            });

            setCentralPaymentDialogOpen(false);
            setSubmittingPayment(false);
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error recording payment:', error);
            setSubmittingPayment(false);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to record payment',
                variant: 'destructive'
            });
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payment</h1>
                    <p className="text-muted-foreground mt-1">
                        Track outstanding bills and manage supplier payments
                    </p>
                </div>
                <Button onClick={handleOpenPaymentDialog}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Record Payment
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary?.totalPayable || 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            {summary?.purchasesCount || 0} unpaid bills
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(summary?.overdueAmount || 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            Requires immediate payment
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current (Not Due)</CardTitle>
                        <TrendingDown className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(summary?.currentAmount || 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            Within payment terms
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.topSuppliers?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            With outstanding balances
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Aging Analysis */}
            {summary?.aging && (
                <Card>
                    <CardHeader>
                        <CardTitle>Aging Analysis</CardTitle>
                        <CardDescription>Breakdown of payables by age</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="space-y-2">
                                <p className="text-sm font-medium">0-30 Days</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.aging.current)}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">31-60 Days</p>
                                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.aging.days31_60)}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">61-90 Days</p>
                                <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.aging.days61_90)}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">90+ Days</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.aging.days90Plus)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                <Button
                    variant={activeTab === 'summary' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('summary')}
                >
                    Top Suppliers
                </Button>
                <Button
                    variant={activeTab === 'bills' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('bills')}
                >
                    Outstanding Bills
                </Button>
            </div>

            {/* Top Suppliers Table */}
            {activeTab === 'summary' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Top Suppliers by Outstanding Amount</CardTitle>
                        <CardDescription>Suppliers with the highest payables</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Supplier Name</TableHead>
                                    <TableHead>Outstanding Amount</TableHead>
                                    <TableHead>Unpaid Bills</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summary?.topSuppliers?.length > 0 ? (
                                    summary.topSuppliers.map((supplier) => (
                                        <TableRow key={supplier._id}>
                                            <TableCell className="font-medium">{supplier.supplierName}</TableCell>
                                            <TableCell className="font-mono">{formatCurrency(supplier.totalDue)}</TableCell>
                                            <TableCell>{supplier.purchasesCount} bills</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            No outstanding payables
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Outstanding Bills Table */}
            {activeTab === 'bills' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Outstanding Bills</CardTitle>
                        <CardDescription>All unpaid and partially paid bills</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Total Amount</TableHead>
                                    <TableHead>Amount Paid</TableHead>
                                    <TableHead>Amount Due</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bills.length > 0 ? (
                                    bills.map((bill) => (
                                        <TableRow key={bill._id}>
                                            <TableCell>{formatDate(bill.purchaseDate || bill.createdAt)}</TableCell>
                                            <TableCell className="font-medium">{bill.supplierName}</TableCell>
                                            <TableCell className="font-mono">{formatCurrency(bill.totalAmount)}</TableCell>
                                            <TableCell className="font-mono text-green-600">{formatCurrency(bill.amountPaid || 0)}</TableCell>
                                            <TableCell className="font-mono font-bold text-red-600">{formatCurrency(bill.amountDue || bill.totalAmount)}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        bill.paymentStatus === 'paid' ? 'default' :
                                                            bill.paymentStatus === 'partial' ? 'secondary' :
                                                                bill.isOverdue ? 'destructive' : 'outline'
                                                    }
                                                >
                                                    {bill.isOverdue ? 'OVERDUE' : bill.paymentStatus?.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            No outstanding bills
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Centralized Payment Dialog */}
            <Dialog open={centralPaymentDialogOpen} onOpenChange={setCentralPaymentDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Record Supplier Payment</DialogTitle>
                        <DialogDescription>
                            Record a payment that will be automatically allocated across outstanding bills
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitPayment} className="space-y-4">
                        {/* Supplier Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="supplier">Supplier *</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    id="supplier"
                                    placeholder="Search supplier..."
                                    value={supplierSearch}
                                    onChange={(e) => {
                                        setSupplierSearch(e.target.value);
                                        setSelectedSupplier(null);
                                    }}
                                    onFocus={() => setShowSupplierDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                                    className="pl-9"
                                    required
                                />
                                {showSupplierDropdown && (
                                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                                        {filteredSuppliers.length > 0 ? (
                                            filteredSuppliers.map((supplier) => (
                                                <div
                                                    key={supplier._id}
                                                    className="px-3 py-2 cursor-pointer hover:bg-muted"
                                                    onClick={() => handleSupplierSelect(supplier)}
                                                >
                                                    <div className="font-medium">{supplier.name}</div>
                                                    {supplier.currentPayable > 0 && (
                                                        <div className="text-xs text-orange-600">
                                                            Payable: {formatCurrency(supplier.currentPayable)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-muted-foreground">
                                                No suppliers found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {selectedSupplier && (
                                <div className="text-sm space-y-1 p-2 bg-muted rounded">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Payable:</span>
                                        <span className="font-medium text-orange-600">{formatCurrency(selectedSupplier.currentPayable || 0)}</span>
                                    </div>
                                    {selectedSupplier.overpaidAmount > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Overpaid:</span>
                                            <span className="font-medium text-green-600">{formatCurrency(selectedSupplier.overpaidAmount)}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                required
                            />
                        </div>

                        {/* Payment Mode */}
                        <div className="space-y-2">
                            <Label htmlFor="paymentMode">Payment Mode *</Label>
                            <Select value={paymentForm.paymentMode} onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMode: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="upi">UPI</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Payment Date */}
                        <div className="space-y-2">
                            <Label htmlFor="paymentDate">Payment Date *</Label>
                            <Input
                                id="paymentDate"
                                type="date"
                                value={paymentForm.paymentDate}
                                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                required
                            />
                        </div>

                        {/* Reference Number */}
                        <div className="space-y-2">
                            <Label htmlFor="referenceNumber">Reference Number</Label>
                            <Input
                                id="referenceNumber"
                                placeholder="Transaction ID, Cheque No, etc."
                                value={paymentForm.referenceNumber}
                                onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Additional notes..."
                                value={paymentForm.notes}
                                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                rows={2}
                            />
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pt-4">
                            <Button type="submit" disabled={submittingPayment} className="flex-1">
                                {submittingPayment ? 'Recording...' : 'Record Payment'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCentralPaymentDialogOpen(false)}
                                disabled={submittingPayment}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
