import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import api, { clientAPI, supplierAPI, warehouseAPI } from '../lib/api';

const Reports = () => {
    const { toast } = useToast();
    const [reportType, setReportType] = useState('sales');
    const [format, setFormat] = useState('pdf');
    const [loading, setLoading] = useState(false);

    // Date filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Entity filters
    const [clients, setClients] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');

    // Fetch filter options
    useEffect(() => {
        fetchClients();
        fetchSuppliers();
        fetchWarehouses();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await clientAPI.getAll();
            setClients(response.data.clients || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await supplierAPI.getAll();
            setSuppliers(response.data.suppliers || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const response = await warehouseAPI.getAll();
            setWarehouses(response.data.warehouses || []);
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        }
    };

    // Date presets
    const setDatePreset = (preset) => {
        const today = new Date();
        const start = new Date();

        switch (preset) {
            case 'today':
                setStartDate(today.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'week':
                start.setDate(today.getDate() - 7);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'month':
                start.setMonth(today.getMonth() - 1);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'quarter':
                start.setMonth(today.getMonth() - 3);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'year':
                start.setFullYear(today.getFullYear() - 1);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            default:
                setStartDate('');
                setEndDate('');
        }
    };

    const generateReport = async () => {
        try {
            // Validate date range for sales, purchase, client, and supplier reports
            if (reportType !== 'inventory') {
                if (!startDate || !endDate) {
                    toast({
                        title: 'Date Range Required',
                        description: 'Please select both start and end dates for this report.',
                        variant: 'destructive'
                    });
                    return;
                }
            }

            setLoading(true);

            // Build request body based on report type
            const requestBody = {};

            if (startDate) requestBody.startDate = startDate;
            if (endDate) requestBody.endDate = endDate;

            if (reportType === 'sales') {
                if (selectedClient && selectedClient !== '') requestBody.clientId = selectedClient;
                if (paymentStatus && paymentStatus !== '') requestBody.paymentStatus = paymentStatus;
            } else if (reportType === 'purchases') {
                if (selectedSupplier && selectedSupplier !== '') requestBody.supplierId = selectedSupplier;
                if (paymentStatus && paymentStatus !== '') requestBody.paymentStatus = paymentStatus;
            } else if (reportType === 'inventory') {
                if (selectedWarehouse && selectedWarehouse !== '') requestBody.warehouseId = selectedWarehouse;
            } else if (reportType === 'deliveries-out') {
                if (selectedClient && selectedClient !== '') requestBody.clientId = selectedClient;
            } else if (reportType === 'deliveries-in') {
                if (selectedSupplier && selectedSupplier !== '') requestBody.supplierId = selectedSupplier;
            }

            // Make API request
            const endpoint = `/reports/${reportType}/${format}`;
            const response = await api.post(endpoint, requestBody, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const extension = format === 'pdf' ? 'pdf' : 'xlsx';
            const filename = `${reportType}_report_${Date.now()}.${extension}`;
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast({
                title: 'Report Generated',
                description: `Your ${reportType} report has been downloaded successfully.`,
            });

        } catch (error) {
            console.error('Error generating report:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to generate report',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Reports</h1>
                <p className="text-muted-foreground">
                    Generate comprehensive reports for sales, purchases, deliveries, inventory, clients, and suppliers.
                </p>
            </div>

            {/* Report Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                    className={`p-6 cursor-pointer transition-all hover:shadow-md ${reportType === 'sales' ? 'ring-2 ring-primary' : ''
                        }`}
                    onClick={() => setReportType('sales')}
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Sales Report</h3>
                            <p className="text-sm text-muted-foreground">Client-wise sales data</p>
                        </div>
                    </div>
                </Card>

                <Card
                    className={`p-6 cursor-pointer transition-all hover:shadow-md ${reportType === 'purchases' ? 'ring-2 ring-primary' : ''
                        }`}
                    onClick={() => setReportType('purchases')}
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Purchase Report</h3>
                            <p className="text-sm text-muted-foreground">Supplier-wise purchases</p>
                        </div>
                    </div>
                </Card>

                <Card
                    className={`p-6 cursor-pointer transition-all hover:shadow-md ${reportType === 'inventory' ? 'ring-2 ring-primary' : ''
                        }`}
                    onClick={() => setReportType('inventory')}
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Inventory Report</h3>
                            <p className="text-sm text-muted-foreground">Current stock levels</p>
                        </div>
                    </div>
                </Card>

                <Card
                    className={`p-6 cursor-pointer transition-all hover:shadow-md ${reportType === 'clients' ? 'ring-2 ring-primary' : ''
                        }`}
                    onClick={() => setReportType('clients')}
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Client Report</h3>
                            <p className="text-sm text-muted-foreground">Financial summary per client</p>
                        </div>
                    </div>
                </Card>

                <Card
                    className={`p-6 cursor-pointer transition-all hover:shadow-md ${reportType === 'suppliers' ? 'ring-2 ring-primary' : ''
                        }`}
                    onClick={() => setReportType('suppliers')}
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Supplier Report</h3>
                            <p className="text-sm text-muted-foreground">Financial summary per supplier</p>
                        </div>
                    </div>
                </Card>

                <Card
                    className={`p-6 cursor-pointer transition-all hover:shadow-md ${reportType === 'deliveries-out' || reportType === 'deliveries-in' ? 'ring-2 ring-primary' : ''
                        }`}
                    onClick={() => setReportType('deliveries-out')}
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Delivery Reports</h3>
                            <p className="text-sm text-muted-foreground">Incoming and outgoing deliveries</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters Section */}
            <Card className="p-6">
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Filters</h2>
                    </div>

                    {/* Date Range */}
                    {reportType !== 'inventory' && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium mb-2 block">Date Range (Required)</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDatePreset('today')}
                                    >
                                        Today
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDatePreset('week')}
                                    >
                                        Last 7 Days
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDatePreset('month')}
                                    >
                                        Last Month
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDatePreset('quarter')}
                                    >
                                        Last Quarter
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDatePreset('year')}
                                    >
                                        Last Year
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDatePreset('all')}
                                    >
                                        All Time
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="startDate">Start Date *</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="endDate">End Date *</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delivery Type Selector - Only for delivery reports */}
                    {(reportType === 'deliveries-out' || reportType === 'deliveries-in') && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Delivery Type</label>
                            <div className="flex gap-2">
                                <Button
                                    variant={reportType === 'deliveries-out' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setReportType('deliveries-out')}
                                    className="flex-1"
                                >
                                    Delivery Out
                                </Button>
                                <Button
                                    variant={reportType === 'deliveries-in' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setReportType('deliveries-in')}
                                    className="flex-1"
                                >
                                    Delivery In
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Entity-specific filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reportType === 'sales' && (
                            <>
                                <div>
                                    <Label htmlFor="client">Client (Optional)</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Select value={selectedClient} onValueChange={setSelectedClient}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Clients" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {clients.map((client) => (
                                                    <SelectItem key={client._id} value={client._id}>
                                                        {client.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedClient && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedClient('')}
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="paymentStatus">Payment Status (Optional)</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Statuses" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="paid">Paid</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="partial">Partial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {paymentStatus && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPaymentStatus('')}
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {reportType === 'purchases' && (
                            <>
                                <div>
                                    <Label htmlFor="supplier">Supplier (Optional)</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Suppliers" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {suppliers.map((supplier) => (
                                                    <SelectItem key={supplier._id} value={supplier._id}>
                                                        {supplier.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedSupplier && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedSupplier('')}
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="paymentStatus">Payment Status (Optional)</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Statuses" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="paid">Paid</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="partial">Partial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {paymentStatus && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPaymentStatus('')}
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {reportType === 'inventory' && (
                            <div>
                                <Label htmlFor="warehouse">Warehouse (Optional)</Label>
                                <div className="flex gap-2 mt-1">
                                    <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Warehouses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {warehouses.map((warehouse) => (
                                                <SelectItem key={warehouse._id} value={warehouse._id}>
                                                    {warehouse.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedWarehouse && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedWarehouse('')}
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Format Selection */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Report Format</Label>
                        <div className="flex gap-4">
                            <Button
                                variant={format === 'pdf' ? 'default' : 'outline'}
                                onClick={() => setFormat('pdf')}
                                className="flex items-center gap-2"
                            >
                                <FileText className="h-4 w-4" />
                                PDF
                            </Button>
                            <Button
                                variant={format === 'excel' ? 'default' : 'outline'}
                                onClick={() => setFormat('excel')}
                                className="flex items-center gap-2"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                Excel
                            </Button>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="pt-4 border-t">
                        <Button
                            onClick={generateReport}
                            disabled={loading}
                            className="w-full md:w-auto"
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Generate Report
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Info Card */}
            <Card className="p-6 bg-muted/50">
                <h3 className="font-semibold mb-2">Report Information</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Reports include summary statistics and detailed transaction data</li>
                    <li>• PDF reports are formatted for printing and sharing</li>
                    <li>• Excel reports include filters and can be edited</li>
                    <li>• All reports respect your company's data isolation</li>
                    <li>• Date ranges are inclusive of both start and end dates</li>
                </ul>
            </Card>
        </div>
    );
};

export default Reports;
