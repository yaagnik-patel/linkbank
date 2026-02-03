import { useWindowDimensions } from "react-native";
import { useState, useEffect } from "react";

const BREAKPOINT = 768;

export function useResponsive() {
  const { width } = useWindowDimensions();
  const [isLargeScreen, setIsLargeScreen] = useState(width >= BREAKPOINT);

  useEffect(() => {
    setIsLargeScreen(width >= BREAKPOINT);
  }, [width]);

  return {
    width,
    isLargeScreen,
    isMobile: !isLargeScreen,
  };
}
