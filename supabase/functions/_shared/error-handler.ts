export class SecureError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public publicMessage?: string
  ) {
    super(message);
    this.name = 'SecureError';
  }
}

export function sanitizeError(error: any): { 
  message: string; 
  requestId: string;
  statusCode: number;
} {
  const requestId = crypto.randomUUID();
  
  // Log complet server-side (pour debugging)
  console.error('[SECURE_ERROR]', {
    requestId,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Map vers messages génériques pour clients
  let publicMessage = 'An error occurred';
  let statusCode = 500;

  if (error instanceof SecureError) {
    publicMessage = error.publicMessage || error.message;
    statusCode = error.statusCode;
  } else if (error.message?.includes('authorization') || 
             error.message?.includes('auth')) {
    publicMessage = 'Authentication required';
    statusCode = 401;
  } else if (error.message?.includes('Invalid') || 
             error.message?.includes('validation')) {
    publicMessage = 'Invalid request parameters';
    statusCode = 400;
  } else if (error.message?.includes('not found')) {
    publicMessage = 'Resource not found';
    statusCode = 404;
  } else if (error.message?.includes('rate limit') ||
             error.message?.includes('too many')) {
    publicMessage = 'Too many requests';
    statusCode = 429;
  }

  return {
    message: publicMessage,
    requestId,
    statusCode
  };
}

export function errorResponse(error: any, headers: Record<string, string> = {}) {
  const sanitized = sanitizeError(error);
  
  return new Response(
    JSON.stringify({
      error: sanitized.message,
      requestId: sanitized.requestId
    }),
    {
      status: sanitized.statusCode,
      headers: { 'Content-Type': 'application/json', ...headers }
    }
  );
}
