import { Component, Host, Prop, State, Watch, h } from '@stencil/core';
import { cn } from '../../utils/utils';
import Button from './/button';
import X from './x';
import ChatBubble from './chat-bubble';
import ChatFooter from './chat-footer';
import { Input } from './input';
import { marked } from 'marked';
import { ClickOutside } from 'stencil-click-outside';
import { CloudTrain } from '@cloudtrain/sdk';

type Message = {
  content: string;
  role: 'ai' | 'user';
};

const chatConfig = {
  dimensions: {
    sm: 'sm:max-w-sm sm:max-h-[500px]',
    md: 'sm:max-w-md sm:max-h-[600px]',
    lg: 'sm:max-w-lg sm:max-h-[700px]',
    xl: 'sm:max-w-xl sm:max-h-[800px]',
    full: 'sm:w-full sm:h-full',
  },
  positions: {
    'bottom-right': 'bottom-5 right-5',
    'bottom-left': 'bottom-5 left-5',
  },
  chatPositions: {
    'bottom-right': 'sm:bottom-[calc(100%+10px)] sm:right-0',
    'bottom-left': 'sm:bottom-[calc(100%+10px)] sm:left-0',
  },
  states: {
    open: 'pointer-events-auto opacity-100 visible scale-100 translate-y-0',
    closed: 'pointer-events-none opacity-0 invisible scale-100 sm:translate-y-5',
  },
};

@Component({
  tag: 'cloudtrain-chatbot',
  styleUrl: 'cloudtrain-chatbot.css',
  shadow: true,
})
export class CloudTrainChatbot {
  @Prop() apiKey!: string;
  @Prop() baseUrl: string = 'https://cloudtrain.ai';
  @Prop() chatSuggestions: string[] = [];
  @Prop() theme: 'light' | 'dark' | 'system' = 'system';
  @Prop() meta: Object = {};
  @State() activeTheme: 'light' | 'dark' = 'light';

  private client!: CloudTrain;
  @State() private isOpen = false;
  @State() private isAtBottom = false;
  @State() private isScrollable = false;
  @State() private isLoading = false;
  @State() private input: string = '';
  @State() private messages: Message[] = [];

  private messagesRef: HTMLDivElement | null = null;

  private getTheme(theme: 'light' | 'dark' | 'system') {
    return theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
  }

  componentWillLoad() {
    this.activeTheme = this.getTheme(this.theme);
    this.client = new CloudTrain({ apiKey: this.apiKey, baseUrl: this.baseUrl });
  }

  @Watch('theme')
  watchThemeChange(newValue: 'light' | 'dark' | 'system' = 'system') {
    this.activeTheme = this.getTheme(newValue);
  }

  @ClickOutside()
  closeOnClickOutside() {
    if (this.isOpen) {
      this.toggleChat();
    }
  }

  private toggleChat = () => {
    this.isOpen = !this.isOpen;
    document.body.style.overflow = this.isOpen ? 'hidden' : 'auto';
  };

  private handleScroll = () => {
    if (!this.messagesRef) return;
    const { scrollTop, scrollHeight, clientHeight } = this.messagesRef;
    this.isAtBottom = scrollTop + clientHeight === scrollHeight;
    this.isScrollable = scrollHeight > clientHeight;
  };

  private scrollToBottom = () => {
    if (!this.messagesRef) return;
    setTimeout(() => {
      if (!this.messagesRef) return;
      this.messagesRef.scrollTo({
        top: this.messagesRef.scrollHeight,
        behavior: 'smooth',
      });
      this.isAtBottom = true;
      this.isScrollable = false;
    }, 100);
  };

