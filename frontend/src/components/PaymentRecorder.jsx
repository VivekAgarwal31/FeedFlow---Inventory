import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { recordPayment, getTransactionPayments } from '../lib/paymentApi';
import { useToast } from '../hooks/use-toast';

export default function PaymentRecorder({
    open,
    onClose,
    transaction,
    transactionType, // 'sale' or 'purchase'
    onPaymentRecorded
}) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    const [formData, setFormData] = useState({
        amount: '',
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        referenceNumber: '',
        notes: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast({
                title: 'Invalid Amount',
                description: 'Please enter a valid payment amount',
                variant: 'destructive'
            });
            return;
        }

        if (parseFloat(formData.amount) > transaction.amountDue) {
            toast({
                title: 'Amount Exceeds Due',
                description: `Payment amount cannot exceed amount due (₹${transaction.amountDue})`,
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
            const paymentData = {
                transactionType,
                transactionId: transaction._id,
                amount: parseFloat(formData.amount),
                paymentMethod: formData.paymentMethod,
                paymentDate: formData.paymentDate,
                referenceNumber: formData.referenceNumber,
                notes: formData.notes
            };

            const result = await recordPayment(paymentData);

            toast({
                title: 'Payment Recorded',
                description: `₹${formData.amount} payment recorded successfully`
            });

            // Reset form
            setFormData({
                amount: '',
                paymentMethod: 'cash',
                paymentDate: new Date().toISOString().split('T')[0],
                referenceNumber: '',
                notes: ''
            });

            // Notify parent component
            if (onPaymentRecorded) {
                onPaymentRecorded(result);
            }

            onClose();
        } catch (error) {
            console.error('Error recording payment:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to record payment',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const loadPaymentHistory = async () => {
        try {
            const history = await getTransactionPayments(transaction._id, transactionType);
            setPaymentHistory(history);
            setShowHistory(true);
        } catch (error) {
            console.error('Error loading payment history:', error);
            toast({
                title: 'Error',
                description: 'Failed to load payment history',
                variant: 'destructive'
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                        Record a payment for this {transactionType}
                    </DialogDescription>
                </DialogHeader>

                {/* Transaction Summary */}
                <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm font-medium">Total Amount:</span>
                        <span className="text-sm">₹{transaction.totalAmount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm font-medium">Amount Paid:</span>
                        <span className="text-sm text-green-600">₹{transaction.amountPaid?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm font-medium">Amount Due:</span>
                        <span className="text-sm font-bold text-red-600">₹{transaction.amountDue?.toFixed(2) || transaction.totalAmount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <span className={`text-sm font-medium ${transaction.paymentStatus === 'paid' ? 'text-green-600' :
                                transaction.paymentStatus === 'partial' ? 'text-yellow-600' :
                                    'text-red-600'
                            }`}>
                            {transaction.paymentStatus?.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Payment Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Payment Amount *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paymentMethod">Payment Method *</Label>
                            <Select
                                value={formData.paymentMethod}
                                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
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
                                value={formData.paymentDate}
                                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="referenceNumber">Reference Number</Label>
                            <Input
                                id="referenceNumber"
                                type="text"
                                placeholder="Cheque #, Transaction ID, etc."
                                value={formData.referenceNumber}
                                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Additional notes..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={loadPaymentHistory}
                        >
                            View Payment History
                        </Button>

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Recording...' : 'Record Payment'}
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Payment History */}
                {showHistory && (
                    <div className="mt-6 border-t pt-4">
                        <h3 className="font-semibold mb-3">Payment History</h3>
                        {paymentHistory.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No payments recorded yet</p>
                        ) : (
                            <div className="space-y-2">
                                {paymentHistory.map((payment) => (
                                    <div key={payment._id} className="flex justify-between items-center p-3 bg-muted rounded">
                                        <div>
                                            <p className="text-sm font-medium">₹{payment.amount.toFixed(2)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(payment.paymentDate).toLocaleDateString()} • {payment.paymentMethod.toUpperCase()}
                                                {payment.referenceNumber && ` • Ref: ${payment.referenceNumber}`}
                                            </p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            by {payment.recordedBy}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
