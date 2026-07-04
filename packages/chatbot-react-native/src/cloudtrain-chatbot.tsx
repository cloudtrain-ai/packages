import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Image,
  TextInput,
  Linking,
  useColorScheme,
  Appearance,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaProvider, initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Renders children inside a View that respects the device safe area.
 * Lives inside our Modal's own SafeAreaProvider so it works even when the
 * host app does not wrap its tree in a SafeAreaProvider.
 */
const SafePanelView = ({
  backgroundColor,
  children,
}: {
  backgroundColor: string;
  children: React.ReactNode;
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      {children}
    </View>
  );
};
import { CloudTrain, StreamReveal, type Agent } from '@cloudtrain/sdk';

// Try to use expo/fetch (streaming-capable) when available — RN's default fetch
// does not expose `response.body` as a ReadableStream. Falls back gracefully
// for bare React Native or other environments.
let streamingFetch: typeof fetch | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const m: any = require('expo/fetch');
  const candidate = m?.fetch ?? m?.default?.fetch ?? m?.default ?? m;
  streamingFetch = typeof candidate === 'function' ? (candidate as typeof fetch) : undefined;
} catch {
  streamingFetch = undefined;
}

// Try to use @react-native-async-storage/async-storage for conversation
// persistence. Optional peer dep — if not installed, persistence silently no-ops.
type AsyncStorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};
let asyncStorage: AsyncStorageLike | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const m: any = require('@react-native-async-storage/async-storage');
  const candidate = m?.default ?? m;
  if (candidate && typeof candidate.getItem === 'function') {
    asyncStorage = candidate as AsyncStorageLike;
  }
} catch {
  asyncStorage = undefined;
}

/**
 * RFC 4122 v4 UUID. Uses `crypto.randomUUID` when available (Hermes on
 * RN 0.74+, Node, browsers); falls back to a Math.random-based generator
 * for older runtimes. The server treats the id as opaque — collision
 * risk is negligible (2^122 space) and cross-agent isolation is enforced
 * by a unique constraint on (connection_id, conversation_id).
 */
function generateConversationId(): string {
  const c: { randomUUID?: () => string } | undefined = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof c?.randomUUID === 'function') return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
import { ChatHeader } from './components/chat-header';
import { ChatBubble, type Message } from './components/chat-bubble';
import { ChatInput } from './components/chat-input';
import { ChatIcon } from './icons';
import { darkTheme, lightTheme, mergeTheme, type Theme } from './theme';

export type PreChatField = {
  /** Key used in the captured data + merged into `meta`. */
  name: string;
  /** Visible label shown above the input. */
  label: string;
  /** Input type. Defaults to `default`. */
  type?: 'default' | 'email-address' | 'phone-pad';
  /** Whether the field must be filled to submit. Defaults to `false`. */
  required?: boolean;
  /** Optional placeholder text. */
  placeholder?: string;
};

type CapturedLead = Record<string, string>;

