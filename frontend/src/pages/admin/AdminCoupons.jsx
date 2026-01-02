import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Eye, Trash2 } from 'lucide-react';

export default function AdminCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showUsageDialog, setShowUsageDialog] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [usageHistory, setUsageHistory] = useState([]);
    const { toast } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage',
        value: '',
        applicablePlans: [],
        expiryDate: '',
        usageLimit: {
            total: '',
            perUser: false
        },
        description: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/coupons');
            setCoupons(response.data.coupons);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to fetch coupons',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();

        try {
            // Validate
            if (!formData.code || formData.code.length < 4) {
                toast({
                    title: 'Validation Error',
                    description: 'Coupon code must be at least 4 characters',
                    variant: 'destructive'
                });
                return;
            }

            if (formData.type !== 'free_plan' && !formData.value) {
                toast({
                    title: 'Validation Error',
                    description: 'Value is required for percentage and flat coupons',
                    variant: 'destructive'
                });
                return;
            }

            if (formData.applicablePlans.length === 0) {
                toast({
                    title: 'Validation Error',
                    description: 'Please select at least one applicable plan',
                    variant: 'destructive'
                });
                return;
            }

            const payload = {
                ...formData,
                code: formData.code.toUpperCase(),
                value: formData.type === 'free_plan' ? 0 : parseFloat(formData.value),
                usageLimit: {
                    total: formData.usageLimit.total ? parseInt(formData.usageLimit.total) : null,
                    perUser: formData.usageLimit.perUser
                }
            };

            await api.post('/admin/coupons', payload);

            toast({
                title: 'Success',
                description: 'Coupon created successfully'
            });

            setShowCreateDialog(false);
            resetForm();
            fetchCoupons();
        } catch (error) {
            console.error('Coupon creation error:', error);
            console.error('Error response:', error.response?.data);
            toast({
                title: 'Error',
                description: error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to create coupon',
                variant: 'destructive'
            });
        }
    };

    const toggleCouponStatus = async (couponId) => {
        try {
            await api.patch(`/admin/coupons/${couponId}/toggle`);
            toast({
                title: 'Success',
                description: 'Coupon status updated'
            });
            fetchCoupons();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to toggle coupon status',
                variant: 'destructive'
            });
        }
    };

    const viewUsageHistory = async (coupon) => {
        try {
            setSelectedCoupon(coupon);
            const response = await api.get(`/admin/coupons/${coupon._id}/usage`);
            setUsageHistory(response.data.usageHistory);
            setShowUsageDialog(true);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch usage history',
                variant: 'destructive'
            });
        }
    };

    const deleteCoupon = async (couponId) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;

        try {
            await api.delete(`/admin/coupons/${couponId}`);
            toast({
                title: 'Success',
                description: 'Coupon deleted successfully'
            });
            fetchCoupons();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete coupon',
                variant: 'destructive'
            });
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            type: 'percentage',
            value: '',
            applicablePlans: [],
            expiryDate: '',
            usageLimit: {
                total: '',
                perUser: false
            },
            description: ''
        });
    };

    const handlePlanToggle = (plan) => {
        setFormData(prev => ({
            ...prev,
            applicablePlans: prev.applicablePlans.includes(plan)
                ? prev.applicablePlans.filter(p => p !== plan)
                : [...prev.applicablePlans, plan]
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Coupon Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Create and manage discount coupons for subscription plans
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Coupon
                </Button>
            </div>

            {/* Coupons List */}
            <Card className="p-6">
                {coupons.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No coupons created yet</p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setShowCreateDialog(true)}
                        >
                            Create Your First Coupon
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3">Code</th>
                                    <th className="text-left p-3">Type</th>
                                    <th className="text-left p-3">Value</th>
                                    <th className="text-left p-3">Plans</th>
                                    <th className="text-left p-3">Usage</th>
                                    <th className="text-left p-3">Expiry</th>
                                    <th className="text-left p-3">Status</th>
                                    <th className="text-left p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map((coupon) => (
                                    <tr key={coupon._id} className="border-b hover:bg-muted/50">
                                        <td className="p-3 font-mono font-bold">{coupon.code}</td>
                                        <td className="p-3 capitalize">{coupon.type.replace('_', ' ')}</td>
                                        <td className="p-3">
                                            {coupon.type === 'percentage' && `${coupon.value}%`}
                                            {coupon.type === 'flat' && `₹${coupon.value}`}
                                            {coupon.type === 'free_plan' && '100%'}
                                        </td>
                                        <td className="p-3">
                                            {coupon.applicablePlans.map(p => p.toUpperCase()).join(', ')}
                                        </td>
                                        <td className="p-3">
                                            {coupon.usedCount}
                                            {coupon.usageLimit.total && ` / ${coupon.usageLimit.total}`}
                                            {coupon.usageLimit.perUser && ' (per user)'}
                                        </td>
                                        <td className="p-3">
                                            {coupon.expiryDate
                                                ? new Date(coupon.expiryDate).toLocaleDateString()
                                                : 'No expiry'
                                            }
                                        </td>
                                        <td className="p-3">
                                            <Switch
                                                checked={coupon.isActive}
                                                onCheckedChange={() => toggleCouponStatus(coupon._id)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => viewUsageHistory(coupon)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {coupon.usedCount === 0 && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => deleteCoupon(coupon._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Create Coupon Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Coupon</DialogTitle>
                        <DialogDescription>
                            Create a discount coupon for subscription plans
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateCoupon} className="space-y-4">
                        <div>
                            <Label htmlFor="code">Coupon Code *</Label>
                            <Input
                                id="code"
                                placeholder="e.g., SAVE20"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                maxLength={20}
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                4-20 alphanumeric characters
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="type">Coupon Type *</Label>
                            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage Discount</SelectItem>
                                    <SelectItem value="flat">Flat Amount Discount</SelectItem>
                                    <SelectItem value="free_plan">Free Plan (Admin Gift)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.type !== 'free_plan' && (
                            <div>
                                <Label htmlFor="value">
                                    {formData.type === 'percentage' ? 'Percentage (1-100)' : 'Amount (₹)'}  *
                                </Label>
                                <Input
                                    id="value"
                                    type="number"
                                    min={formData.type === 'percentage' ? 1 : 0}
                                    max={formData.type === 'percentage' ? 100 : undefined}
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <Label>Applicable Plans *</Label>
                            <div className="flex gap-4 mt-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="trial"
                                        checked={formData.applicablePlans.includes('trial')}
                                        onCheckedChange={() => handlePlanToggle('trial')}
                                    />
                                    <label htmlFor="trial" className="text-sm cursor-pointer">
                                        Trial Plan
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="paid"
                                        checked={formData.applicablePlans.includes('paid')}
                                        onCheckedChange={() => handlePlanToggle('paid')}
                                    />
                                    <label htmlFor="paid" className="text-sm cursor-pointer">
                                        Paid Plan
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                            <Input
                                id="expiryDate"
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label htmlFor="usageLimit">Usage Limit (Optional)</Label>
                            <Input
                                id="usageLimit"
                                type="number"
                                min="1"
                                placeholder="Leave empty for unlimited"
                                value={formData.usageLimit.total}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    usageLimit: { ...formData.usageLimit, total: e.target.value }
                                })}
                            />
                            <div className="flex items-center space-x-2 mt-2">
                                <Checkbox
                                    id="perUser"
                                    checked={formData.usageLimit.perUser}
                                    onCheckedChange={(checked) => setFormData({
                                        ...formData,
                                        usageLimit: { ...formData.usageLimit, perUser: checked }
                                    })}
                                />
                                <label htmlFor="perUser" className="text-sm cursor-pointer">
                                    Per user limit (instead of global)
                                </label>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Input
                                id="description"
                                placeholder="Internal notes about this coupon"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Create Coupon</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Usage History Dialog */}
            <Dialog open={showUsageDialog} onOpenChange={setShowUsageDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Usage History - {selectedCoupon?.code}</DialogTitle>
                        <DialogDescription>
                            Total uses: {selectedCoupon?.usedCount}
                            {selectedCoupon?.usageLimit.total && ` / ${selectedCoupon.usageLimit.total}`}
                        </DialogDescription>
                    </DialogHeader>

                    {usageHistory.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No usage history yet
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3">User</th>
                                        <th className="text-left p-3">Company</th>
                                        <th className="text-left p-3">Plan</th>
                                        <th className="text-left p-3">Discount</th>
                                        <th className="text-left p-3">Final Amount</th>
                                        <th className="text-left p-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usageHistory.map((usage) => (
                                        <tr key={usage._id} className="border-b">
                                            <td className="p-3">
                                                {usage.userId?.fullName || 'N/A'}
                                                <br />
                                                <span className="text-xs text-muted-foreground">
                                                    {usage.userId?.email}
                                                </span>
                                            </td>
                                            <td className="p-3">{usage.companyId?.name || 'N/A'}</td>
                                            <td className="p-3 uppercase">{usage.planId}</td>
                                            <td className="p-3 text-green-600">-₹{usage.discountAmount}</td>
                                            <td className="p-3 font-bold">₹{usage.finalAmount}</td>
                                            <td className="p-3">
                                                {new Date(usage.appliedAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
