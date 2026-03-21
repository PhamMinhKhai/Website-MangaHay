/**
 * Sanitizes a filename by removing or replacing characters that may cause issues
 * on different operating systems or in ZIP archives.
 * 
 * @param {string} filename - The filename to sanitize
 * @returns {string} - The sanitized filename
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'download';
  }

  return filename
    // Remove path traversal attempts
    .replace(/\.\./g, '')
    // Remove or replace invalid characters for Windows/Linux/Mac
    // Invalid: < > : " / \ | ? * and control characters (0-31)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    // Remove leading/trailing spaces and dots
    .trim()
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Limit length to 200 characters (leaving room for extension)
    .substring(0, 200)
    // If empty after sanitization, use default
    || 'download';
}

module.exports = { sanitizeFilename };