export type CloudtrainChatbotProps = {
  apiKey: string;
  baseUrl?: string;
  chatSuggestions?: string[];
  theme?: 'light' | 'dark' | 'system';
  themeOverride?: Partial<Theme>;
  meta?: Record<string, unknown>;
  hideBranding?: boolean;
  botName?: string;
  avatarUrl?: string;
  welcomeMessage?: string;
  welcomeSubtitle?: string;
  position?: 'bottom-right' | 'bottom-left';
  /** Called when a chat request fails (excluding user-initiated aborts). */
  onError?: (error: unknown) => void;
  /** Called when the chat panel opens. */
  onChatOpened?: () => void;
  /** Called when the chat panel closes. */
  onChatClosed?: () => void;
  /** Called when the user submits a message. */
  onMessageSent?: (event: { text: string }) => void;
  /** Called when a complete AI reply has finished streaming. */
  onMessageReceived?: (event: { text: string }) => void;
  /** Called when the user resets the conversation. */
  onConversationReset?: () => void;
  /** Called when the user submits the pre-chat form. Receives the captured field values. */
  onLeadCaptured?: (lead: CapturedLead) => void;
  /**
   * If true, gate the conversation behind a pre-chat form. Captured values
   * are merged into `meta` so the AI sees the lead's context. Requires
   * `preChatFields` to be non-empty — otherwise this flag is a no-op.
   */
  requirePreChat?: boolean;
  /**
   * Field configuration for the pre-chat lead-capture form.
   * Example: [{ name: 'email', label: 'Your email', type: 'email-address', required: true }]
   */
  preChatFields?: PreChatField[];
  /**
   * Milliseconds between each character reveal in the streaming animation.
   * `0` (default) shows characters as fast as they arrive from the network.
   * A positive value (e.g. `20`) produces a typewriter effect.
   */
  revealDelayMs?: number;
  /**
   * If true, the chat panel opens automatically when the chatbot mounts.
   * Useful for demos, onboarding flows, or pages where engagement is desired.
   */
  defaultOpen?: boolean;
  /**
   * Persist the conversation in AsyncStorage so it survives app restarts.
   * Requires `@react-native-async-storage/async-storage` to be installed.
   * Defaults to `true`; silently no-ops if AsyncStorage is not available.
   */
  persistConversation?: boolean;
  /**
   * How long (in hours) to keep a persisted conversation before discarding
   * on next load. Defaults to 7 days. Pass `0` to keep indefinitely.
   */
  persistTtlHours?: number;
  /**
   * Override the AsyncStorage key used to persist the conversation.
   * Defaults to `cloudtrain-chat`.
   */
  persistStorageKey?: string;
};

const DEFAULT_WELCOME = 'How can I help you today?';