  private sendMessage = async (message: string) => {
    try {
      this.isLoading = true;
      this.messages = [...this.messages, { content: message, role: 'user' }];
      this.scrollToBottom();

      const messages = this.messages.map((m) => ({
        role: (m.role === 'ai' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: m.content,
      }));

      const stream = this.client.chatStream({ messages, meta: this.meta as Record<string, unknown> });
      let result = '';

      for await (const chunk of stream) {
        if (this.isLoading) this.isLoading = false;
        result += chunk;

        const lastMessage = this.messages[this.messages.length - 1];

        if (lastMessage.role === 'ai') {
          this.messages = [...this.messages.slice(0, -1), { role: 'ai', content: result }];
        } else {
          this.messages = [...this.messages, { role: 'ai', content: result }];
        }
        this.scrollToBottom();
      }

      const formattedResult = await marked.parse(result);
      this.messages = [...this.messages.slice(0, -1), { role: 'ai', content: formattedResult }];
    } catch (error) {
    } finally {
      this.isLoading = false;
    }
  };

  private onSubmit = (e: Event) => {
    e.preventDefault();
    this.sendMessage(this.input);
    this.input = '';
  };

  private startChatWithSuggestion = (suggestion: string) => {
    this.input = suggestion;
    this.onSubmit(new Event('submit'));
  };

  render() {
    return (
      <Host data-theme={cn(this.activeTheme === 'dark' && 'dark')}>
        <div class={`fixed ${chatConfig.positions['bottom-right']} z-50`}>
          <div
            class={cn(
              'flex flex-col bg-background border sm:rounded-lg shadow-md overflow-hidden transition-all duration-250 ease-out sm:absolute sm:w-[90vw] sm:h-[80vh] fixed inset-0 w-full h-full sm:inset-auto',
              chatConfig.chatPositions['bottom-right'],
              chatConfig.dimensions['md'],
              this.isOpen ? chatConfig.states.open : chatConfig.states.closed,
            )}
          >
            {this.messages.length ? (
              <div class="pt-8 sm:pt-0 flex flex-col justify-between h-full relative">
                <div class="flex flex-col w-full h-full p-4 gap-6 overflow-y-auto" ref={elm => (this.messagesRef = elm ?? null)} onScroll={this.handleScroll}>
                  {this.messages.map(message => (
                    <ChatBubble message={message} />
                  ))}
                  {this.isLoading && (
                    <ChatBubble
                      message={{
                        content: '',
                        role: 'ai',
                      }}
                      isLoading
                    />
                  )}
                </div>
                {/* Scroll to bottom button */}
                {this.isScrollable && !this.isAtBottom && (
                  <div class="absolute bottom-[100px] left-1/2 transform -translate-x-1/2 z-[99]">
                    <Button variant="default" onClick={this.scrollToBottom} class="rounded-full h-[30px] w-[30px] p-1 border border-border flex justify-center items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </Button>
                  </div>
                )}
                <div class="px-4 py-4">
                  <form onSubmit={this.onSubmit} class="w-full relative rounded-lg border bg-background">
                    <Input
                      value={this.input}
                      onInput={e => (this.input = (e.target as HTMLTextAreaElement).value)}
                      placeholder="Type your message here..."
                      class="max-h-12 px-4 py-3 focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full flex items-center h-16 min-h-12 resize-none rounded-lg border-0 p-3 focus:outline-0"
                    />
                    <Button
                      variant="ghost"
                      disabled={!this.input || this.isLoading}
                      type="submit"
                      class="absolute -right-1 top-1 disabled:opacity-50 hover:bg-transparent opacity-70 ring-offset-background transition-opacity hover:opacity-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 text-primary">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                        />
                      </svg>
                    </Button>
                  </form>
                </div>
                <ChatFooter />
              </div>
            ) : (
              <div class="px-4 pt-4 flex flex-col justify-end gap-4 h-full w-full relative">
                <h4 class="text-[16px] text-center">How can I help you today?</h4>

                <div class="w-full overflow-x-auto scroll-hidden">
                  <div class="flex items-center gap-2 sm:gap-6 whitespace-nowrap">
                    {this.chatSuggestions.map((suggestion, index) => (
                      <Button variant="outline" key={index} onClick={() => this.startChatWithSuggestion(suggestion)}>
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>

                <form onSubmit={this.onSubmit} class="w-full relative rounded-lg border bg-background mt-2">
                  <Input
                    value={this.input}
                    onInput={e => (this.input = (e.target as HTMLTextAreaElement).value)}
                    placeholder="Type your message here..."
                    class="max-h-12 px-4 py-3 focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full flex items-center h-16 min-h-12 resize-none rounded-lg border-0 p-3 focus:outline-0"
                  />
                  <Button
                    variant="ghost"
                    disabled={!this.input || this.isLoading}
                    type="submit"
                    class="absolute -right-1 top-1 disabled:opacity-50 hover:bg-transparent opacity-70 ring-offset-background transition-opacity hover:opacity-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 text-primary">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                  </Button>
                </form>
                <ChatFooter />
              </div>
            )}

            <button
              class="absolute right-1 top-2 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              onClick={this.toggleChat}
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
              <span class="sr-only">Close</span>
            </button>
          </div>
          <Button
            variant="default"
            onClick={this.toggleChat}
            class={cn('w-14 h-14 rounded-full items-center justify-center text-message-icon', this.isOpen ? '!hidden sm:!flex' : 'flex')}
            aria-label={this.isOpen ? 'Close chat' : 'Open chat'}
          >
            {this.isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="!h-[1.5rem] !w-[2rem]">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                />
              </svg>
            )}
          </Button>
        </div>
      </Host>
    );
  }
}
