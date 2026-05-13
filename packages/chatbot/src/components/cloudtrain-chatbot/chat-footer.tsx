import { h } from '@stencil/core';

const ChatFooter = ({ hideBranding = false }: { hideBranding?: boolean } = {}) => {
  if (hideBranding) return null;
  const utmSource = typeof window !== 'undefined' ? `?utm_source=${window.location.hostname}` : '';
  return (
    <div class="mx-4 pt-3 pb-4 text-center text-xs text-muted-foreground border-t border-border">
      Powered by{' '}
      <a
        href={`https://cloudtrain.ai${utmSource}`}
        class="text-foreground hover:cursor-pointer hover:underline underline-offset-2"
        target="_blank"
        rel="noopener noreferrer"
      >
        CloudTrain
      </a>
    </div>
  );
};

export default ChatFooter;