export const CloudtrainChatbot = (props: CloudtrainChatbotProps) => {
  const {
    apiKey,
    baseUrl,
    chatSuggestions = [],
    theme: themePref = 'system',
    themeOverride,
    meta = {},
    hideBranding = false,
    botName,
    avatarUrl,
    welcomeMessage = DEFAULT_WELCOME,
    welcomeSubtitle,
    position = 'bottom-right',
    onError,
    onChatOpened,
    onChatClosed,
    onMessageSent,
    onMessageReceived,
    onConversationReset,
    onLeadCaptured,
    requirePreChat = false,
    preChatFields = [],
    revealDelayMs = 0,
    defaultOpen = false,
    persistConversation = true,
    persistTtlHours = 24 * 7,
    persistStorageKey,
  } = props;

  const storageKey = persistStorageKey ?? 'cloudtrain-chat';
  const persistenceEnabled = persistConversation && !!asyncStorage;

  const hookScheme = useColorScheme();
  const systemScheme = hookScheme ?? Appearance.getColorScheme();
  const activeMode: 'light' | 'dark' =
    themePref === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themePref;

  const theme = useMemo(
    () => mergeTheme(activeMode === 'dark' ? darkTheme : lightTheme, themeOverride),
    [activeMode, themeOverride],
  );

  const client = useMemo(
    () => new CloudTrain({ apiKey, baseUrl, fetch: streamingFetch }),
    [apiKey, baseUrl],
  );

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(defaultOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [fetched, setFetched] = useState<Agent | null>(null);
  const [fabAvatarLoaded, setFabAvatarLoaded] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [capturedLead, setCapturedLead] = useState<CapturedLead | null>(null);
  const [preChatValues, setPreChatValues] = useState<CapturedLead>({});
  const [preChatError, setPreChatError] = useState<string | null>(null);
  // Server-side conversation identifier. Generated on mount (unless a
  // persisted one is restored); sent with every chat call. Reset rotates it.
  const [conversationId, setConversationId] = useState<string | null>(() => generateConversationId());

  const effectiveMeta = useMemo(
    () => (capturedLead ? { ...meta, ...capturedLead } : meta),
    [meta, capturedLead],
  );
  const isPreChatBlocking = requirePreChat && preChatFields.length > 0 && !capturedLead;

  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const displayName = botName ?? fetched?.name ?? 'AI Assistant';
  const displayAvatar = avatarUrl ?? fetched?.logo ?? null;

  useEffect(() => {
    // Only fetch agent metadata if at least one of name/avatar isn't already
    // provided via props — the API call is purely to fill in the missing piece.
    if (botName && avatarUrl) return;
    let cancelled = false;
    client
      .getAgent()
      .then(agent => {
        if (!cancelled) setFetched(agent);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [client, botName, avatarUrl]);

  useEffect(() => {
    if (!persistenceEnabled || !asyncStorage) return;
    let cancelled = false;
    asyncStorage
      .getItem(storageKey)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          const parsed = JSON.parse(raw) as {
            v?: number;
            savedAt?: number;
            messages?: Message[];
            lead?: CapturedLead;
            conversationId?: string;
          };
          if (parsed.v !== 1 && parsed.v !== 2 && parsed.v !== 3) return;
          if (!Array.isArray(parsed.messages)) return;
          if (persistTtlHours > 0 && typeof parsed.savedAt === 'number') {
            const ageMs = Date.now() - parsed.savedAt;
            if (ageMs > persistTtlHours * 60 * 60 * 1000) {
              asyncStorage!.removeItem(storageKey).catch(() => {});
              return;
            }
          }
          if (parsed.messages.length > 0) {
            setMessages(parsed.messages);
          }
          if ((parsed.v === 2 || parsed.v === 3) && parsed.lead && typeof parsed.lead === 'object') {
            setCapturedLead(parsed.lead);
          }
          if (parsed.v === 3 && typeof parsed.conversationId === 'string') {
            setConversationId(parsed.conversationId);
          }
        } catch {
          // Corrupt entry — leave it; next save will overwrite.
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [persistenceEnabled, storageKey, persistTtlHours]);

  const persist = (msgs: Message[], lead: CapturedLead | null, convId: string | null) => {
    if (!persistenceEnabled || !asyncStorage) return;
    if (msgs.length === 0 && !lead && !convId) {
      asyncStorage.removeItem(storageKey).catch(() => {});
      return;
    }
    asyncStorage
      .setItem(
        storageKey,
        JSON.stringify({
          v: 3,
          savedAt: Date.now(),
          messages: msgs,
          lead: lead ?? undefined,
          conversationId: convId ?? undefined,
        }),
      )
      .catch(() => {});
  };

  const persistMessages = (msgs: Message[]) => persist(msgs, capturedLead, conversationId);

  useEffect(() => {
    if (hasOpenedOnce || isOpen) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [hasOpenedOnce, isOpen, pulseAnim]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const upsertAi = (content: string, isError = false) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === 'ai') {
        return [...prev.slice(0, -1), { role: 'ai', content, isError }];
      }
      return [...prev, { role: 'ai', content, isError }];
    });
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setIsLoading(true);
      setIsStreaming(true);
      setMessages(prev => [...prev, { role: 'user', content: message }]);
      scrollToBottom();
      onMessageSent?.({ text: message });

      const apiMessages = [...messages, { role: 'user' as const, content: message }].map(m => ({
        role: (m.role === 'ai' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: m.content,
      }));

      const reveal = new StreamReveal({
        signal: controller.signal,
        charDelayMs: revealDelayMs,
        onUpdate: (text) => {
          setIsLoading(false);
          upsertAi(text);
          scrollToBottom();
        },
      });

      if (streamingFetch) {
        await client.chatStream({
          messages: apiMessages,
          meta: effectiveMeta,
          conversation_id: conversationId ?? undefined,
          signal: controller.signal,
          onChunk: (chunk) => reveal.feed(chunk),
          onComplete: () => reveal.complete(),
        });
      } else {
        // Bare RN fallback: non-streaming chat() + feed the full response
        // into StreamReveal so the char-paced animation still plays.
        const result = await client.chat({
          messages: apiMessages,
          meta: effectiveMeta,
          conversation_id: conversationId ?? undefined,
          signal: controller.signal,
        });
        reveal.feed(result.choices[0]?.message?.content ?? '');
        reveal.complete();
      }
      await reveal.done;
      persistMessages([
        ...messages,
        { role: 'user', content: message },
        { role: 'ai', content: reveal.text },
      ]);
      onMessageReceived?.({ text: reveal.text });
    } catch (error) {
      const isAbort =
        controller.signal.aborted ||
        (error as { name?: string })?.name === 'AbortError' ||
        ((error as Error)?.message ?? '').toLowerCase().includes('abort');
      if (!isAbort) {
        onError?.(error);
        setMessages(prev => {
          const last = prev[prev.length - 1];
          const base = last?.role === 'ai' ? prev.slice(0, -1) : prev;
          const next: Message[] = [...base, { role: 'ai', content: 'Something went wrong.', isError: true }];
          persistMessages(next);
          return next;
        });
        scrollToBottom();
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const onSubmit = () => {
    if (!input) return;
    if (isStreaming && abortRef.current) abortRef.current.abort();
    const msg = input;
    setInput('');
    sendMessage(msg);
  };

  const onStop = () => {
    if (abortRef.current) abortRef.current.abort();
  };

  const requestReset = () => {
    if (messages.length === 0) return;
    setConfirmingReset(true);
  };

  const cancelReset = () => setConfirmingReset(false);

  const confirmReset = () => {
    setConfirmingReset(false);
    if (isStreaming && abortRef.current) abortRef.current.abort();
    setMessages([]);
    setInput('');
    setCapturedLead(null);
    setPreChatValues({});
    setPreChatError(null);
    // Rotate the conversation id so the server starts fresh — the old
    // conversation stays in the DB but this widget stops referencing it.
    setConversationId(generateConversationId());
    persist([], null, null);
    setTimeout(() => inputRef.current?.focus(), 0);
    onConversationReset?.();
  };

  const submitPreChat = () => {
    const missing = preChatFields
      .filter((f) => f.required && !(preChatValues[f.name] ?? '').trim())
      .map((f) => f.label);
    if (missing.length > 0) {
      setPreChatError(`Please fill in: ${missing.join(', ')}`);
      return;
    }
    const captured: CapturedLead = {};
    for (const field of preChatFields) {
      const v = (preChatValues[field.name] ?? '').trim();
      if (v) captured[field.name] = v;
    }
    setCapturedLead(captured);
    setPreChatError(null);
    persist(messages, captured, conversationId);
    onLeadCaptured?.(captured);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const open = () => {
    setIsOpen(true);
    setHasOpenedOnce(true);
    setTimeout(() => inputRef.current?.focus(), 300);
    onChatOpened?.();
  };

  const close = () => {
    setIsOpen(false);
    onChatClosed?.();
  };

  const retryLastMessage = () => {
    const lastUserIdx = messages.map(m => m.role).lastIndexOf('user');
    if (lastUserIdx === -1) return;
    const content = messages[lastUserIdx].content;
    setMessages(messages.slice(0, lastUserIdx));
    sendMessage(content);
  };

  const fabPositionStyle = position === 'bottom-left' ? styles.fabLeft : styles.fabRight;
  const pulseRingStyle = {
    transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }],
    opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
  };

  return (
    <>
      <View style={[styles.fab, fabPositionStyle]} pointerEvents="box-none">
        {!hasOpenedOnce && !isOpen && (
          <Animated.View
            style={[styles.pulseRing, { backgroundColor: theme.primary }, pulseRingStyle]}
            pointerEvents="none"
          />
        )}
        <Pressable
          onPress={open}
          accessibilityLabel="Open chat"
          style={({ pressed }) => [
            styles.fabBtn,
            { backgroundColor: theme.primary, transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <ChatIcon size={28} color={theme.messageIcon} />
          {displayAvatar && (
            <Image
              source={{ uri: displayAvatar }}
              onLoad={() => setFabAvatarLoaded(true)}
              style={[StyleSheet.absoluteFill, { borderRadius: 28, opacity: fabAvatarLoaded ? 1 : 0 }]}
              resizeMode="cover"
            />
          )}
        </Pressable>
      </View>

      <Modal visible={isOpen} animationType="slide" transparent onRequestClose={close} statusBarTranslucent>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafePanelView backgroundColor={theme.background}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalRoot}
        >
          <ChatHeader
            botName={displayName}
            avatarUrl={displayAvatar}
            theme={theme}
            onClose={close}
            onReset={messages.length > 0 ? requestReset : undefined}
          />

          {messages.length === 0 && isPreChatBlocking ? (
            <ScrollView contentContainerStyle={styles.emptyContent} keyboardShouldPersistTaps="handled">
              <View style={styles.preChatInner}>
                <View style={[styles.avatarLg, { backgroundColor: theme.primary }]}>
                  {displayAvatar ? (
                    <Image source={{ uri: displayAvatar }} style={styles.avatarLg} resizeMode="cover" />
                  ) : (
                    <View style={{ transform: [{ translateY: 3 }] }}>
                      <ChatIcon size={24} color={theme.messageIcon} />
                    </View>
                  )}
                </View>
                <Text style={[styles.welcome, { color: theme.foreground }]}>{welcomeMessage}</Text>
                <Text style={[styles.welcomeSub, { color: theme.mutedForeground }]}>
                  {welcomeSubtitle ?? 'Tell us a bit about you to get started.'}
                </Text>
                <View style={styles.preChatFields}>
                  {preChatFields.map((field) => (
                    <View key={field.name} style={styles.preChatField}>
                      <Text style={[styles.preChatLabel, { color: theme.foreground }]}>
                        {field.label}
                        {field.required ? <Text style={{ color: theme.destructive }}> *</Text> : null}
                      </Text>
                      <TextInput
                        value={preChatValues[field.name] ?? ''}
                        onChangeText={(text) => {
                          setPreChatValues((prev) => ({ ...prev, [field.name]: text }));
                          if (preChatError) setPreChatError(null);
                        }}
                        placeholder={field.placeholder}
                        placeholderTextColor={theme.mutedForeground}
                        keyboardType={field.type === 'email-address' ? 'email-address' : field.type === 'phone-pad' ? 'phone-pad' : 'default'}
                        autoCapitalize={field.type === 'email-address' ? 'none' : 'sentences'}
                        style={[
                          styles.preChatInput,
                          {
                            color: theme.foreground,
                            borderColor: theme.border,
                            backgroundColor: theme.background,
                          },
                        ]}
                      />
                    </View>
                  ))}
                  {preChatError && (
                    <Text style={[styles.preChatError, { color: theme.destructive }]}>{preChatError}</Text>
                  )}
                </View>
                <Pressable
                  onPress={submitPreChat}
                  style={({ pressed }) => [
                    styles.preChatSubmit,
                    { backgroundColor: pressed ? theme.primary + 'd9' : theme.primary },
                  ]}
                >
                  <Text style={[styles.preChatSubmitText, { color: theme.primaryForeground }]}>Continue</Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : messages.length === 0 ? (
            <ScrollView contentContainerStyle={styles.emptyContent} keyboardShouldPersistTaps="handled">
              <View style={styles.emptyInner}>
                <View style={[styles.avatarLg, { backgroundColor: theme.primary }]}>
                  {displayAvatar ? (
                    <Image source={{ uri: displayAvatar }} style={styles.avatarLg} resizeMode="cover" />
                  ) : (
                    <View style={{ transform: [{ translateY: 3 }] }}>
                      <ChatIcon size={24} color={theme.messageIcon} />
                    </View>
                  )}
                </View>
                <Text style={[styles.welcome, { color: theme.foreground }]}>{welcomeMessage}</Text>
                <Text style={[styles.welcomeSub, { color: theme.mutedForeground }]}>
                  {welcomeSubtitle ??
                    (chatSuggestions.length > 0
                      ? 'Ask me anything or try a suggestion below.'
                      : 'Ask me anything to get started.')}
                </Text>
                {chatSuggestions.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestionsRow}
                    keyboardShouldPersistTaps="handled"
                  >
                    {chatSuggestions.map((s, i) => (
                      <Pressable
                        key={i}
                        onPress={() => sendMessage(s)}
                        style={({ pressed }) => [
                          styles.suggestion,
                          { borderColor: theme.border, backgroundColor: pressed ? theme.accent : theme.accent + '66' },
                        ]}
                      >
                        <Text style={[styles.suggestionText, { color: theme.foreground }]}>{s}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>
            </ScrollView>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.messagesScroll}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((m, idx) => (
                <ChatBubble
                  key={idx}
                  message={m}
                  theme={theme}
                  avatar={{ src: displayAvatar }}
                  onRetry={idx === messages.length - 1 && m.isError ? retryLastMessage : undefined}
                />
              ))}
              {isLoading && (
                <ChatBubble
                  message={{ content: '', role: 'ai' }}
                  isLoading
                  theme={theme}
                  avatar={{ src: displayAvatar }}
                />
              )}
            </ScrollView>
          )}

          <View style={styles.inputWrap}>
            {!isPreChatBlocking && (
              <ChatInput
                ref={inputRef}
                value={input}
                onChange={setInput}
                onSubmit={onSubmit}
                onStop={onStop}
                isStreaming={isStreaming}
                theme={theme}
              />
            )}
            {!hideBranding && (
              <Pressable onPress={() => Linking.openURL('https://cloudtrain.ai')}>
                <Text style={[styles.poweredBy, { color: theme.mutedForeground, borderTopColor: theme.border }]}>
                  Powered by <Text style={{ color: theme.foreground, fontWeight: '600' }}>CloudTrain</Text>
                </Text>
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
        {confirmingReset && (
          <Pressable
            onPress={cancelReset}
            accessibilityRole="button"
            accessibilityLabel="Dismiss confirmation"
            style={styles.confirmOverlay}
          >
            <Pressable
              onPress={() => {}}
              style={[
                styles.confirmDialog,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.confirmTitle, { color: theme.foreground }]}>
                Start a new conversation?
              </Text>
              <Text style={[styles.confirmDesc, { color: theme.mutedForeground }]}>
                Your current messages will be cleared.
              </Text>
              <View style={styles.confirmActions}>
                <Pressable
                  onPress={cancelReset}
                  style={({ pressed }) => [
                    styles.confirmBtn,
                    {
                      borderColor: theme.border,
                      backgroundColor: pressed ? theme.accent : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.confirmBtnText, { color: theme.foreground }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={confirmReset}
                  style={({ pressed }) => [
                    styles.confirmBtn,
                    styles.confirmBtnPrimary,
                    { backgroundColor: pressed ? theme.primary + 'd9' : theme.primary },
                  ]}
                >
                  <Text style={[styles.confirmBtnText, { color: theme.primaryForeground }]}>New chat</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        )}
        </SafePanelView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    width: 56,
    height: 56,
  },
  fabRight: { right: 20 },
  fabLeft: { left: 20 },
  fabBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  pulseRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 32,
  },
  modalRoot: { flex: 1 },
  emptyContent: { flexGrow: 1 },
  emptyInner: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
    gap: 16,
  },
  preChatInner: {
    flex: 1,
    alignItems: 'stretch',
    paddingTop: 32,
    paddingHorizontal: 16,
    gap: 16,
  },
  preChatFields: {
    gap: 12,
    marginTop: 8,
  },
  preChatField: {
    gap: 6,
  },
  preChatLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  preChatInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  preChatError: {
    fontSize: 13,
    marginTop: 4,
  },
  preChatSubmit: {
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  preChatSubmitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  avatarLg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  welcome: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  welcomeSub: { fontSize: 13, textAlign: 'center', marginTop: -8 },
  suggestionsRow: { gap: 8, paddingHorizontal: 8, marginTop: 8, alignItems: 'center' },
  suggestion: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  suggestionText: { fontSize: 13, fontWeight: '500' },
  messagesScroll: { flex: 1 },
  messagesContent: { padding: 16, gap: 16 },
  inputWrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 8 },
  poweredBy: { fontSize: 11, textAlign: 'center', paddingTop: 8, borderTopWidth: 1 },
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 100,
  },
  confirmDialog: {
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  confirmTitle: { fontSize: 15, fontWeight: '600', marginBottom: 6, textAlign: 'center' },
  confirmDesc: { fontSize: 13, marginBottom: 16, textAlign: 'center' },
  confirmActions: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  confirmBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnPrimary: { borderColor: 'transparent' },
  confirmBtnText: { fontSize: 14, fontWeight: '500' },
});

export default CloudtrainChatbot;
