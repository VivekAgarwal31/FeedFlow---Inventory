/**
 * Load Razorpay checkout script dynamically
 * @returns {Promise<boolean>} True if script loaded successfully
 */
export const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        // Check if already loaded
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

/**
 * Open Razorpay payment modal
 * @param {Object} options - Razorpay options
 * @param {string} options.keyId - Razorpay key ID
 * @param {string} options.orderId - Order ID from backend
 * @param {number} options.amount - Amount in rupees
 * @param {string} options.currency - Currency code (INR)
 * @param {string} options.name - Company/App name
 * @param {string} options.description - Payment description
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onFailure - Failure callback
 */
export const openRazorpayCheckout = (options) => {
    const {
        keyId,
        orderId,
        amount,
        currency = 'INR',
        name = 'Stockwise',
        description = 'Plan Upgrade',
        onSuccess,
        onFailure
    } = options;

    const razorpayOptions = {
        key: keyId,
        amount: amount * 100, // Convert to paise
        currency,
        name,
        description,
        order_id: orderId,
        handler: function (response) {
            // Payment successful
            if (onSuccess) {
                onSuccess({
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature
                });
            }
        },
        modal: {
            ondismiss: function () {
                // Payment cancelled
                if (onFailure) {
                    onFailure(new Error('Payment cancelled by user'));
                }
            }
        },
        theme: {
            color: '#3b82f6'
        }
    };

    const razorpay = new window.Razorpay(razorpayOptions);
    razorpay.on('payment.failed', function (response) {
        // Payment failed
        if (onFailure) {
            onFailure(new Error(response.error.description || 'Payment failed'));
        }
    });

    razorpay.open();
};
