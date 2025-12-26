import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { getAccountsReceivable, getReceivableClients, getOutstandingInvoices } from '../lib/paymentApi';
import { formatCurrency, formatDate } from '../lib/utils';
import PaymentRecorder from '../components/PaymentRecorder';

export default function AccountsReceivable() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [clients, setClients] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [activeTab, setActiveTab] = useState('summary');
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    useEffect(() => {
        fetchData();
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

    const handleRecordPayment = (invoice) => {
        setSelectedInvoice(invoice);
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
                <h1 className="text-3xl font-bold tracking-tight">Accounts Receivable</h1>
                <p className="text-muted-foreground mt-1">
                    Track outstanding payments and manage customer receivables
                </p>
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
                                    <TableHead>Actions</TableHead>
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
                                            <TableCell>
                                                {invoice.paymentStatus !== 'paid' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleRecordPayment(invoice)}
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
                                            No outstanding invoices
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Payment Recorder Dialog */}
            {selectedInvoice && (
                <PaymentRecorder
                    open={paymentDialogOpen}
                    onClose={() => {
                        setPaymentDialogOpen(false);
                        setSelectedInvoice(null);
                    }}
                    transaction={selectedInvoice}
                    transactionType="sale"
                    onPaymentRecorded={handlePaymentRecorded}
                />
            )}
        </div>
    );
}
