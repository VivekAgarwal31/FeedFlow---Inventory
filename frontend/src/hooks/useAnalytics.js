import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook for Google Analytics 4 tracking
 * Handles SPA-safe page view tracking and event tracking
 * Only tracks on public pages (not dashboard)
 * Safely handles deferred GA4 loading
 */
export const useAnalytics = () => {
    const location = useLocation();

    useEffect(() => {
        // Only track page views on public pages (not dashboard)
        const isDashboard = location.pathname.startsWith('/dashboard') ||
            location.pathname.startsWith('/admin') ||
            location.pathname.startsWith('/company-setup');

        if (!isDashboard) {
            // Wait for gtag to be available (deferred loading)
            const trackPageView = () => {
                if (typeof window.gtag !== 'undefined') {
                    window.gtag('event', 'page_view', {
                        page_path: location.pathname + location.search,
                        page_location: window.location.href,
                        page_title: document.title
                    });
                }
            };

            // Try immediately or wait for load event
            if (typeof window.gtag !== 'undefined') {
                trackPageView();
            } else {
                window.addEventListener('load', trackPageView);
                return () => window.removeEventListener('load', trackPageView);
            }
        }
    }, [location]);
};

/**
 * Track custom events (e.g., CTA clicks)
 * @param {string} eventName - Name of the event
 * @param {object} eventParams - Additional parameters
 */
export const trackEvent = (eventName, eventParams = {}) => {
    // Queue event if gtag not ready yet
    if (typeof window.gtag !== 'undefined') {
        window.gtag('event', eventName, eventParams);
    } else {
        // Queue for when GA4 loads
        window.addEventListener('load', () => {
            if (typeof window.gtag !== 'undefined') {
                window.gtag('event', eventName, eventParams);
            }
        }, { once: true });
    }
};

/**
 * Track CTA clicks
 * @param {string} ctaName - Name of the CTA button
 * @param {string} ctaLocation - Where the CTA is located
 */
export const trackCTAClick = (ctaName, ctaLocation) => {
    trackEvent('cta_click', {
        cta_name: ctaName,
        cta_location: ctaLocation
    });
};
