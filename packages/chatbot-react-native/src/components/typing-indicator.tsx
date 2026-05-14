import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import type { Theme } from '../theme';

const Dot = ({ delay, color }: { delay: number; color: string }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.delay(600 - delay),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          backgroundColor: color,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
        },
      ]}
    />
  );
};

export const TypingIndicator = ({ theme }: { theme: Theme }) => {
  return (
    <View style={styles.row}>
      <Dot delay={0} color={theme.foreground} />
      <Dot delay={150} color={theme.foreground} />
      <Dot delay={300} color={theme.foreground} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
