import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Avatar } from './avatar';
import { CloseIcon, ComposeIcon } from '../icons';
import type { Theme } from '../theme';

export const ChatHeader = ({
  botName,
  avatarUrl,
  theme,
  onClose,
  onReset,
}: {
  botName: string;
  avatarUrl?: string | null;
  theme: Theme;
  onClose: () => void;
  onReset?: () => void;
}) => {
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={styles.left}>
        <Avatar src={avatarUrl} size="sm" theme={theme} />
        <View>
          <Text style={[styles.name, { color: theme.foreground }]} numberOfLines={1}>
            {botName}
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={[styles.status, { color: theme.mutedForeground }]}>Online</Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        {onReset && (
          <Pressable
            onPress={onReset}
            accessibilityLabel="New conversation"
            style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: theme.accent }]}
          >
            <ComposeIcon size={20} color={theme.foreground} />
          </Pressable>
        )}
        <Pressable
          onPress={onClose}
          accessibilityLabel="Close chat"
          style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: theme.accent }]}
        >
          <CloseIcon size={20} color={theme.foreground} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  name: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  status: { fontSize: 12, lineHeight: 14 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 6, borderRadius: 999, opacity: 0.85 },
});
