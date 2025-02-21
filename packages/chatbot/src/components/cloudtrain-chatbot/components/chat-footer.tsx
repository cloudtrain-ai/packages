import { h } from '@stencil/core';

const ChatFooter = () => {
  return (
    <div class="pb-4 dark:bg-black">
      <div class="text-center text-sm text-gray-500 dark:bg-black">
        Powered by{' '}
        <a href="https://cloudtrain.ai" class="cursor-pointer" target="_blank" rel="noopener noreferrer">
          <b>CloudTrain</b>
        </a>
      </div>
    </div>
  );
};

export default ChatFooter;
