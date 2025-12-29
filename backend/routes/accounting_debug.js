// Quick diagnostic endpoint to check journal entries
router.get('/debug/journal-entries', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        // Get last 10 journal entries
        const entries = await JournalEntry.find({ companyId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Get last 10 payments
        const payments = await Payment.find({ companyId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        res.json({
            journalEntriesCount: entries.length,
            journalEntries: entries,
            paymentsCount: payments.length,
            payments: payments
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
