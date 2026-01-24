import { StyleSheet, Text as RNText, type TextProps } from 'react-native';

import { Theme } from '@/constants/theme';

export type { TextProps };

export function Text({ style, ...rest }: TextProps) {
  return <RNText style={[styles.base, style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Theme.fonts.regular,
  },
});
