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

type Attachment = { name: string; kind: 'image' | 'audio' | 'document' };

type Props = {
  message: { content: string; role: 'user' | 'ai'; isError?: boolean; attachments?: Attachment[] };
  isLoading?: boolean;
  avatar?: { src?: string | null; alt: string };
  onRetry?: () => void;
};

const AttachmentIcon = ({ kind }: { kind: Attachment['kind'] }) => {
  if (kind === 'image') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="size-3.5 shrink-0">
        <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
    );
  }
  if (kind === 'audio') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="size-3.5 shrink-0">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="size-3.5 shrink-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
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
              {message.attachments && message.attachments.length > 0 && (
                <div class={cn('flex flex-col gap-1', message.content && 'mb-1.5')}>
                  {message.attachments.map((att) => (
                    <div class="inline-flex items-center gap-2 rounded-md bg-background/20 px-2 py-1 text-xs max-w-full">
                      <AttachmentIcon kind={att.kind} />
                      <span class="truncate">{att.name}</span>
                    </div>
                  ))}
                </div>
              )}
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
                message.content && <div class="text-sm">{message.content}</div>
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
