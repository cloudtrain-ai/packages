import { Fragment, h } from '@stencil/core';
import { cn } from '../../utils/utils';
import { cva } from 'class-variance-authority';
import MessageLoading from './message-loading';
import Avatar from './avatar';
import Button from './button';

const chatBubbleVariant = cva('flex gap-2 max-w-[80%] items-end relative group', {
  variants: {
    variant: {
      received: 'self-start',
      sent: 'self-end flex-row-reverse',
    },
  },
  defaultVariants: {
    variant: 'received',
  },
});

const chatBubbleMessageVariants = cva('px-3 py-2', {
  variants: {
    variant: {
      received: 'bg-accent text-foreground rounded-r-lg rounded-tl-lg text-left',
      sent: 'bg-primary text-primary-foreground rounded-l-lg rounded-tr-lg text-left',
    },
  },
  defaultVariants: {
    variant: 'received',
  },
});

type Props = {
  message: { content: string; role: 'user' | 'ai'; isError?: boolean };
  isLoading?: boolean;
  avatar?: { src?: string | null; alt: string };
  onRetry?: () => void;
};

const ChatBubble = ({ message, isLoading = false, avatar, onRetry }: Props) => {
  const showAvatar = isLoading && message.role === 'ai' && !!avatar;
  return (
    <div class={cn(chatBubbleVariant({ variant: message.role === 'user' ? 'sent' : 'received' }), 'relative group')}>
      {showAvatar && <Avatar src={avatar!.src} alt={avatar!.alt} size="sm" />}
      <div class="flex flex-col gap-1.5 max-w-full">
        <div
          class={cn(
            chatBubbleMessageVariants({ variant: message.role === 'user' ? 'sent' : 'received' }),
            'break-words max-w-full',
            message.isError && 'bg-red-500/10 text-red-500 border border-red-500/30 italic',
          )}
        >
          {isLoading ? (
            <div class="flex items-center space-x-2">
              <MessageLoading />
            </div>
          ) : (
            <Fragment>
              {message.role === 'ai' ? (
                <div
                  class="text-sm leading-relaxed
                    [&>p]:mb-2 [&>p:last-child]:mb-0
                    [&>ul]:pl-4 [&>ul]:mb-2 [&>ul]:list-disc
                    [&>ol]:pl-4 [&>ol]:mb-2 [&>ol]:list-decimal
                    [&_a]:underline [&_a]:underline-offset-2 [&_a]:font-medium
                    [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-background/60 [&_code]:text-[0.85em] [&_code]:font-mono
                    [&>pre]:bg-background/60 [&>pre]:p-3 [&>pre]:rounded-md [&>pre]:overflow-x-auto [&>pre]:my-2 [&>pre]:text-[0.85em]
                    [&>pre_code]:p-0 [&>pre_code]:bg-transparent [&>pre_code]:text-[1em]
                    [&>blockquote]:border-l-2 [&>blockquote]:border-border [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>blockquote]:my-2
                    [&>h1]:text-base [&>h1]:font-semibold [&>h1]:mt-2 [&>h1]:mb-1
                    [&>h2]:text-base [&>h2]:font-semibold [&>h2]:mt-2 [&>h2]:mb-1
                    [&>h3]:font-semibold [&>h3]:mt-2 [&>h3]:mb-1
                    [&>hr]:my-2 [&>hr]:border-border"
                  innerHTML={message.content}
                ></div>
              ) : (
                <div class="text-sm">{message.content}</div>
              )}
            </Fragment>
          )}
        </div>
        {message.isError && !isLoading && onRetry && (
          <div class="flex items-center gap-1">
            <Button variant="outline" class="size-7" onClick={onRetry} aria-label="Try again">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
