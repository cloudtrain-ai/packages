import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Avatar } from './avatar';
import { TypingIndicator } from './typing-indicator';
import { RefreshIcon } from '../icons';
import type { Theme } from '../theme';

export type Message = {
  content: string;
  role: 'ai' | 'user';
  isError?: boolean;
};

export const ChatBubble = ({
  message,
  isLoading = false,
  avatar,
  theme,
  onRetry,
}: {
  message: Message;
  isLoading?: boolean;
  avatar?: { src?: string | null };
  theme: Theme;
  onRetry?: () => void;
}) => {
  const isUser = message.role === 'user';
  const showAvatar = isLoading && !isUser && !!avatar;

  const bubbleStyle = [
    styles.bubble,
    isUser
      ? { backgroundColor: theme.primary, borderTopRightRadius: 4 }
      : { backgroundColor: theme.accent, borderTopLeftRadius: 4 },
    message.isError && {
      backgroundColor: theme.destructive + '1a',
      borderColor: theme.destructive + '4d',
      borderWidth: 1,
    },
  ];

  const textColor = message.isError
    ? theme.destructive
    : isUser
      ? theme.primaryForeground
      : theme.foreground;

  return (
    <View style={[styles.row, isUser && styles.rowRight]}>
      {showAvatar && <Avatar src={avatar?.src} size="sm" theme={theme} />}
      <View style={styles.column}>
        <View style={bubbleStyle}>
          {isLoading ? (
            <TypingIndicator theme={theme} />
          ) : isUser ? (
            <Text style={[styles.text, { color: textColor }]}>{message.content}</Text>
          ) : message.isError ? (
            <Text style={[styles.text, styles.errorText, { color: textColor }]}>{message.content}</Text>
          ) : (
            <Markdown style={markdownStyles(theme)}>{message.content}</Markdown>
          )}
        </View>
        {message.isError && !isLoading && onRetry && (
          <View style={styles.actionsRow}>
            <Pressable
              onPress={onRetry}
              accessibilityLabel="Try again"
              style={({ pressed }) => [
                styles.retryBtn,
                { borderColor: theme.border, backgroundColor: pressed ? theme.accent : 'transparent' },
              ]}
            >
              <RefreshIcon size={16} color={theme.foreground} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '85%' },
  rowRight: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  column: { flexShrink: 1, gap: 6 },
  bubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  text: { fontSize: 14, lineHeight: 20 },
  errorText: { fontStyle: 'italic' },
  actionsRow: { flexDirection: 'row', gap: 4 },
  retryBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const markdownStyles = (theme: Theme) => ({
  body: { color: theme.foreground, fontSize: 14, lineHeight: 20 },
  paragraph: { marginTop: 0, marginBottom: 8, color: theme.foreground, fontSize: 14, lineHeight: 20 },
  link: { color: theme.foreground, textDecorationLine: 'underline' as const },
  code_inline: {
    backgroundColor: theme.background,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 13,
    fontFamily: 'Menlo',
  },
  code_block: {
    backgroundColor: theme.background,
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
    fontFamily: 'Menlo',
    fontSize: 13,
  },
  fence: {
    backgroundColor: theme.background,
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
    fontFamily: 'Menlo',
    fontSize: 13,
  },
  blockquote: {
    backgroundColor: 'transparent',
    borderLeftWidth: 2,
    borderLeftColor: theme.border,
    paddingLeft: 12,
    marginVertical: 8,
    color: theme.mutedForeground,
  },
  list_item: { color: theme.foreground, marginVertical: 2 },
  heading1: { color: theme.foreground, fontSize: 16, fontWeight: '600' as const, marginVertical: 4 },
  heading2: { color: theme.foreground, fontSize: 16, fontWeight: '600' as const, marginVertical: 4 },
  heading3: { color: theme.foreground, fontSize: 15, fontWeight: '600' as const, marginVertical: 4 },
  hr: { backgroundColor: theme.border, height: 1, marginVertical: 8 },
});
