import { h } from '@stencil/core';
import { type JSXBase, type VNode } from '@stencil/core/internal';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background dark:ring-offset-background-dark transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring dark:focus-visible:ring-ring-dark focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary dark:bg-primary-dark text-primary-foreground dark:text-primary-foreground-dark hover:bg-primary/90 dark:hover:bg-primary-dark/90',
        outline:
          'border border-input dark:border-input-dark bg-background dark:bg-background-dark hover:bg-accent dark:hover:bg-accent-dark hover:text-accent-foreground dark:hover:text-accent-foreground-dark text-primary dark:text-primary-dark',
        ghost: 'hover:bg-accent dark:hover:bg-accent-dark hover:text-accent-foreground dark:hover:text-accent-foreground-dark',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonProps = JSXBase.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

const Button = (props: ButtonProps, children: VNode) => {
  const { class: className, variant, size } = props;
  return (
    <button {...props} class={cn(buttonVariants({ variant, size, className }))}>
      {children}
    </button>
  );
};

export default Button;
