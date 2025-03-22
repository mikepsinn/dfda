import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signIn } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import SignInForm from './signin-form';
import { act } from 'react-dom/test-utils';

// Mock next-auth signIn
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(() => Promise.resolve({ error: null })),
}));

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

describe('SignInForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email sign-in form and provider buttons', () => {
    render(<SignInForm />);

    // Check if email input and submit button are present
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with email/i })).toBeInTheDocument();

    // Check if provider buttons are present
    expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
  });

  it('handles email submission correctly', async () => {
    const mockToast = jest.fn();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    const user = userEvent.setup();

    render(<SignInForm />);

    // Fill in email
    const emailInput = screen.getByPlaceholderText('name@example.com');
    await user.type(emailInput, 'test@example.com');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /sign in with email/i });
    
    await act(async () => {
      await user.click(submitButton);
    });

    // Check if signIn was called with correct params
    expect(signIn).toHaveBeenCalledWith('email', {
      email: 'test@example.com',
      redirect: false,
    });

    // Check if success toast was shown
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Check your email',
        description: 'We sent you a login link. Be sure to check your spam too.',
      });
    });
  });

  it('handles invalid email submission', async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    // Fill in invalid email
    const emailInput = screen.getByPlaceholderText('name@example.com');
    await user.type(emailInput, 'invalid-email');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /sign in with email/i });
    await user.click(submitButton);

    // Form should not be submitted due to HTML5 validation
    expect(signIn).not.toHaveBeenCalled();
  });

  it('handles OAuth provider clicks', async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    // Click GitHub button
    const githubButton = screen.getByRole('button', { name: /github/i });
    await act(async () => {
      await user.click(githubButton);
    });

    // Check if signIn was called with correct provider
    expect(signIn).toHaveBeenCalledWith('github');

    // Click Google button
    const googleButton = screen.getByRole('button', { name: /google/i });
    await act(async () => {
      await user.click(googleButton);
    });

    // Check if signIn was called with correct provider
    expect(signIn).toHaveBeenCalledWith('google');
  });

  it('shows loading state during submission', async () => {
    // Mock signIn to be slow
    (signIn as jest.Mock).mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({ error: null }), 100);
    }));

    const user = userEvent.setup();
    render(<SignInForm />);

    // Fill in email
    const emailInput = screen.getByPlaceholderText('name@example.com');
    await user.type(emailInput, 'test@example.com');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /sign in with email/i });
    
    await act(async () => {
      await user.click(submitButton);
    });

    // Check if button shows loading state
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Signing in...');

    // Wait for loading state to finish
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
}); 