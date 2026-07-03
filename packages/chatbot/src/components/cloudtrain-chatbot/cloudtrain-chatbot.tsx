import { Component, Element, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { cn } from '../../utils/utils';
import Button from './/button';
import X from './x';
import Avatar from './avatar';
import ChatBubble from './chat-bubble';
import ChatFooter from './chat-footer';
import ChatHeader from './chat-header';
import { Input } from './input';
import { marked } from 'marked';
import { ClickOutside } from 'stencil-click-outside';
import { CloudTrain, StreamReveal } from '@cloudtrain/sdk';

type Message = {
  content: string;
  role: 'ai' | 'user';
  isError?: boolean;
};

export type PreChatField = {
  /** Key used in the captured data + merged into `meta`. */
  name: string;
  /** Visible label shown above/in the input. */
  label: string;
  /** Input type. Defaults to `text`. */
  type?: 'text' | 'email' | 'tel';
  /** Whether the field must be filled to submit. Defaults to `false`. */
  required?: boolean;
  /** Optional placeholder text. */
  placeholder?: string;
};

export type CapturedLead = Record<string, string>;

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
    open: 'pointer-events-auto opacity-100 scale-100 translate-y-0',
    closed: 'pointer-events-none opacity-0 scale-95 translate-y-8',
  },
};

@Component({
  tag: 'cloudtrain-chatbot',
  styleUrl: 'cloudtrain-chatbot.css',
  shadow: true,
})
export class CloudTrainChatbot {
  @Element() private hostEl!: HTMLElement;
  @Prop() apiKey!: string;
  @Prop() baseUrl: string = 'https://cloudtrain.ai';
  @Prop() chatSuggestions: string[] = [];
  @Prop() theme: 'light' | 'dark' | 'system' = 'system';
  @Prop() meta: Object = {};
  @Prop() hideBranding: boolean = false;
  @Prop() botName?: string;
  @Prop() avatarUrl?: string;
  @Prop() welcomeMessage: string = 'How can I help you today?';
  @Prop() welcomeSubtitle?: string;
  @Prop() position: 'bottom-right' | 'bottom-left' = 'bottom-right';
  /**
   * Milliseconds between each character reveal in the streaming animation.
   * `0` (default) shows characters as fast as they arrive from the network.
   * A positive value (e.g. `20`) produces a typewriter effect.
   */
  @Prop() revealDelayMs: number = 0;
  /**
   * If true, the chat panel opens automatically when the chatbot mounts.
   * Useful for demos, onboarding flows, or pages where engagement is desired.
   */
  @Prop() defaultOpen: boolean = false;
  /**
   * Persist the conversation in localStorage so it survives page reloads
   * and navigations. Set to `false` to disable persistence entirely.
   */
  @Prop() persistConversation: boolean = true;
  /**
   * How long (in hours) to keep a persisted conversation before discarding
   * on next load. Defaults to 7 days. Pass `0` to keep indefinitely.
   */
  @Prop() persistTtlHours: number = 24 * 7;
  /**
   * Override the localStorage key used to persist the conversation.
   * Defaults to `cloudtrain-chat:<apiKey-suffix>` for per-agent isolation.
   */
  @Prop() persistStorageKey?: string;
  /**
   * If true, gate the conversation behind a pre-chat form. Captured values
   * are merged into `meta` so the AI sees the lead's context. Requires
   * `preChatFields` to be non-empty — otherwise this flag is a no-op.
   */
  @Prop() requirePreChat: boolean = false;
  /**
   * Field configuration for the pre-chat lead-capture form. Each field
   * renders as an input; required fields must be filled to submit.
   *
   * Example: [{ name: 'email', label: 'Your email', type: 'email', required: true }]
   */
  @Prop() preChatFields: PreChatField[] = [];

