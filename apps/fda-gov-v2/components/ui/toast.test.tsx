import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast';

// Mock hasPointerCapture which is missing in jsdom
beforeAll(() => {
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = () => false;
  }
});

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
    act(() => {
      renderToast(
        <>
          <ToastTitle>Title</ToastTitle>
          <ToastDescription>Description</ToastDescription>
        </>
      );
    });

    expect(screen.getAllByRole('status')[0]).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders toast with action button', async () => {
    const handleAction = jest.fn();
    
    act(() => {
      renderToast(
        <>
          <ToastTitle>Title</ToastTitle>
          <ToastDescription>Description</ToastDescription>
          <ToastAction altText="Action" onClick={handleAction}>
            Action
          </ToastAction>
        </>
      );
    });

    const actionButton = screen.getByRole('button', { name: 'Action' });
    expect(actionButton).toBeInTheDocument();

    // Mock the click event instead of using userEvent
    act(() => {
      actionButton.click();
    });
    
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders toast with close button', async () => {
    const handleClose = jest.fn();
    
    act(() => {
      renderToast(
        <>
          <ToastTitle>Title</ToastTitle>
          <ToastClose onClick={handleClose} aria-label="Close" />
        </>
      );
    });

    const closeButton = screen.getByRole('button', { name: 'Close' });
    expect(closeButton).toBeInTheDocument();

    // Mock the click event instead of using userEvent
    act(() => {
      closeButton.click();
    });
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders toast with different variants', () => {
    let rerender: ReturnType<typeof render>['rerender'];
    
    act(() => {
      const result = render(
        <ToastProvider>
          <Toast variant="default">
            <ToastTitle>Default Toast</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      rerender = result.rerender;
    });

    expect(screen.getAllByRole('status')[0]).toHaveClass('border bg-background text-foreground');

    act(() => {
      rerender(
        <ToastProvider>
          <Toast variant="destructive">
            <ToastTitle>Destructive Toast</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
    });

    expect(screen.getAllByRole('status')[0]).toHaveClass('destructive group border-destructive bg-destructive text-destructive-foreground');
  });

  it('renders toast viewport with correct positioning', () => {
    const className = "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]";
    
    act(() => {
      render(
        <ToastProvider>
          <ToastViewport className={className} />
        </ToastProvider>
      );
    });
    
    const viewport = screen.getByRole('region');
    expect(viewport).toHaveClass(className);
  });

  it('handles long content gracefully', () => {
    act(() => {
      renderToast(
        <>
          <ToastTitle>{'Very '.repeat(20) + 'Long Title'}</ToastTitle>
          <ToastDescription>{'Very '.repeat(50) + 'Long Description'}</ToastDescription>
        </>
      );
    });

    const toast = screen.getAllByRole('status')[0];
    expect(toast).toBeInTheDocument();
    // Toast should maintain its structure even with long content
    expect(toast).toHaveClass('group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all');
  });

  it('applies custom className correctly', () => {
    act(() => {
      renderToast(
        <ToastTitle className="custom-class">Title</ToastTitle>
      );
    });

    expect(screen.getByText('Title')).toHaveClass('custom-class');
  });
}); 