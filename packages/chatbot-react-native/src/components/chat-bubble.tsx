import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import Svg, { Path } from 'react-native-svg';
import { Avatar } from './avatar';
import { TypingIndicator } from './typing-indicator';
import { RefreshIcon } from '../icons';
import type { Theme } from '../theme';

export type MessageAttachment = {
  name: string;
  kind: 'image' | 'audio' | 'document';
};

export type Message = {
  content: string;
  role: 'ai' | 'user';
  isError?: boolean;
  attachments?: MessageAttachment[];
};

const AttachmentIcon = ({ kind, color }: { kind: MessageAttachment['kind']; color: string }) => {
  const d =
    kind === 'image'
      ? 'm2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z'
      : kind === 'audio'
        ? 'M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z'
        : 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z';
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d={d} />
    </Svg>
  );
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
          ) : (
            <>
              {message.attachments && message.attachments.length > 0 && (
                <View style={[styles.attachmentList, !!message.content && styles.attachmentListSpaced]}>
                  {message.attachments.map((att, i) => (
                    <View
                      key={`${att.name}-${i}`}
                      style={[
                        styles.attachmentPill,
                        { backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : theme.background },
                      ]}
                    >
                      <AttachmentIcon kind={att.kind} color={textColor} />
                      <Text
                        numberOfLines={1}
                        style={[styles.attachmentName, { color: textColor }]}
                      >
                        {att.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {message.content ? (
                isUser ? (
                  <Text style={[styles.text, { color: textColor }]}>{message.content}</Text>
                ) : message.isError ? (
                  <Text style={[styles.text, styles.errorText, { color: textColor }]}>{message.content}</Text>
                ) : (
                  <Markdown style={markdownStyles(theme)}>{message.content}</Markdown>
                )
              ) : null}
            </>
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
  attachmentList: { gap: 4 },
  attachmentListSpaced: { marginBottom: 6 },
  attachmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  attachmentName: { fontSize: 12, flexShrink: 1 },
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
