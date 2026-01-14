import { useState, useEffect } from 'react';

// Simple rate limiter for form submissions
const rateLimiter = {
  limits: new Map(),
  
  // Check if action is allowed
  checkLimit(key, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    const record = this.limits.get(key) || { attempts: [], blocked: false };
    
    // Remove old attempts outside the time window
    record.attempts = record.attempts.filter(time => now - time < windowMs);
    
    // Check if blocked
    if (record.blocked && record.blockUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: Math.ceil((record.blockUntil - now) / 1000),
      };
    }
    
    // Check if limit exceeded
    if (record.attempts.length >= maxAttempts) {
      record.blocked = true;
      record.blockUntil = now + windowMs;
      this.limits.set(key, record);
      return {
        allowed: false,
        remaining: 0,
        resetIn: Math.ceil(windowMs / 1000),
      };
    }
    
    // Add current attempt
    record.attempts.push(now);
    record.blocked = false;
    this.limits.set(key, record);
    
    return {
      allowed: true,
      remaining: maxAttempts - record.attempts.length,
      resetIn: Math.ceil(windowMs / 1000),
    };
  },
  
  // Reset limit for a key
  reset(key) {
    this.limits.delete(key);
  },
  
  // Clear all limits
  clearAll() {
    this.limits.clear();
  },
};

// React hook for rate limiting
export const useRateLimit = (key, maxAttempts = 5, windowMs = 60000) => {
  const [status, setStatus] = useState({
    allowed: true,
    remaining: maxAttempts,
    resetIn: 0,
  });
  
  const checkLimit = () => {
    const result = rateLimiter.checkLimit(key, maxAttempts, windowMs);
    setStatus(result);
    return result.allowed;
  };
  
  const reset = () => {
    rateLimiter.reset(key);
    setStatus({
      allowed: true,
      remaining: maxAttempts,
      resetIn: 0,
    });
  };
  
  return { ...status, checkLimit, reset };
};

// HOC for rate-limited components
export const withRateLimit = (Component, config = {}) => {
  return (props) => {
    const {
      key = 'default',
      maxAttempts = 5,
      windowMs = 60000,
    } = config;
    
    const rateLimit = useRateLimit(key, maxAttempts, windowMs);
    
    return <Component {...props} rateLimit={rateLimit} />;
  };
};

export default rateLimiter;
