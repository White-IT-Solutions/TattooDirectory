import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  MicroFeedback, 
  ButtonFeedback, 
  FormFeedback, 
  CardFeedback, 
  RippleButton, 
  PulseIndicator, 
  LoadingDots 
} from '../MicroFeedback';

describe('MicroFeedback Components', () => {
  describe('MicroFeedback', () => {
    it('triggers feedback on click', async () => {
      const onFeedback = jest.fn();
      const user = userEvent.setup();
      
      render(
        <MicroFeedback type="success" trigger="click" onFeedback={onFeedback}>
          <button>Click me</button>
        </MicroFeedback>
      );

      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(onFeedback).toHaveBeenCalledWith('success');
    });

    it('triggers feedback on hover', async () => {
      const onFeedback = jest.fn();
      const user = userEvent.setup();
      
      render(
        <MicroFeedback type="default" trigger="hover" onFeedback={onFeedback}>
          <div>Hover me</div>
        </MicroFeedback>
      );

      const element = screen.getByText('Hover me');
      await user.hover(element);
      
      expect(onFeedback).toHaveBeenCalledWith('default');
    });

    it('does not trigger when disabled', async () => {
      const onFeedback = jest.fn();
      const user = userEvent.setup();
      
      render(
        <MicroFeedback type="success" trigger="click" disabled onFeedback={onFeedback}>
          <button>Disabled</button>
        </MicroFeedback>
      );

      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(onFeedback).not.toHaveBeenCalled();
    });
  });

  describe('ButtonFeedback', () => {
    it('renders button with feedback wrapper', () => {
      render(
        <ButtonFeedback>
          <button>Feedback Button</button>
        </ButtonFeedback>
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('FormFeedback', () => {
    it('applies success feedback class', () => {
      const { container } = render(
        <FormFeedback success>
          <input type="text" />
        </FormFeedback>
      );
      
      expect(container.firstChild).toHaveClass('input-animated');
    });

    it('applies error feedback class', () => {
      const { container } = render(
        <FormFeedback error>
          <input type="text" />
        </FormFeedback>
      );
      
      expect(container.firstChild).toHaveClass('input-animated');
    });
  });

  describe('CardFeedback', () => {
    it('renders interactive card with animations', () => {
      const { container } = render(
        <CardFeedback>
          <div>Card content</div>
        </CardFeedback>
      );
      
      expect(container.firstChild).toHaveClass('card-animated');
    });

    it('renders non-interactive card without animations', () => {
      const { container } = render(
        <CardFeedback interactive={false}>
          <div>Static card</div>
        </CardFeedback>
      );
      
      expect(container.firstChild).not.toHaveClass('card-animated');
    });
  });

  describe('RippleButton', () => {
    it('renders button with ripple effect', async () => {
      const onClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <RippleButton onClick={onClick}>
          Ripple Button
        </RippleButton>
      );

      const button = screen.getByText('Ripple Button');
      await user.click(button);
      
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('PulseIndicator', () => {
    it('renders active pulse indicator', () => {
      const { container } = render(
        <PulseIndicator active color="primary" size="md" />
      );
      
      const indicator = container.firstChild;
      expect(indicator).toHaveClass('animate-pulse');
      expect(indicator).toHaveClass('bg-primary-500');
      expect(indicator).toHaveClass('w-3', 'h-3');
    });

    it('renders inactive indicator without pulse', () => {
      const { container } = render(
        <PulseIndicator active={false} />
      );
      
      const indicator = container.firstChild;
      expect(indicator).not.toHaveClass('animate-pulse');
    });

    it('applies different sizes correctly', () => {
      const sizes = [
        { size: 'sm', classes: ['w-2', 'h-2'] },
        { size: 'md', classes: ['w-3', 'h-3'] },
        { size: 'lg', classes: ['w-4', 'h-4'] }
      ];

      sizes.forEach(({ size, classes }) => {
        const { container, unmount } = render(
          <PulseIndicator size={size} />
        );
        
        const indicator = container.firstChild;
        classes.forEach(className => {
          expect(indicator).toHaveClass(className);
        });
        
        unmount();
      });
    });
  });

  describe('LoadingDots', () => {
    it('renders correct number of dots', () => {
      const { container } = render(
        <LoadingDots count={5} />
      );
      
      const dots = container.querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(5);
    });

    it('applies staggered animation delays', () => {
      const { container } = render(
        <LoadingDots count={3} />
      );
      
      const dots = container.querySelectorAll('.animate-bounce');
      
      // Check that each dot has the style attribute with animation delay
      expect(dots[0]).toHaveAttribute('style', expect.stringContaining('animation-delay: 0ms'));
      expect(dots[1]).toHaveAttribute('style', expect.stringContaining('animation-delay: 100ms'));
      expect(dots[2]).toHaveAttribute('style', expect.stringContaining('animation-delay: 200ms'));
    });

    it('applies different sizes correctly', () => {
      const { container } = render(
        <LoadingDots size="lg" />
      );
      
      const dots = container.querySelectorAll('.animate-bounce');
      dots.forEach(dot => {
        expect(dot).toHaveClass('w-3', 'h-3');
      });
    });
  });
});