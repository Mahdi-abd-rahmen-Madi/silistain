// Simple HTML and SQL injection prevention
const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>?/gm, '');
  
  // Remove common SQL injection patterns
  const sqlInjectionPatterns = [
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)/gi,
    /(--|\/\*|\*\/|;|\\\\)/g
  ];
  
  sqlInjectionPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim();
};

export const validateContactForm = (data: {
  name: string;
  email: string;
  message: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  const { name, email, message } = data;

  // Validate name
  if (!name || name.trim() === '') {
    errors.name = 'Name is required';
  } else if (name.length > 100) {
    errors.name = 'Name must be less than 100 characters';
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(email)) {
    errors.email = 'Please enter a valid email address';
  } else if (email.length > 255) {
    errors.email = 'Email must be less than 255 characters';
  }

  // Validate message
  if (!message || message.trim() === '') {
    errors.message = 'Message is required';
  } else if (message.length > 500) {
    errors.message = 'Message must be less than 500 characters';
  }

  // Sanitize all inputs
  if (name) data.name = sanitizeInput(name);
  if (email) data.email = sanitizeInput(email);
  if (message) data.message = sanitizeInput(message);

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
