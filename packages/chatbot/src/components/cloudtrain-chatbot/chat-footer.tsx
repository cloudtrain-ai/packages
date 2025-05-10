import { h } from '@stencil/core';

const ChatFooter = () => {
  return (
    <div class="pb-4">
      <div class="text-center text-sm">
        Powered by{' '}
        <a href="https://cloudtrain.ai" class="hover:cursor-pointer text-primary font-bold" target="_blank" rel="noopener noreferrer">
          <b>CloudTrain</b>
        </a>
      </div>
    </div>
  );
};

export default ChatFooter;
