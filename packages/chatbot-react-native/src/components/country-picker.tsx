import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { flagEmoji, phoneCountriesByName, PHONE_COUNTRIES } from '@cloudtrain/sdk';
import type { Theme } from '../theme';

/** The device's language, where the engine can say it; Hermes may not. */
const deviceLocale = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return undefined;
  }
})();

type Props = {
  /** ISO 3166 alpha-2, or undefined until one is picked. */
  value: string | undefined;
  onChange: (code: string) => void;
  theme: Theme;
  disabled?: boolean;
};

/**
 * The country beside a phone field: a button showing 🇯🇲 +1 that opens a
 * searchable list. Only the country is chosen here - the number is checked
 * by the server, which reads it as this country's when it has no code.
 */
export function CountryPicker({ value, onChange, theme, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const countries = useMemo(() => phoneCountriesByName(deviceLocale), []);
  const selected = value ? PHONE_COUNTRIES.find((c) => c.code === value) : undefined;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, '');
    if (!q) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(q) || c.dial.startsWith(q) || c.code.toLowerCase() === q);
  }, [countries, query]);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={selected ? `Country, +${selected.dial}` : 'Choose a country'}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.button, { borderColor: theme.border, backgroundColor: theme.background }]}
      >
        <Text style={[styles.buttonText, { color: theme.foreground }]}>
          {selected ? `${flagEmoji(selected.code)} +${selected.dial}` : 'Country'}
        </Text>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search countries"
              placeholderTextColor={theme.mutedForeground}
              autoFocus
              autoCorrect={false}
              style={[styles.search, { color: theme.foreground, borderColor: theme.border }]}
            />
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} hitSlop={8}>
              <Text style={[styles.cancel, { color: theme.foreground }]}>Cancel</Text>
            </Pressable>
          </View>
          <FlatList
            data={shown}
            keyExtractor={(c) => c.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onChange(item.code);
                  setOpen(false);
                  setQuery('');
                }}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.accent }]}
              >
                <Text style={[styles.rowText, { color: theme.foreground }]}>
                  {item.flag}  {item.name}
                </Text>
                <Text style={[styles.rowDial, { color: theme.mutedForeground }]}>+{item.dial}</Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 76,
  },
  buttonText: {
    fontSize: 14,
  },
  sheet: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  search: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 15,
  },
  cancel: {
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowText: {
    fontSize: 15,
    flexShrink: 1,
  },
  rowDial: {
    fontSize: 15,
    marginLeft: 12,
  },
});
