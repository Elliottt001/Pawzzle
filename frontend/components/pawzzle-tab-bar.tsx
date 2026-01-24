import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/base-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import MiddleLogo from '@/assets/images/middle.svg';

const CENTER_ROUTE_NAME = 'agent';
const TAB_BAR_HEIGHT = Theme.sizes.s98;
const CENTER_BUMP_SIZE = Theme.sizes.s110;
const CENTER_BUMP_OFFSET = -Theme.sizes.s48;
const CENTER_BUTTON_SIZE = Theme.sizes.s80;
const CENTER_LOGO_SIZE = Theme.sizes.s96;

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
                  <View style={styles.centerBump} />
                  <Pressable
                    onPress={onPress}
                    style={({ pressed }) => [
                      styles.centerButton,
                      pressed && styles.centerButtonPressed,
                    ]}>
                    <MiddleLogo width={CENTER_LOGO_SIZE} height={CENTER_LOGO_SIZE} />
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
    height: TAB_BAR_HEIGHT,
    backgroundColor: Theme.colors.tabBarBackground,
    borderRadius: Theme.radius.r18,
    marginHorizontal: -Theme.spacing.s18,
    paddingVertical: Theme.spacing.s12,
    paddingHorizontal: Theme.spacing.s20,
    overflow: 'visible',
    ...Theme.shadows.tabBar,
  },
  barHighlight: {
    position: 'absolute',
    left: -Theme.spacing.s20,
    right: -Theme.spacing.s20,
    bottom: 0,
    height: Theme.spacing.s10,
    backgroundColor: Theme.colors.tabBarHighlight,
    borderBottomLeftRadius: Theme.radius.r18,
    borderBottomRightRadius: Theme.radius.r18,
  },
  row: {
    flexDirection: 'row',
    flex: Theme.layout.full,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabItem: {
    flex: Theme.layout.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.s4,
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
    justifyContent: 'center',
    position: 'relative',
  },
  centerBump: {
    position: 'absolute',
    width: CENTER_BUMP_SIZE,
    height: CENTER_BUMP_SIZE,
    borderRadius: CENTER_BUMP_SIZE / 2,
    top: CENTER_BUMP_OFFSET,
    backgroundColor: Theme.colors.tabBarCenterBase,
  },
  centerButton: {
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    backgroundColor: Theme.colors.transparent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    marginTop: -Theme.spacing.s28,
  },
  centerButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
});
