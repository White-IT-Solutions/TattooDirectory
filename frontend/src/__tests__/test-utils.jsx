import React from 'react';
import { render } from '@testing-library/react';
import { ToastProvider } from '../design-system/components/feedback/Toast/ToastProvider';

// Custom render function that includes providers
const AllTheProviders = ({ children }) => {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };