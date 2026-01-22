import Animated from 'react-native-reanimated';
import { Theme } from '@/constants/theme';

export function HelloWave() {
  return (
    <Animated.Text
      style={{
        fontSize: Theme.typography.size.s28,
        lineHeight: Theme.typography.lineHeight.s32,
        marginTop: -Theme.spacing.s6,
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}>
      👋
    </Animated.Text>
  );
}
