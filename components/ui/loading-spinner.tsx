import { ActivityIndicator, View, Text, DimensionValue } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({
  size = "large",
  message,
  fullScreen = false,
  className,
}: LoadingSpinnerProps) {
  const colors = useColors();

  const content = (
    <View
      className={cn(
        "items-center justify-center gap-3",
        fullScreen && "flex-1",
        className
      )}
    >
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <Text className="text-base text-muted text-center">{message}</Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        {content}
      </View>
    );
  }

  return content;
}

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  className?: string;
}

export function Skeleton({ width, height, className }: SkeletonProps) {
  return (
    <View
      className={cn("bg-surface rounded-lg animate-pulse", className)}
      style={{ width, height }}
    />
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <View className={cn("bg-surface rounded-xl p-4 gap-3", className)}>
      <Skeleton width="60%" height={20} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="80%" height={16} />
      <View className="flex-row gap-2 mt-2">
        <Skeleton width={80} height={32} className="rounded-full" />
        <Skeleton width={80} height={32} className="rounded-full" />
      </View>
    </View>
  );
}

interface SkeletonListProps {
  count?: number;
  className?: string;
}

export function SkeletonList({ count = 3, className }: SkeletonListProps) {
  return (
    <View className={cn("gap-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}
