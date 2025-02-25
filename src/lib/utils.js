/**
 * Calculate hours worked based on containers filled and container norm
 * @param {number} containersFilled - Number of containers filled
 * @param {number} containerNorm - Container norm (containers per 8-hour day)
 * @returns {number} - Hours worked
 */
export function calculateHoursFromContainers(containersFilled, containerNorm = 8) {
  if (!containersFilled || containersFilled <= 0 || !containerNorm || containerNorm <= 0) {
    return 0;
  }
  
  // Calculate total hours based on containers and container norm
  // Formula: (containers / norm) * 8 hours
  const totalHours = (containersFilled / containerNorm) * 8;
  
  // Round to 2 decimal places
  return Math.round(totalHours * 100) / 100;
} 