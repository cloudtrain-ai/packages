import { h } from '@stencil/core';
import { cn } from '../../utils/utils';
import { JSXBase } from '@stencil/core/internal';

const Input = (props: JSXBase.InputHTMLAttributes<HTMLInputElement>) => {
  const { class: className, ref, ...rest } = props;
  return (
    <input
      class={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-background dark:bg-background-dark dark:border-input-dark px-3 py-2 ring-offset-background dark:ring-offset-background-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark disabled:cursor-not-allowed disabled:opacity-50 text-base md:text-sm',
        className,
      )}
      ref={ref}
      {...rest}
    />
  );
};

export { Input };
