import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast';

describe('Toast Components', () => {
  const renderToast = (children: React.ReactNode) => {
    return render(
      <ToastProvider>
        <Toast>
          {children}
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
  };

  it('renders basic toast correctly', () => {
    renderToast(
      <>
        <ToastTitle>Title</ToastTitle>
        <ToastDescription>Description</ToastDescription>
      </>
    );

    expect(screen.getAllByRole('status')[0]).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders toast with action button', async () => {
    const handleAction = jest.fn();
    const user = userEvent.setup();

    renderToast(
      <>
        <ToastTitle>Title</ToastTitle>
        <ToastDescription>Description</ToastDescription>
        <ToastAction altText="Action" onClick={handleAction}>
          Action
        </ToastAction>
      </>
    );

    const actionButton = screen.getByRole('button', { name: 'Action' });
    expect(actionButton).toBeInTheDocument();

    await user.click(actionButton);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders toast with close button', async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup();

    renderToast(
      <>
        <ToastTitle>Title</ToastTitle>
        <ToastClose onClick={handleClose} aria-label="Close" />
      </>
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    expect(closeButton).toBeInTheDocument();

    await user.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders toast with different variants', () => {
    const { rerender } = render(
      <ToastProvider>
        <Toast variant="default">
          <ToastTitle>Default Toast</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    expect(screen.getAllByRole('status')[0]).toHaveClass('border bg-background text-foreground');

    rerender(
      <ToastProvider>
        <Toast variant="destructive">
          <ToastTitle>Destructive Toast</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    expect(screen.getAllByRole('status')[0]).toHaveClass('destructive group border-destructive bg-destructive text-destructive-foreground');
  });

  it('renders toast viewport with correct positioning', () => {
    render(
      <ToastProvider>
        <ToastViewport />
      </ToastProvider>
    );
    const viewport = screen.getByRole('region');
    
    expect(viewport).toHaveClass('fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]');
  });

  it('handles long content gracefully', () => {
    renderToast(
      <>
        <ToastTitle>{'Very '.repeat(20) + 'Long Title'}</ToastTitle>
        <ToastDescription>{'Very '.repeat(50) + 'Long Description'}</ToastDescription>
      </>
    );

    const toast = screen.getAllByRole('status')[0];
    expect(toast).toBeInTheDocument();
    // Toast should maintain its structure even with long content
    expect(toast).toHaveClass('group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all');
  });

  it('applies custom className correctly', () => {
    renderToast(
      <ToastTitle className="custom-class">Title</ToastTitle>
    );

    expect(screen.getByText('Title')).toHaveClass('custom-class');
  });
}); 