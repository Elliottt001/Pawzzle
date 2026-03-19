import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Reanimated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/base-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { getTabCenterMotionPreset } from '@/components/agent/motion';
import MiddleLogo from '@/assets/images/middle.svg';

const CENTER_ROUTE_NAME = 'agent';
const TAB_BAR_HEIGHT = Theme.sizes.s98;
const CENTER_BUMP_SIZE = Theme.sizes.s110;
const CENTER_BUMP_OFFSET = -Theme.sizes.s48;
const CENTER_BUTTON_SIZE = Theme.sizes.s80;
const CENTER_LOGO_SIZE = Theme.sizes.s96;

function AnimatedCenterTabButton({
  focused,
  onPress,
}: {
  focused: boolean;
  onPress: () => void;
}) {
  const preset = getTabCenterMotionPreset();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const haloOpacity = useSharedValue(focused ? 1 : 0.6);

  const restoreMotion = React.useCallback(() => {
    cancelAnimation(scale);
    translateY.value = withSpring(focused ? preset.focusedLift : 0, preset.releaseSpring);
    haloOpacity.value = withTiming(focused ? 1 : 0.6, { duration: 220 });

    if (focused) {
      scale.value = withRepeat(
        withSequence(
          withTiming(preset.pulseScale, { duration: 900 }),
          withTiming(1, { duration: 900 })
        ),
        -1,
        false
      );
      return;
    }

    scale.value = withSpring(1, preset.releaseSpring);
  }, [focused, haloOpacity, preset.focusedLift, preset.pulseScale, preset.releaseSpring, scale, translateY]);

  React.useEffect(() => {
    restoreMotion();

    return () => {
      cancelAnimation(scale);
    };
  }, [restoreMotion, scale]);

  const handlePressIn = React.useCallback(() => {
    cancelAnimation(scale);
    scale.value = withTiming(preset.pressScale, { duration: 120 });
    translateY.value = withTiming(preset.pressDepth, { duration: 120 });
    haloOpacity.value = withTiming(1, { duration: 120 });
  }, [haloOpacity, preset.pressDepth, preset.pressScale, scale, translateY]);

  const handlePressOut = React.useCallback(() => {
    restoreMotion();
  }, [restoreMotion]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <View style={styles.centerSlot}>
      <View style={styles.centerBump} />
      <Reanimated.View pointerEvents="none" style={[styles.centerHalo, haloStyle]} />
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Reanimated.View style={[styles.centerButton, buttonStyle]}>
          <MiddleLogo width={CENTER_LOGO_SIZE} height={CENTER_LOGO_SIZE} />
        </Reanimated.View>
      </Pressable>
    </View>
  );
}

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
                <AnimatedCenterTabButton
                  key={route.key}
                  focused={isFocused}
                  onPress={onPress}
                />
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
  centerHalo: {
    position: 'absolute',
    width: CENTER_BUMP_SIZE - Theme.spacing.s10,
    height: CENTER_BUMP_SIZE - Theme.spacing.s10,
    borderRadius: (CENTER_BUMP_SIZE - Theme.spacing.s10) / 2,
    top: CENTER_BUMP_OFFSET + Theme.spacing.s4,
    backgroundColor: 'rgba(244, 193, 127, 0.28)',
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
});
