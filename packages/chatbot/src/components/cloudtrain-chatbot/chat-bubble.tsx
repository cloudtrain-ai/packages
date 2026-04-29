import { Fragment, h } from '@stencil/core';
import { cn } from '../../utils/utils';
import { cva } from 'class-variance-authority';
import MessageLoading from './message-loading';
//import Button from './button';

const chatBubbleVariant = cva('flex gap-2 max-w-[80%] items-end relative group', {
  variants: {
    variant: {
      received: 'self-start',
      sent: 'self-end flex-row-reverse',
    },
    layout: {
      default: '',
      ai: 'max-w-full w-full items-center',
    },
  },
  defaultVariants: {
    variant: 'received',
    layout: 'default',
  },
});

const chatBubbleMessageVariants = cva('px-2 py-1.5', {
  variants: {
    variant: {
      received: 'dark:bg-[#1f2937] bg-[#f3f4f6] dark:text-[#f9fafb] text-gray-800 rounded-r-lg rounded-tl-lg text-left',
      sent: 'bg-background rounded-l-lg rounded-tr-lg text-right',
    },
    layout: {
      default: '',
      ai: 'border-t w-full rounded-none bg-transparent',
    },
  },
  defaultVariants: {
    variant: 'received',
    layout: 'default',
  },
});

const ChatBubble = ({ message, isLoading = false }: { message: { content: string; role: 'user' | 'ai' }; isLoading?: boolean }) => {
  return (
    <div class={cn(chatBubbleVariant({ variant: message.role === 'user' ? 'sent' : 'received' }), 'relative group')}>
      {/* Message */}
      <div class={cn(chatBubbleMessageVariants({ variant: message.role === 'user' ? 'sent' : 'received' }), 'break-words max-w-full')}>
        {isLoading ? (
          <div class="flex items-center space-x-2">
            <MessageLoading />
          </div>
        ) : (
          <Fragment>
            {message.role === 'ai' ? (
              <div class="text-sm leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:pl-4 [&>ul]:mb-2 [&>ol]:pl-4 [&>ol]:mb-2" innerHTML={message.content}></div>
            ) : (
              <div class="text-sm pt-1">{message.content}</div>
            )}
          </Fragment>
        )}
        {/*isLastMessage && (
          <div class="flex items-center mt-1.5 gap-1">
            <Button variant="outline" class="size-5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"
                />
              </svg>
            </Button>
            <Button variant="outline" class="size-5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </Button>
          </div>
        )*/}
      </div>
    </div>
  );
};

export default ChatBubble;
