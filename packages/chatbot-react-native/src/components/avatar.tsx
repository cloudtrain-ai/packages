import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { ChatIcon } from '../icons';
import type { Theme } from '../theme';

type Size = 'sm' | 'lg';

const sizes: Record<Size, { box: number; icon: number }> = {
  sm: { box: 32, icon: 16 },
  lg: { box: 56, icon: 24 },
};

export const Avatar = ({
  src,
  size = 'sm',
  theme,
}: {
  src?: string | null;
  size?: Size;
  theme: Theme;
}) => {
  const { box, icon } = sizes[size];
  return (
    <View
      style={[
        styles.box,
        { width: box, height: box, borderRadius: box / 2, backgroundColor: theme.primary },
      ]}
    >
      {src ? (
        <Image source={{ uri: src }} style={{ width: box, height: box }} resizeMode="cover" />
      ) : (
        <ChatIcon size={icon} color={theme.messageIcon} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
