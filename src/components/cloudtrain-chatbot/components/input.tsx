import { h } from '@stencil/core';
import { cn } from '../../../utils/utils';
import { JSXBase } from '@stencil/core/internal';

const Input = (props: JSXBase.InputHTMLAttributes<HTMLInputElement>) => {
  const { class: className, ref, ...rest } = props;
  return (
    <input
      class={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      ref={ref}
      {...rest}
    />
  );
};

export { Input };
