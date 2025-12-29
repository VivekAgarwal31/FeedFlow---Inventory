import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook for Google Analytics 4 tracking
 * Handles SPA-safe page view tracking and event tracking
 * Only tracks on public pages (not dashboard)
 */
export const useAnalytics = () => {
    const location = useLocation();

    useEffect(() => {
        // Only track page views on public pages (not dashboard)
        const isDashboard = location.pathname.startsWith('/dashboard') ||
            location.pathname.startsWith('/admin') ||
            location.pathname.startsWith('/company-setup');

        if (!isDashboard && typeof window.gtag !== 'undefined') {
            // Track page view for SPA navigation
            window.gtag('event', 'page_view', {
                page_path: location.pathname + location.search,
                page_location: window.location.href,
                page_title: document.title
            });
        }
    }, [location]);
};

/**
 * Track custom events (e.g., CTA clicks)
 * @param {string} eventName - Name of the event
 * @param {object} eventParams - Additional parameters
 */
export const trackEvent = (eventName, eventParams = {}) => {
    if (typeof window.gtag !== 'undefined') {
        window.gtag('event', eventName, eventParams);
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
