import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { generateStockItemTemplate, parseStockItemExcel, validateStockItemRow, downloadBlob } from '../lib/excelUtils';
import { stockAPI } from '../lib/api';
import { useToast } from '../hooks/use-toast';

const BulkStockUpload = ({ warehouses, onSuccess, onCancel }) => {
    const [step, setStep] = useState('upload'); // upload, preview, processing, complete
    const [file, setFile] = useState(null);
    const [parsedItems, setParsedItems] = useState([]);
    const [validatedItems, setValidatedItems] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const { toast } = useToast();

    // Download template
    const handleDownloadTemplate = async () => {
        try {
            const blob = await generateStockItemTemplate(warehouses);
            const timestamp = new Date().toISOString().split('T')[0];
            downloadBlob(blob, `stock-items-template-${timestamp}.xlsx`);

            toast({
                title: 'Template Downloaded',
                description: 'Fill in the template and upload it to create multiple items',
            });
        } catch (error) {
            console.error('Error generating template:', error);
            toast({
                title: 'Error',
                description: 'Failed to generate template',
                variant: 'destructive'
            });
        }
    };

    // Handle file selection
    const handleFileChange = async (selectedFile) => {
        if (!selectedFile) return;

        // Validate file type
        if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
            toast({
                title: 'Invalid File',
                description: 'Please upload an Excel file (.xlsx or .xls)',
                variant: 'destructive'
            });
            return;
        }

        setFile(selectedFile);

        try {
            // Parse Excel file
            const items = await parseStockItemExcel(selectedFile);

            if (items.length === 0) {
                toast({
                    title: 'Empty File',
                    description: 'No data found in the Excel file',
                    variant: 'destructive'
                });
                return;
            }

            setParsedItems(items);

            // Validate each item
            const validated = items.map(item => {
                const validation = validateStockItemRow(item, warehouses);
                return {
                    ...item,
                    ...validation
                };
            });

            setValidatedItems(validated);
            setStep('preview');

            // Show summary
            const validCount = validated.filter(item => item.valid).length;
            const invalidCount = validated.length - validCount;

            toast({
                title: 'File Parsed',
                description: `Found ${validated.length} rows: ${validCount} valid, ${invalidCount} invalid`,
            });
        } catch (error) {
            console.error('Error parsing file:', error);
            toast({
                title: 'Parse Error',
                description: error.message || 'Failed to parse Excel file',
                variant: 'destructive'
            });
        }
    };

    // Drag and drop handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    // Create items
    const handleCreateItems = async () => {
        const validItems = validatedItems.filter(item => item.valid);

        if (validItems.length === 0) {
            toast({
                title: 'No Valid Items',
                description: 'Please fix errors before creating items',
                variant: 'destructive'
            });
            return;
        }

        setProcessing(true);
        setStep('processing');
        setProgress(0);

        const results = {
            total: validItems.length,
            successful: [],
            failed: []
        };

        for (let i = 0; i < validItems.length; i++) {
            const item = validItems[i];

            try {
                // Map to API payload (same as manual creation)
                const payload = {
                    itemName: item.itemName.trim(),
                    category: item.category,
                    itemCategory: item.itemCategory?.trim() || '',
                    bagSize: parseFloat(item.bagSize),
                    warehouseId: item.warehouseId,
                    quantity: parseInt(item.initialQuantity) || 0,
                    lowStockAlert: parseInt(item.lowStockAlert) || 10,
                    notes: `Bulk upload from Excel - Row ${item.rowNumber}`
                };

                const response = await stockAPI.create(payload);
                results.successful.push({
                    rowNumber: item.rowNumber,
                    itemName: item.itemName,
                    response
                });
            } catch (error) {
                console.error(`Error creating item at row ${item.rowNumber}:`, error);

                // Extract error message
                let errorMsg = 'Failed to create item';
                if (error.response?.data?.errors && error.response.data.errors.length > 0) {
                    errorMsg = error.response.data.errors[0].msg;
                } else if (error.response?.data?.message) {
                    errorMsg = error.response.data.message;
                }

                results.failed.push({
                    rowNumber: item.rowNumber,
                    itemName: item.itemName,
                    error: errorMsg
                });
            }

            // Update progress
            setProgress(Math.round(((i + 1) / validItems.length) * 100));
        }

        setResults(results);
        setProcessing(false);
        setStep('complete');

        // Notify parent component
        if (results.successful.length > 0) {
            onSuccess();
        }
    };

    // Reset to upload step
    const handleReset = () => {
        setStep('upload');
        setFile(null);
        setParsedItems([]);
        setValidatedItems([]);
        setProgress(0);
        setResults(null);
    };

    // Render upload step
    const renderUpload = () => (
        <div className="space-y-4">
            <div className="text-center">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload Stock Items</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Upload an Excel file to create multiple stock items at once
                </p>
            </div>

            {/* Download Template Button */}
            <div className="flex justify-center">
                <Button variant="outline" onClick={handleDownloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                </Button>
            </div>

            {/* File Upload Area */}
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium mb-1">
                    Drag and drop your Excel file here
                </p>
                <p className="text-xs text-muted-foreground mb-4">or</p>
                <input
                    type="file"
                    id="file-upload"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleFileChange(e.target.files[0])}
                    className="hidden"
                />
                <label htmlFor="file-upload">
                    <Button variant="secondary" asChild>
                        <span>Browse Files</span>
                    </Button>
                </label>
            </div>

            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                    Make sure your Excel file follows the template format. Each row represents one stock item.
                </AlertDescription>
            </Alert>
        </div>
    );

    // Render preview step
    const renderPreview = () => {
        const validCount = validatedItems.filter(item => item.valid).length;
        const invalidCount = validatedItems.length - validCount;

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Preview Items</h3>
                        <p className="text-sm text-muted-foreground">
                            Review the items before creating them
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                        <X className="mr-2 h-4 w-4" />
                        Upload Different File
                    </Button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold">{validatedItems.length}</div>
                        <div className="text-sm text-muted-foreground">Total Rows</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{validCount}</div>
                        <div className="text-sm text-muted-foreground">Valid</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{invalidCount}</div>
                        <div className="text-sm text-muted-foreground">Invalid</div>
                    </div>
                </div>

                {/* Preview Table */}
                <div className="border rounded-lg max-h-[400px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">Row</TableHead>
                                <TableHead>Item Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Bag Size</TableHead>
                                <TableHead>Warehouse</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {validatedItems.map((item, index) => (
                                <TableRow
                                    key={index}
                                    className={item.valid ? '' : 'bg-red-50 dark:bg-red-950/20'}
                                >
                                    <TableCell className="font-mono text-xs">{item.rowNumber}</TableCell>
                                    <TableCell className="font-medium">{item.itemName || '-'}</TableCell>
                                    <TableCell>
                                        <span className="text-xs">{item.category || '-'}</span>
                                    </TableCell>
                                    <TableCell>{item.bagSize ? `${item.bagSize} kg` : '-'}</TableCell>
                                    <TableCell>{item.warehouse || '-'}</TableCell>
                                    <TableCell>{item.initialQuantity || 0}</TableCell>
                                    <TableCell>
                                        {item.valid ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                Valid
                                            </Badge>
                                        ) : (
                                            <div className="space-y-1">
                                                <Badge variant="destructive">
                                                    <AlertCircle className="mr-1 h-3 w-3" />
                                                    Error
                                                </Badge>
                                                <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                    {item.errors.map((error, i) => (
                                                        <div key={i}>• {error}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {invalidCount > 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Validation Errors</AlertTitle>
                        <AlertDescription>
                            {invalidCount} row(s) have errors. Only valid rows will be created.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        onClick={handleCreateItems}
                        disabled={validCount === 0}
                        className="flex-1"
                    >
                        Create {validCount} Item{validCount !== 1 ? 's' : ''}
                    </Button>
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                </div>
            </div>
        );
    };

    // Render processing step
    const renderProcessing = () => (
        <div className="space-y-4 py-8">
            <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
                <h3 className="text-lg font-semibold mb-2">Creating Items...</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Please wait while we create your stock items
                </p>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} />
            </div>

            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Do not close this window until the process is complete
                </AlertDescription>
            </Alert>
        </div>
    );

    // Render complete step
    const renderComplete = () => (
        <div className="space-y-4">
            <div className="text-center">
                {results.successful.length > 0 ? (
                    <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                ) : (
                    <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
                )}
                <h3 className="text-lg font-semibold mb-2">
                    {results.successful.length > 0 ? 'Items Created!' : 'Creation Failed'}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {results.successful.length > 0
                        ? `Successfully created ${results.successful.length} item(s)`
                        : 'No items were created'}
                </p>
            </div>

            {/* Results Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{results.total}</div>
                    <div className="text-sm text-muted-foreground">Attempted</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {results.successful.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {results.failed.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                </div>
            </div>

            {/* Failed Items Details */}
            {results.failed.length > 0 && (
                <div className="border rounded-lg p-4 max-h-[200px] overflow-auto">
                    <h4 className="font-semibold text-sm mb-2">Failed Items:</h4>
                    <div className="space-y-2">
                        {results.failed.map((item, index) => (
                            <div key={index} className="text-sm">
                                <span className="font-mono text-xs text-muted-foreground">Row {item.rowNumber}:</span>{' '}
                                <span className="font-medium">{item.itemName}</span>
                                <div className="text-red-600 dark:text-red-400 text-xs ml-4">
                                    {item.error}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <Button onClick={handleReset} variant="outline" className="flex-1">
                    Upload Another File
                </Button>
                <Button onClick={onCancel} className="flex-1">
                    Done
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-[400px]">
            {step === 'upload' && renderUpload()}
            {step === 'preview' && renderPreview()}
            {step === 'processing' && renderProcessing()}
            {step === 'complete' && renderComplete()}
        </div>
    );
};

export default BulkStockUpload;
