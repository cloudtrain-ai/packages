import React, { forwardRef } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { PaperclipIcon, SendIcon, StopIcon } from '../icons';
import type { Theme } from '../theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isStreaming: boolean;
  theme: Theme;
  /** Overrides derived-from-value send-enabled state (e.g. ready attachments). */
  canSend?: boolean;
  onPickFile?: () => void;
  attachDisabled?: boolean;
};

export const ChatInput = forwardRef<TextInput, Props>(
  ({ value, onChange, onSubmit, onStop, isStreaming, theme, canSend, onPickFile, attachDisabled }, ref) => {
    const derivedCanSend = canSend ?? !!value;
    const showStop = isStreaming && !derivedCanSend;

    return (
      <View style={[styles.container, { borderColor: theme.border, backgroundColor: theme.background }]}>
        {onPickFile && (
          <Pressable
            onPress={onPickFile}
            disabled={attachDisabled}
            accessibilityLabel="Attach files"
            style={({ pressed }) => [
              styles.attachBtn,
              { opacity: attachDisabled ? 0.4 : pressed ? 0.7 : 1 },
            ]}
          >
            <PaperclipIcon size={18} color={theme.mutedForeground} />
          </Pressable>
        )}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChange}
          onSubmitEditing={() => derivedCanSend && onSubmit()}
          placeholder="Type your message here..."
          placeholderTextColor={theme.mutedForeground}
          style={[styles.input, { color: theme.foreground }]}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <Pressable
          onPress={showStop ? onStop : onSubmit}
          disabled={!showStop && !derivedCanSend}
          accessibilityLabel={showStop ? 'Stop generating' : 'Send message'}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor:
                showStop || derivedCanSend ? theme.primary : 'transparent',
              opacity: pressed ? 0.8 : !showStop && !derivedCanSend ? 0.4 : 1,
            },
          ]}
        >
          {showStop ? (
            <StopIcon size={16} color={theme.primaryForeground} />
          ) : (
            <SendIcon size={16} color={derivedCanSend ? theme.primaryForeground : theme.mutedForeground} />
          )}
        </Pressable>
      </View>
    );
  },
);

ChatInput.displayName = 'ChatInput';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 8,
    paddingRight: 6,
    height: 52,
  },
  attachBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  input: { flex: 1, fontSize: 14, paddingVertical: 0 },
  button: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});
