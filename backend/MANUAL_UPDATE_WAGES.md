# Backend Manual Update Required

## File: `backend/routes/accounting.js`

The wages calculator needs to be updated to support Direct Mode. Due to file complexity, please manually apply this change:

### Location: Lines 332-382 (wages/calculate endpoint)

**Find this section:**
```javascript
        // Get company wages per bag
        const company = await Company.findById(companyId);
        const wagesPerBag = company?.wagesPerBag || 0;

        // Get deliveries in (purchase orders)
        const deliveriesIn = await DeliveryIn.find({
```

**Replace with:**
```javascript
        // Get company wages per bag and delivery mode
        const company = await Company.findById(companyId);
        const wagesPerBag = company?.wagesPerBag || 0;
        const deliveryMode = company?.deliveryMode || 'order_based';

        let bagsReceived = 0;
        let bagsDelivered = 0;

        if (deliveryMode === 'direct') {
            // Direct Mode: Use DirectPurchase and DirectSale
            const DirectPurchase = (await import('../models/DirectPurchase.js')).default;
            const DirectSale = (await import('../models/DirectSale.js')).default;

            const directPurchases = await DirectPurchase.find({
                companyId,
                purchaseDate: { $gte: startOfDay, $lte: endOfDay },
                purchaseStatus: 'completed'
            }).lean();

            bagsReceived = directPurchases.reduce((sum, purchase) => {
                return sum + purchase.items.reduce((itemSum, item) => {
                    return itemSum + (item.quantity || 0);
                }, 0);
            }, 0);

            const directSales = await DirectSale.find({
                companyId,
                saleDate: { $gte: startOfDay, $lte: endOfDay },
                saleStatus: 'completed'
            }).lean();

            bagsDelivered = directSales.reduce((sum, sale) => {
                return sum + sale.items.reduce((itemSum, item) => {
                    return itemSum + (item.quantity || 0);
                }, 0);
            }, 0);
        } else {
            // Order-Based Mode: Use existing DeliveryIn and DeliveryOut
            const deliveriesIn = await DeliveryIn.find({
```

**Also update the response (around line 374):**
```javascript
        res.json({
            date,
            deliveryMode,  // ADD THIS LINE
            bagsReceived,
            bagsMoved,
            bagsDelivered,
            totalBags,
            wagesPerBag,
            totalWages
        });
```

This makes the wages calculator mode-aware, using DirectSale/DirectPurchase in Direct Mode and DeliveryIn/DeliveryOut in Order-Based Mode.
