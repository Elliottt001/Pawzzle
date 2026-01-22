import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Theme } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: Theme.typography.size.s16,
    lineHeight: Theme.typography.lineHeight.s24,
  },
  defaultSemiBold: {
    fontSize: Theme.typography.size.s16,
    lineHeight: Theme.typography.lineHeight.s24,
    fontWeight: Theme.typography.weight.semiBold,
  },
  title: {
    fontSize: Theme.typography.size.s32,
    fontWeight: Theme.typography.weight.heavy,
    lineHeight: Theme.typography.lineHeight.s32,
  },
  subtitle: {
    fontSize: Theme.typography.size.s20,
    fontWeight: Theme.typography.weight.heavy,
  },
  link: {
    lineHeight: Theme.typography.lineHeight.s30,
    fontSize: Theme.typography.size.s16,
    color: Theme.colors.textLink,
  },
});
