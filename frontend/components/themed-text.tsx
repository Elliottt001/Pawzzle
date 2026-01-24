import { StyleSheet } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Theme } from '@/constants/theme';
import { Text, type TextProps } from '@/components/base-text';

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
    fontFamily: Theme.fonts.semiBold,
  },
  title: {
    fontSize: Theme.typography.size.s32,
    fontFamily: Theme.fonts.heavy,
    lineHeight: Theme.typography.lineHeight.s32,
  },
  subtitle: {
    fontSize: Theme.typography.size.s20,
    fontFamily: Theme.fonts.heavy,
  },
  link: {
    lineHeight: Theme.typography.lineHeight.s30,
    fontSize: Theme.typography.size.s16,
    color: Theme.colors.textLink,
  },
});
