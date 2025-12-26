import { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, AlertCircle, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { getAccountsPayable, getPayableSuppliers, getOutstandingBills } from '../lib/paymentApi';
import { formatCurrency, formatDate } from '../lib/utils';
import PaymentRecorder from '../components/PaymentRecorder';

export default function AccountsPayable() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [bills, setBills] = useState([]);
    const [activeTab, setActiveTab] = useState('summary');
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);

    useEffect(() => {
        fetchData();
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

    const handleRecordPayment = (bill) => {
        setSelectedBill(bill);
        setPaymentDialogOpen(true);
    };

    const handlePaymentRecorded = () => {
        fetchData(); // Refresh data
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
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Accounts Payable</h1>
                <p className="text-muted-foreground mt-1">
                    Track outstanding bills and manage supplier payments
                </p>
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
                                    <TableHead>Actions</TableHead>
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
                                            <TableCell>
                                                {bill.paymentStatus !== 'paid' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleRecordPayment(bill)}
                                                    >
                                                        Record Payment
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                                            No outstanding bills
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Payment Recorder Dialog */}
            {selectedBill && (
                <PaymentRecorder
                    open={paymentDialogOpen}
                    onClose={() => {
                        setPaymentDialogOpen(false);
                        setSelectedBill(null);
                    }}
                    transaction={selectedBill}
                    transactionType="purchase"
                    onPaymentRecorded={handlePaymentRecorded}
                />
            )}
        </div>
    );
}