  /** Fired when the chat panel opens. */
  @Event({ eventName: 'chatOpened' }) chatOpened!: EventEmitter<void>;
  /** Fired when the chat panel closes. */
  @Event({ eventName: 'chatClosed' }) chatClosed!: EventEmitter<void>;
  /** Fired when the user submits a message. Detail: the message text. */
  @Event({ eventName: 'messageSent' }) messageSent!: EventEmitter<{ text: string }>;
  /** Fired when a complete AI reply has finished streaming. Detail: the final text. */
  @Event({ eventName: 'messageReceived' }) messageReceived!: EventEmitter<{ text: string }>;
  /** Fired when the user resets the conversation. */
  @Event({ eventName: 'conversationReset' }) conversationReset!: EventEmitter<void>;
  /** Fired when an error happens during send/stream. Detail: error message. */
  @Event({ eventName: 'errorOccurred' }) errorOccurred!: EventEmitter<{ message: string }>;
  /** Fired when the pre-chat lead form is submitted. Detail: the captured field values. */
  @Event({ eventName: 'leadCaptured' }) leadCaptured!: EventEmitter<CapturedLead>;

  @State() activeTheme: 'light' | 'dark' = 'light';
  @State() private fetchedName: string | null = null;
  @State() private fetchedAvatar: string | null = null;
  @State() private fabAvatarLoaded = false;

  private client!: CloudTrain;
  @State() private isOpen = false;
  @State() private hasOpenedOnce = false;
  @State() private isAtBottom = false;
  @State() private isScrollable = false;
  @State() private isLoading = false;
  @State() private isStreaming = false;
  @State() private announcement = '';
  @State() private input: string = '';
  @State() private messages: Message[] = [];
  @State() private confirmingReset = false;
  @State() private capturedLead: CapturedLead | null = null;
  @State() private preChatValues: CapturedLead = {};
  @State() private preChatError: string | null = null;

  private messagesRef: HTMLDivElement | null = null;
  private inputRef: HTMLInputElement | null = null;
  private panelRef: HTMLDivElement | null = null;
  private abortController: AbortController | null = null;
  private savedScrollY = 0;
  private originalBodyStyles: {
    overflow: string;
    position: string;
    top: string;
    left: string;
    right: string;
    width: string;
  } | null = null;

  private getTheme(theme: 'light' | 'dark' | 'system') {
    return theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
  }

  private get storageKey(): string {
    return this.persistStorageKey ?? 'cloudtrain-chat';
  }

