export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function sanitizeInput(input: string, maxLength = 10000): string {
  return input.trim().slice(0, maxLength);
}

export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateName(name: string): boolean {
  if (!name || name.length < 1 || name.length > 100) return false;
  // Allow letters, spaces, hyphens, apostrophes, dots
  return /^[\p{L}\p{M}\s'.\\-]+$/u.test(name);
}

export function validateMessage(message: string, minLength = 10, maxLength = 5000): boolean {
  if (!message) return false;
  const trimmed = message.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  if (password.length > 128) {
    return { valid: false, error: "Password is too long" };
  }
  return { valid: true };
}
