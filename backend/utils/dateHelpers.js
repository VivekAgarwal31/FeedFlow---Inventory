/**
 * Date utility functions for weekly reports
 */

/**
 * Get the date range for last week (Monday to Sunday)
 * @returns {Object} { startDate, endDate }
 */
export const getLastWeekRange = () => {
    const now = new Date();

    // Get last Monday
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - now.getDay() - 6); // Go back to last Monday
    lastMonday.setHours(0, 0, 0, 0);

    // Get last Sunday
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);

    return {
        startDate: lastMonday,
        endDate: lastSunday
    };
};

/**
 * Format date range for display
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {String} "Jan 1 – Jan 7, 2026"
 */
export const formatDateRange = (startDate, endDate) => {
    const options = { month: 'short', day: 'numeric' };
    const start = startDate.toLocaleDateString('en-US', options);
    const end = endDate.toLocaleDateString('en-US', options);
    const year = endDate.getFullYear();

    return `${start} – ${end}, ${year}`;
};

/**
 * Get daily breakdown for the week
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Array} Array of dates for each day
 */
export const getDailyBreakdown = (startDate, endDate) => {
    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    return days;
};

/**
 * Get day name from date
 * @param {Date} date 
 * @returns {String} "Mon", "Tue", etc.
 */
export const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
};

/**
 * Format date for filename
 * @param {Date} date 
 * @returns {String} "2026-01-10"
 */
export const formatDateForFilename = (date) => {
    return date.toISOString().split('T')[0];
};
