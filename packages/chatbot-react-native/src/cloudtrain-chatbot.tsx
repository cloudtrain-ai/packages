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
import { CloudTrain, revealStream, type Agent } from '@cloudtrain/sdk';

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
import { ChatHeader } from './components/chat-header';
import { ChatBubble, type Message } from './components/chat-bubble';
import { ChatInput } from './components/chat-input';
import { ChatIcon } from './icons';
import { darkTheme, lightTheme, mergeTheme, type Theme } from './theme';

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
  } = props;

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

  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [fetched, setFetched] = useState<Agent | null>(null);
  const [fabAvatarLoaded, setFabAvatarLoaded] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const displayName = botName ?? fetched?.name ?? 'AI Assistant';
  const displayAvatar = avatarUrl ?? fetched?.logo ?? null;

  useEffect(() => {
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
  }, [client]);

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

      const apiMessages = [...messages, { role: 'user' as const, content: message }].map(m => ({
        role: (m.role === 'ai' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: m.content,
      }));

      // Streaming is opportunistic. Module-load detection of `expo/fetch` is
      // not a guarantee that SSE streaming actually works in the consumer's
      // runtime — transitive Expo deps can resolve `expo/fetch` even in bare
      // RN apps, RN versions vary in stream support, and some fetch impls
      // expose `body` but don't stream incrementally. So we try streaming
      // first and transparently fall back to non-streaming `chat()` if the
      // stream errors before yielding any chunks. Once chunks have started
      // arriving (or the user aborted), the error surfaces normally.
      const rawStream: AsyncIterable<string> = (async function* () {
        if (streamingFetch) {
          let yieldedAny = false;
          try {
            for await (const chunk of client.chatStream({ messages: apiMessages, meta, signal: controller.signal })) {
              yieldedAny = true;
              yield chunk;
            }
            return;
          } catch (err) {
            if (yieldedAny || controller.signal.aborted) throw err;
            // eslint-disable-next-line no-console
            console.warn('[Cloudtrain] streaming failed before first chunk, falling back to non-streaming chat()', err);
          }
        }
        const result = await client.chat({ messages: apiMessages, meta, signal: controller.signal });
        yield result.choices[0]?.message?.content ?? '';
      })();

      for await (const displayed of revealStream(rawStream, { signal: controller.signal })) {
        setIsLoading(false);
        upsertAi(displayed);
        scrollToBottom();
      }
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
          return [...base, { role: 'ai', content: 'Something went wrong.', isError: true }];
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

  const onReset = () => {
    if (isStreaming && abortRef.current) abortRef.current.abort();
    setMessages([]);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const open = () => {
    setIsOpen(true);
    setHasOpenedOnce(true);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const close = () => setIsOpen(false);

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
            onReset={messages.length > 0 ? onReset : undefined}
          />

          {messages.length === 0 ? (
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
            <ChatInput
              ref={inputRef}
              value={input}
              onChange={setInput}
              onSubmit={onSubmit}
              onStop={onStop}
              isStreaming={isStreaming}
              theme={theme}
            />
            {!hideBranding && (
              <Pressable onPress={() => Linking.openURL('https://cloudtrain.ai')}>
                <Text style={[styles.poweredBy, { color: theme.mutedForeground, borderTopColor: theme.border }]}>
                  Powered by <Text style={{ color: theme.foreground, fontWeight: '600' }}>CloudTrain</Text>
                </Text>
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
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
});

export default CloudtrainChatbot;
