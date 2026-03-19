export function getStreamingStepSize(length: number) {
  if (length <= 24) {
    return 1;
  }

  if (length <= 80) {
    return 2;
  }

  return 3;
}

export function buildStreamingFrames(text: string) {
  const value = text.trim();
  if (!value) {
    return [] as string[];
  }

  const characters = Array.from(value);
  const step = getStreamingStepSize(characters.length);
  const frames: string[] = [];

  for (let index = 0; index < characters.length; index += step) {
    frames.push(characters.slice(0, index + step).join(''));
  }

  return frames;
}

export function getStreamingTickMs(length: number) {
  if (length <= 24) {
    return 34;
  }

  if (length <= 80) {
    return 26;
  }

  return 20;
}
