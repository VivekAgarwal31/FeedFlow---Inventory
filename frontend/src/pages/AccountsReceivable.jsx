import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Users, Search } from 'lucide-react';
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
import { getAccountsReceivable, getReceivableClients, getOutstandingInvoices, recordClientPayment } from '../lib/paymentApi';
import { formatCurrency, formatDate } from '../lib/utils';
import { clientAPI } from '../lib/api';

export default function AccountsReceivable() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [clients, setClients] = useState([]);
    const [allClients, setAllClients] = useState([]); // For dropdown
    const [invoices, setInvoices] = useState([]);
    const [activeTab, setActiveTab] = useState('summary');

    // Centralized payment state
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientSearch, setClientSearch] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);
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
        fetchAllClients();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [summaryData, clientsData, invoicesData] = await Promise.all([
                getAccountsReceivable(),
                getReceivableClients(),
                getOutstandingInvoices()
            ]);

            setSummary(summaryData);
            setClients(clientsData.clients || []);
            setInvoices(invoicesData.invoices || []);
        } catch (error) {
            console.error('Error fetching AR data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load accounts receivable data',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchAllClients = async () => {
        try {
            const response = await clientAPI.getAll();
            setAllClients(response.data.clients || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
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
        setSelectedClient(null);
        setClientSearch('');
        setPaymentDialogOpen(true);
    };

    const handleClientSelect = (client) => {
        setSelectedClient(client);
        setClientSearch(client.name);
        setShowClientDropdown(false);
    };

    const filteredClients = allClients.filter(client =>
        client.name.toLowerCase().includes(clientSearch.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));

    const handleSubmitPayment = async (e) => {
        e.preventDefault();

        if (!selectedClient) {
            toast({
                title: 'Error',
                description: 'Please select a client',
                variant: 'destructive'
            });
            return;
        }

        setSubmittingPayment(true);

        try {
            const response = await recordClientPayment({
                clientId: selectedClient._id,
                amount: parseFloat(paymentForm.amount),
                paymentMode: paymentForm.paymentMode,
                paymentDate: paymentForm.paymentDate,
                referenceNumber: paymentForm.referenceNumber,
                notes: paymentForm.notes
            });

            toast({
                title: 'Success',
                description: `Payment recorded! ${response.salesUpdated.length} bill(s) updated.${response.overpaidAmount > 0 ? ` Overpaid: ${formatCurrency(response.overpaidAmount)}` : ''}`
            });

            setPaymentDialogOpen(false);
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
                    <h1 className="text-3xl font-bold tracking-tight">Receipt</h1>
                    <p className="text-muted-foreground mt-1">
                        Track outstanding payments and manage customer receivables
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
                        <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary?.totalOutstanding || 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            {summary?.salesCount || 0} unpaid invoices
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
                            Requires immediate attention
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current (Not Due)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
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
                        <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.topClients?.length || 0}</div>
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
                        <CardDescription>Breakdown of receivables by age</CardDescription>
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
                    Top Clients
                </Button>
                <Button
                    variant={activeTab === 'invoices' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('invoices')}
                >
                    Outstanding Invoices
                </Button>
            </div>

            {/* Top Clients Table */}
            {activeTab === 'summary' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Top Clients by Outstanding Amount</CardTitle>
                        <CardDescription>Clients with the highest receivables</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client Name</TableHead>
                                    <TableHead>Outstanding Amount</TableHead>
                                    <TableHead>Unpaid Invoices</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summary?.topClients?.length > 0 ? (
                                    summary.topClients.map((client) => (
                                        <TableRow key={client._id}>
                                            <TableCell className="font-medium">{client.clientName}</TableCell>
                                            <TableCell className="font-mono">{formatCurrency(client.totalDue)}</TableCell>
                                            <TableCell>{client.salesCount} invoices</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            No outstanding receivables
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Outstanding Invoices Table */}
            {activeTab === 'invoices' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Outstanding Invoices</CardTitle>
                        <CardDescription>All unpaid and partially paid invoices</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Total Amount</TableHead>
                                    <TableHead>Amount Paid</TableHead>
                                    <TableHead>Amount Due</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.length > 0 ? (
                                    invoices.map((invoice) => (
                                        <TableRow key={invoice._id}>
                                            <TableCell>{formatDate(invoice.saleDate || invoice.createdAt)}</TableCell>
                                            <TableCell className="font-medium">{invoice.clientName}</TableCell>
                                            <TableCell className="font-mono">{formatCurrency(invoice.totalAmount)}</TableCell>
                                            <TableCell className="font-mono text-green-600">{formatCurrency(invoice.amountPaid || 0)}</TableCell>
                                            <TableCell className="font-mono font-bold text-red-600">{formatCurrency(invoice.amountDue || invoice.totalAmount)}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        invoice.paymentStatus === 'paid' ? 'default' :
                                                            invoice.paymentStatus === 'partial' ? 'secondary' :
                                                                invoice.isOverdue ? 'destructive' : 'outline'
                                                    }
                                                >
                                                    {invoice.isOverdue ? 'OVERDUE' : invoice.paymentStatus?.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            No outstanding invoices
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Centralized Payment Dialog */}
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            Record a payment for a client. Payment will be automatically allocated across unpaid bills.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitPayment} className="space-y-4">
                        {/* Client Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="client-search">Select Client *</Label>
                            <div className="relative">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="client-search"
                                        placeholder="Search client by name..."
                                        value={clientSearch}
                                        onChange={(e) => {
                                            setClientSearch(e.target.value);
                                            setShowClientDropdown(true);
                                        }}
                                        onFocus={() => setShowClientDropdown(true)}
                                        className="pl-8"
                                    />
                                </div>
                                {showClientDropdown && clientSearch && (
                                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                                        {filteredClients.length > 0 ? (
                                            filteredClients.map((client) => (
                                                <div
                                                    key={client._id}
                                                    className="px-3 py-2 hover:bg-accent cursor-pointer"
                                                    onClick={() => handleClientSelect(client)}
                                                >
                                                    <div className="font-medium">{client.name}</div>
                                                    {client.currentCredit > 0 && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Outstanding: {formatCurrency(client.currentCredit)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                                No clients found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Client Summary */}
                        {selectedClient && (
                            <div className="bg-muted p-3 rounded-md space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Receivable:</span>
                                    <span className="font-semibold text-orange-600">{formatCurrency(selectedClient.currentCredit || 0)}</span>
                                </div>
                                {selectedClient.overpaidAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Overpaid (Credit):</span>
                                        <span className="font-semibold text-green-600">{formatCurrency(selectedClient.overpaidAmount)}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Payment Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Payment Amount *</Label>
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

                            <div className="space-y-2">
                                <Label htmlFor="paymentMode">Payment Mode *</Label>
                                <Select
                                    value={paymentForm.paymentMode}
                                    onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMode: value })}
                                >
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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

                            <div className="space-y-2">
                                <Label htmlFor="referenceNumber">Reference Number</Label>
                                <Input
                                    id="referenceNumber"
                                    type="text"
                                    placeholder="Cheque #, Transaction ID, etc."
                                    value={paymentForm.referenceNumber}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Additional notes..."
                                value={paymentForm.notes}
                                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submittingPayment || !selectedClient} className="flex-1">
                                {submittingPayment ? 'Recording...' : 'Record Payment'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
