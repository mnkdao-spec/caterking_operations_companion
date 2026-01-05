import { Stack } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function KDSLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#1A1A1A", // KDS dark background
        },
        animation: "fade",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="expo" />
      <Stack.Screen name="station" />
      <Stack.Screen name="plating" />
    </Stack>
  );
}
