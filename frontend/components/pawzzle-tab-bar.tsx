import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/base-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';

const CENTER_ROUTE_NAME = 'agent';

export function PawzzleTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + Theme.spacing.s8 }]}>
      <View style={styles.bar}>
        <View style={styles.barHighlight} />
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : options.title ??
                  (typeof route.name === 'string' ? route.name : '');
            const isFocused = state.index === index;
            const isCenter = route.name === CENTER_ROUTE_NAME;
            const isHidden = (options as { href?: string | null }).href === null;

            if (isHidden) {
              return null;
            }

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            if (isCenter) {
              return (
                <View key={route.key} style={styles.centerSlot}>
                  <View style={styles.centerNotch} />
                  <View style={styles.centerGlow} />
                  <Pressable
                    onPress={onPress}
                    style={({ pressed }) => [
                      styles.centerButton,
                      pressed && styles.centerButtonPressed,
                      isFocused && styles.centerButtonActive,
                    ]}>
                    <View style={styles.centerInner}>
                      {options.tabBarIcon
                        ? options.tabBarIcon({
                            color: Theme.colors.textInverse,
                            size: Theme.sizes.s30,
                            focused: isFocused,
                          })
                        : null}
                    </View>
                  </Pressable>
                </View>
              );
            }

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.tabItem,
                  pressed && styles.tabItemPressed,
                ]}>
                {options.tabBarIcon
                  ? options.tabBarIcon({
                      color: isFocused ? Theme.colors.tabBarActive : Theme.colors.tabBarInactive,
                      size: Theme.sizes.s24,
                      focused: isFocused,
                    })
                  : null}
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused && styles.tabLabelActive,
                  ]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Theme.colors.transparent,
  },
  bar: {
    position: 'relative',
    backgroundColor: Theme.colors.backgroundWarmAlt,
    borderTopLeftRadius: Theme.radius.r24,
    borderTopRightRadius: Theme.radius.r24,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmStrong,
    paddingTop: Theme.spacing.s16,
    paddingHorizontal: Theme.spacing.s16,
    paddingBottom: Theme.spacing.s10,
    overflow: 'visible',
    ...Theme.shadows.cardSoftLarge,
  },
  barHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: Theme.spacing.s6,
    backgroundColor: Theme.colors.card,
    opacity: Theme.opacity.o85,
    borderTopLeftRadius: Theme.radius.r24,
    borderTopRightRadius: Theme.radius.r24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  tabItem: {
    flex: Theme.layout.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.s4,
    paddingBottom: Theme.spacing.s10,
  },
  tabItemPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  tabLabel: {
    fontSize: Theme.typography.size.s12,
    lineHeight: Theme.typography.lineHeight.s16,
    color: Theme.colors.tabBarInactive,
  },
  tabLabelActive: {
    color: Theme.colors.tabBarActive,
    fontFamily: Theme.fonts.semiBold,
  },
  centerSlot: {
    flex: Theme.layout.full,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  centerNotch: {
    position: 'absolute',
    width: Theme.sizes.s96,
    height: Theme.sizes.s96,
    borderRadius: Theme.sizes.s96 / 2,
    top: -Theme.sizes.s48,
    backgroundColor: Theme.colors.backgroundWarmAlt,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmStrong,
    ...Theme.shadows.elevatedSoft,
  },
  centerGlow: {
    position: 'absolute',
    width: Theme.sizes.s100,
    height: Theme.sizes.s100,
    borderRadius: Theme.sizes.s100 / 2,
    top: -Theme.sizes.s50,
    backgroundColor: Theme.colors.ctaBackground,
    opacity: Theme.opacity.o6,
    ...Theme.shadows.button,
    shadowColor: Theme.colors.ctaBackground,
  },
  centerButton: {
    width: Theme.sizes.s80,
    height: Theme.sizes.s80,
    borderRadius: Theme.sizes.s80 / 2,
    backgroundColor: Theme.colors.ctaBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -Theme.sizes.s40,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.ctaBorder,
    ...Theme.shadows.cardLarge,
  },
  centerButtonActive: {
    borderColor: Theme.colors.primary,
  },
  centerButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  centerInner: {
    width: Theme.sizes.s68,
    height: Theme.sizes.s68,
    borderRadius: Theme.sizes.s68 / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    ...Theme.shadows.button,
  },
});