  private loadPersisted(): { messages: Message[]; lead: CapturedLead | null } | null {
    if (!this.persistConversation || typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        v?: number;
        savedAt?: number;
        messages?: Message[];
        lead?: CapturedLead;
      };
      if ((parsed.v !== 1 && parsed.v !== 2) || !Array.isArray(parsed.messages)) {
        return null;
      }
      if (this.persistTtlHours > 0 && typeof parsed.savedAt === 'number') {
        const ageMs = Date.now() - parsed.savedAt;
        if (ageMs > this.persistTtlHours * 60 * 60 * 1000) {
          window.localStorage.removeItem(this.storageKey);
          return null;
        }
      }
      const lead = parsed.v === 2 && parsed.lead && typeof parsed.lead === 'object' ? parsed.lead : null;
      return { messages: parsed.messages, lead };
    } catch {
      return null;
    }
  }

  private persist(messages: Message[], lead: CapturedLead | null): void {
    if (!this.persistConversation || typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      if (messages.length === 0 && !lead) {
        window.localStorage.removeItem(this.storageKey);
        return;
      }
      window.localStorage.setItem(
        this.storageKey,
        JSON.stringify({ v: 2, savedAt: Date.now(), messages, lead: lead ?? undefined }),
      );
    } catch {
      // Quota exceeded, storage disabled, etc. — fail silently.
    }
  }

  private persistMessages(messages: Message[]): void {
    this.persist(messages, this.capturedLead);
  }

  private get effectiveMeta(): Record<string, unknown> {
    const base = this.meta as Record<string, unknown>;
    return this.capturedLead ? { ...base, ...this.capturedLead } : base;
  }

  private get isPreChatBlocking(): boolean {
    return this.requirePreChat
      && this.preChatFields.length > 0
      && !this.capturedLead;
  }

  componentWillLoad() {
    this.activeTheme = this.getTheme(this.theme);
    this.client = new CloudTrain({ apiKey: this.apiKey, baseUrl: this.baseUrl });
    // Only fetch agent metadata if at least one of name/avatar isn't already
    // provided via props — the API call is purely to fill in the missing piece.
    if (!this.botName || !this.avatarUrl) {
      this.loadAgent();
    }
    const persisted = this.loadPersisted();
    if (persisted) {
      if (persisted.messages.length > 0) this.messages = persisted.messages;
      if (persisted.lead) this.capturedLead = persisted.lead;
    }
    if (this.defaultOpen) {
      // Defer to after first render so the open transition plays.
      setTimeout(() => {
        if (!this.isOpen) this.toggleChat();
      }, 0);
    }
  }

  connectedCallback() {
    document.addEventListener('keydown', this.handleKeydown);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.handleKeydown);
    window.visualViewport?.removeEventListener('resize', this.handleViewportChange);
    window.visualViewport?.removeEventListener('scroll', this.handleViewportChange);
    if (this.originalBodyStyles) this.unlockBodyScroll();
  }

  private handleViewportChange = () => {
    if (!this.isOpen || !this.panelRef) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    this.panelRef.style.setProperty('--ct-kb-inset', `${inset}px`);
  };

  private preventOutsideTouch = (e: TouchEvent) => {
    const target = e.target as Node;
    if (this.messagesRef && this.messagesRef.contains(target)) return;
    e.preventDefault();
  };

  private lockBodyScroll() {
    if (this.originalBodyStyles) return;
    this.savedScrollY = window.scrollY;
    const s = document.body.style;
    this.originalBodyStyles = {
      overflow: s.overflow,
      position: s.position,
      top: s.top,
      left: s.left,
      right: s.right,
      width: s.width,
    };
    s.overflow = 'hidden';
    s.position = 'fixed';
    s.top = `-${this.savedScrollY}px`;
    s.left = '0';
    s.right = '0';
    s.width = '100%';
    document.addEventListener('touchmove', this.preventOutsideTouch, { passive: false });
  }

  private unlockBodyScroll() {
    document.removeEventListener('touchmove', this.preventOutsideTouch);
    if (!this.originalBodyStyles) return;
    const s = document.body.style;
    s.overflow = this.originalBodyStyles.overflow;
    s.position = this.originalBodyStyles.position;
    s.top = this.originalBodyStyles.top;
    s.left = this.originalBodyStyles.left;
    s.right = this.originalBodyStyles.right;
    s.width = this.originalBodyStyles.width;
    this.originalBodyStyles = null;
    window.scrollTo(0, this.savedScrollY);
  }

  private handleKeydown = (e: KeyboardEvent) => {
    if (!this.isOpen) return;
    if (e.key === 'Escape') {
      if (this.confirmingReset) {
        this.confirmingReset = false;
      } else {
        this.toggleChat();
      }
      return;
    }
    if (e.key === 'Tab' && this.panelRef) {
      const focusables = Array.from(
        this.panelRef.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = this.hostEl.shadowRoot?.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  private loadAgent = async () => {
    try {
      const agent = await this.client.getAgent();
      this.fetchedName = agent.name;
      this.fetchedAvatar = agent.logo;
    } catch {
      // Endpoint not available (e.g. non-CloudTrain backend) — fall back to props/defaults
    }
  };

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
    if (this.isOpen) {
      this.hasOpenedOnce = true;
      this.lockBodyScroll();
      window.visualViewport?.addEventListener('resize', this.handleViewportChange);
      window.visualViewport?.addEventListener('scroll', this.handleViewportChange);
      requestAnimationFrame(() => this.handleViewportChange());
      setTimeout(() => {
        try {
          this.inputRef?.focus({ preventScroll: true });
        } catch {
          this.inputRef?.focus();
        }
      }, 350);
      this.chatOpened.emit();
    } else {
      window.visualViewport?.removeEventListener('resize', this.handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', this.handleViewportChange);
      if (this.panelRef) this.panelRef.style.removeProperty('--ct-kb-inset');
      this.unlockBodyScroll();
      this.chatClosed.emit();
    }
  };

  private handleScroll = () => {
    if (!this.messagesRef) return;
    const { scrollTop, scrollHeight, clientHeight } = this.messagesRef;
    this.isAtBottom = scrollTop + clientHeight >= scrollHeight - 2;
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

  private requestReset = () => {
    if (this.messages.length === 0) return;
    this.confirmingReset = true;
  };

  private cancelReset = () => {
    this.confirmingReset = false;
  };

  private confirmReset = () => {
    this.confirmingReset = false;
    if (this.isStreaming && this.abortController) {
      this.abortController.abort();
    }
    this.messages = [];
    this.input = '';
    this.capturedLead = null;
    this.preChatValues = {};
    this.preChatError = null;
    this.persist([], null);
    setTimeout(() => this.inputRef?.focus(), 0);
    this.conversationReset.emit();
  };

  private updatePreChatField = (name: string, value: string) => {
    this.preChatValues = { ...this.preChatValues, [name]: value };
    if (this.preChatError) this.preChatError = null;
  };

  private submitPreChat = (e: Event) => {
    e.preventDefault();
    const missing = this.preChatFields
      .filter((f) => f.required && !(this.preChatValues[f.name] ?? '').trim())
      .map((f) => f.label);
    if (missing.length > 0) {
      this.preChatError = `Please fill in: ${missing.join(', ')}`;
      return;
    }
    const captured: CapturedLead = {};
    for (const field of this.preChatFields) {
      const v = (this.preChatValues[field.name] ?? '').trim();
      if (v) captured[field.name] = v;
    }
    this.capturedLead = captured;
    this.preChatError = null;
    this.persist(this.messages, captured);
    this.leadCaptured.emit(captured);
    setTimeout(() => this.inputRef?.focus(), 50);
  };

  private retryLastMessage = () => {
    if (this.isStreaming) return;
    const lastUserIdx = this.messages.map(m => m.role).lastIndexOf('user');
    if (lastUserIdx === -1) return;
    const lastUserContent = this.messages[lastUserIdx].content;
    this.messages = this.messages.slice(0, lastUserIdx);
    this.sendMessage(lastUserContent);
  };

  private upsertAiMessage = (content: string) => {
    const last = this.messages[this.messages.length - 1];
    if (last?.role === 'ai') {
      this.messages = [...this.messages.slice(0, -1), { role: 'ai', content }];
    } else {
      this.messages = [...this.messages, { role: 'ai', content }];
    }
  };

  private sendMessage = async (message: string) => {
    this.abortController = new AbortController();
    const controller = this.abortController;
    const reveal = new StreamReveal({
      signal: controller.signal,
      charDelayMs: this.revealDelayMs,
      onUpdate: (text) => {
        if (this.isLoading) this.isLoading = false;
        this.upsertAiMessage(marked.parse(text, { async: false }) as string);
        this.scrollToBottom();
      },
    });
    try {
      this.isLoading = true;
      this.isStreaming = true;
      this.messages = [...this.messages, { content: message, role: 'user' }];
      this.scrollToBottom();
      this.messageSent.emit({ text: message });

      const messages = this.messages.map((m) => ({
        role: (m.role === 'ai' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: m.content,
      }));

      await this.client.chatStream({
        messages,
        meta: this.effectiveMeta,
        signal: controller.signal,
        onChunk: (chunk) => reveal.feed(chunk),
        onComplete: () => reveal.complete(),
      });
      await reveal.done;
      this.announcement = reveal.text;
      this.persistMessages(this.messages);
      this.messageReceived.emit({ text: reveal.text });
    } catch (error) {
      reveal.abort();
      const isAbort =
        controller.signal.aborted ||
        (error instanceof DOMException && error.name === 'AbortError');
      if (!isAbort) {
        const last = this.messages[this.messages.length - 1];
        if (last?.role === 'ai') {
          this.messages = this.messages.slice(0, -1);
        }
        this.messages = [...this.messages, { role: 'ai', content: 'Something went wrong.', isError: true }];
        this.announcement = 'Something went wrong.';
        this.scrollToBottom();
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        this.errorOccurred.emit({ message: errMessage });
      }
    } finally {
      this.isLoading = false;
      this.isStreaming = false;
      this.abortController = null;
    }
  };

  private onSubmit = (e: Event) => {
    e.preventDefault();
    if (this.isStreaming && this.abortController) {
      this.abortController.abort();
    }
    const message = this.input;
    this.input = '';
    this.sendMessage(message);
  };

  private stopStreaming = () => {
    if (this.abortController) this.abortController.abort();
  };

  private startChatWithSuggestion = (suggestion: string) => {
    this.input = suggestion;
    this.onSubmit(new window.Event('submit'));
  };

  private get displayName(): string {
    return this.botName ?? this.fetchedName ?? 'AI Assistant';
  }

  private get displayAvatar(): string | null {
    return this.avatarUrl ?? this.fetchedAvatar ?? null;
  }

  render() {
    const inputForm = (
      <form
        onSubmit={this.onSubmit}
        class="w-full relative rounded-lg border bg-background transition-shadow focus-within:ring-2 focus-within:ring-ring/40"
      >
        <Input
          ref={el => (this.inputRef = el ?? null)}
          value={this.input}
          onInput={e => (this.input = (e.target as HTMLTextAreaElement).value)}
          placeholder="Type your message here..."
          class="max-h-12 pl-4 pr-14 py-3 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 w-full flex items-center h-16 min-h-12 resize-none rounded-lg border-0 focus:outline-0"
        />
        <Button
          variant={!this.input && !this.isStreaming ? 'ghost' : 'default'}
          disabled={!this.input && !this.isStreaming}
          type={this.isStreaming && !this.input ? 'button' : 'submit'}
          onClick={this.isStreaming && !this.input ? this.stopStreaming : undefined}
          aria-label={this.isStreaming && !this.input ? 'Stop generating' : 'Send message'}
          class="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 p-0 rounded-full transition-colors"
        >
          {this.isStreaming && !this.input ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
              <rect x="6" y="6" width="12" height="12" rx="1.5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="size-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          )}
        </Button>
      </form>
    );

    return (
      <Host data-theme={cn(this.activeTheme === 'dark' && 'dark')}>
        <div class={`fixed ${chatConfig.positions[this.position]} z-50`}>
          <div
            ref={el => (this.panelRef = el ?? null)}
            aria-hidden={this.isOpen ? 'false' : 'true'}
            class={cn(
              'flex flex-col bg-background border sm:rounded-lg shadow-md overflow-hidden transition-all duration-500 ease-out sm:absolute sm:w-[90vw] sm:h-[80vh] fixed inset-0 w-full sm:inset-auto',
              chatConfig.chatPositions[this.position],
              chatConfig.dimensions['md'],
              this.isOpen ? chatConfig.states.open : chatConfig.states.closed,
            )}
          >
            <ChatHeader
              botName={this.displayName}
              avatarUrl={this.displayAvatar}
              onClose={this.toggleChat}
              onReset={this.messages.length > 0 ? this.requestReset : undefined}
            />
            <div class="sr-only" aria-live="polite" aria-atomic="true">{this.announcement}</div>
            {this.messages.length ? (
              <div class="flex flex-col flex-1 min-h-0 relative">
                <div class="flex flex-col w-full flex-1 min-h-0 p-4 gap-6 overflow-y-auto overscroll-contain" ref={elm => (this.messagesRef = elm ?? null)} onScroll={this.handleScroll}>
                  {this.messages.map((message, idx) => (
                    <ChatBubble message={message} onRetry={idx === this.messages.length - 1 ? this.retryLastMessage : undefined} />
                  ))}
                  {this.isLoading && (
                    <ChatBubble
                      message={{
                        content: '',
                        role: 'ai',
                      }}
                      isLoading
                      avatar={{ src: this.displayAvatar, alt: this.displayName }}
                    />
                  )}
                </div>
                {this.isScrollable && !this.isAtBottom && !this.isStreaming && (
                  <div class="absolute bottom-25 left-1/2 transform -translate-x-1/2 z-99">
                    <Button variant="default" onClick={this.scrollToBottom} class="rounded-full h-7.5 w-7.5 p-1 border border-border flex justify-center items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </Button>
                  </div>
                )}
                <div
                  class="px-4 py-4 shrink-0"
                  style={{ paddingBottom: 'max(var(--ct-kb-inset, 0px), env(safe-area-inset-bottom), 1rem)' }}
                >
                  {inputForm}
                </div>
                <ChatFooter hideBranding={this.hideBranding} />
              </div>
            ) : this.isPreChatBlocking ? (
              <div class="flex flex-col flex-1 min-h-0">
                <form
                  onSubmit={this.submitPreChat}
                  class="flex-1 min-h-0 flex flex-col items-stretch justify-start gap-4 px-4 pt-8 pb-4 overflow-y-auto overscroll-contain"
                >
                  <div class="flex flex-col items-center gap-3">
                    <Avatar src={this.displayAvatar} alt={this.displayName} size="lg" />
                    <div class="text-center space-y-1">
                      <h4 class="text-[16px] font-semibold">{this.welcomeMessage}</h4>
                      <p class="text-sm text-muted-foreground">
                        {this.welcomeSubtitle ?? 'Tell us a bit about you to get started.'}
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-col gap-3">
                    {this.preChatFields.map((field) => (
                      <label key={field.name} class="flex flex-col gap-1 text-sm">
                        <span class="font-medium">
                          {field.label}
                          {field.required && <span class="text-destructive ml-1" aria-hidden="true">*</span>}
                        </span>
                        <Input
                          type={field.type ?? 'text'}
                          name={field.name}
                          value={this.preChatValues[field.name] ?? ''}
                          required={field.required}
                          placeholder={field.placeholder}
                          onInput={(e: Event) =>
                            this.updatePreChatField(field.name, (e.target as HTMLInputElement).value)
                          }
                          class="h-10 min-h-0 px-3 py-2 rounded-md border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </label>
                    ))}
                    {this.preChatError && (
                      <p class="text-sm text-destructive" role="alert">{this.preChatError}</p>
                    )}
                  </div>
                  <Button type="submit" variant="default" class="self-stretch h-10 rounded-md">
                    Continue
                  </Button>
                </form>
                <ChatFooter hideBranding={this.hideBranding} />
              </div>
            ) : (
              <div class="flex flex-col flex-1 min-h-0">
                <div class="flex-1 min-h-0 flex flex-col items-center justify-start gap-5 px-4 pt-10 pb-4 overflow-y-auto overscroll-contain">
                  <Avatar src={this.displayAvatar} alt={this.displayName} size="lg" />
                  <div class="text-center space-y-1">
                    <h4 class="text-[16px] font-semibold">{this.welcomeMessage}</h4>
                    <p class="text-sm text-muted-foreground">
                      {this.welcomeSubtitle ?? (this.chatSuggestions.length > 0 ? 'Ask me anything or try a suggestion below.' : 'Ask me anything to get started.')}
                    </p>
                  </div>
                  {this.chatSuggestions.length > 0 && (
                    <div class="w-full overflow-x-auto scroll-hidden">
                      <div class="flex items-center justify-start gap-2 sm:gap-3 whitespace-nowrap">
                        {this.chatSuggestions.map((suggestion, index) => (
                          <Button
                            variant="outline"
                            key={index}
                            onClick={() => this.startChatWithSuggestion(suggestion)}
                            class="rounded-full px-4 border-border bg-accent/40 hover:bg-accent hover:-translate-y-0.5 transition-all duration-200"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div
                  class="px-4 pb-4 shrink-0"
                  style={{ paddingBottom: 'max(var(--ct-kb-inset, 0px), env(safe-area-inset-bottom), 1rem)' }}
                >
                  {inputForm}
                </div>
                <ChatFooter hideBranding={this.hideBranding} />
              </div>
            )}
            {this.confirmingReset && (
              <div
                class="ct-confirm-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ct-confirm-title"
                onClick={this.cancelReset}
              >
                <div class="ct-confirm-dialog" onClick={(e: MouseEvent) => e.stopPropagation()}>
                  <h4 id="ct-confirm-title" class="ct-confirm-title">Start a new conversation?</h4>
                  <p class="ct-confirm-desc">Your current messages will be cleared.</p>
                  <div class="ct-confirm-actions">
                    <Button variant="outline" onClick={this.cancelReset}>Cancel</Button>
                    <Button variant="default" onClick={this.confirmReset}>New chat</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Button
            variant="default"
            onClick={this.toggleChat}
            class={cn(
              'w-14 h-14 p-0 rounded-full overflow-hidden items-center justify-center text-message-icon transition-transform duration-200 hover:scale-105 active:scale-95',
              !this.hasOpenedOnce && !this.isOpen && 'ct-fab-pulse',
              this.isOpen ? 'hidden! sm:flex!' : 'flex',
            )}
            aria-label={this.isOpen ? 'Close chat' : 'Open chat'}
          >
            {this.isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <div class="relative w-full h-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-6! w-8!">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                  />
                </svg>
                {this.displayAvatar && (
                  <img
                    src={this.displayAvatar}
                    alt={this.displayName}
                    onLoad={() => (this.fabAvatarLoaded = true)}
                    class={cn(
                      'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
                      this.fabAvatarLoaded ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                )}
              </div>
            )}
          </Button>
        </div>
      </Host>
    );
  }
}
