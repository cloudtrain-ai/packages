import React, { forwardRef } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { SendIcon, StopIcon } from '../icons';
import type { Theme } from '../theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isStreaming: boolean;
  theme: Theme;
};

export const ChatInput = forwardRef<TextInput, Props>(
  ({ value, onChange, onSubmit, onStop, isStreaming, theme }, ref) => {
    const showStop = isStreaming && !value;
    const canSend = !!value;

    return (
      <View style={[styles.container, { borderColor: theme.border, backgroundColor: theme.background }]}>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChange}
          onSubmitEditing={() => canSend && onSubmit()}
          placeholder="Type your message here..."
          placeholderTextColor={theme.mutedForeground}
          style={[styles.input, { color: theme.foreground }]}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <Pressable
          onPress={showStop ? onStop : onSubmit}
          disabled={!showStop && !canSend}
          accessibilityLabel={showStop ? 'Stop generating' : 'Send message'}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor:
                showStop || canSend ? theme.primary : 'transparent',
              opacity: pressed ? 0.8 : !showStop && !canSend ? 0.4 : 1,
            },
          ]}
        >
          {showStop ? (
            <StopIcon size={16} color={theme.primaryForeground} />
          ) : (
            <SendIcon size={16} color={canSend ? theme.primaryForeground : theme.mutedForeground} />
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
    paddingLeft: 16,
    paddingRight: 6,
    height: 52,
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
