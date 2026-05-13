import { h } from '@stencil/core';
import X from './x';
import Avatar from './avatar';

type Props = {
  botName: string;
  avatarUrl?: string | null;
  onClose: () => void;
  onReset?: () => void;
};

const ChatHeader = ({ botName, avatarUrl, onClose, onReset }: Props) => {
  return (
    <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
      <div class="flex items-center gap-3 min-w-0">
        <Avatar src={avatarUrl} alt={botName} size="sm" />
        <div class="flex flex-col min-w-0">
          <span class="text-sm font-semibold leading-tight truncate">{botName}</span>
          <span class="flex items-center gap-1.5 text-xs text-muted-foreground leading-tight">
            <span class="inline-block h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
            Online
          </span>
        </div>
      </div>
      <div class="flex items-center gap-1">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            aria-label="New conversation"
            class="rounded-full p-1.5 opacity-70 hover:opacity-100 hover:bg-accent transition-[opacity,background-color] focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.862 4.487 18.549 2.799a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
            <span class="sr-only">New conversation</span>
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          class="rounded-full p-1.5 opacity-70 hover:opacity-100 hover:bg-accent transition-[opacity,background-color] focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-5 w-5" />
          <span class="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
