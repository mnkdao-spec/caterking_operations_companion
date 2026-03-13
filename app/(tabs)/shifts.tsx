import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { staffService, type StaffShift } from "@/lib/staff-service";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function ShiftsScreen() {
  const colors = useColors();
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [earnings, setEarnings] = useState({ unpaid: 0, paidYTD: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Note: In a real app, this ID would come from the logged-in user context
  const MOCK_STAFF_ID = "00000000-0000-0000-0000-000000000000"; 

  const loadShifts = useCallback(async () => {
    setLoading(true);
    const [shiftsData, earningsData] = await Promise.all([
      staffService.getMyAssignments(MOCK_STAFF_ID),
      staffService.getEarningsSummary(MOCK_STAFF_ID)
    ]);
    setShifts(shiftsData);
    setEarnings(earningsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadShifts();
    setRefreshing(false);
  }, [loadShifts]);

  const handleClockIn = async (id: string) => {
    const success = await staffService.clockIn(id);
    if (success) {
      loadShifts();
    } else {
      Alert.alert("Error", "Could not clock in. Please try again.");
    }
  };

  const handleClockOut = async (id: string) => {
    Alert.alert(
      "Clock Out",
      "Are you sure you want to end your shift?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "End Shift", 
          onPress: async () => {
            const success = await staffService.clockOut(id);
            if (success) loadShifts();
          }
        }
      ]
    );
  };

  const activeShift = shifts.find(s => s.check_in_time && !s.check_out_time);
  const upcomingShifts = shifts.filter(s => !s.check_in_time);
  const pastShifts = shifts.filter(s => s.check_out_time);

  if (loading) return <LoadingSpinner fullScreen message="Loading shifts..." />;

  return (
    <ScreenContainer>
      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="p-6">
          <Text className="text-3xl font-bold" style={{ color: colors.foreground }}>Time Clock</Text>
          <Text className="text-base mt-1" style={{ color: colors.muted }}>Manage your hospitality shifts</Text>

          {/* Earnings Hub */}
          <View className="mt-8 flex-row gap-4">
            <View className="flex-1 bg-amber-50 p-4 rounded-3xl border border-amber-100">
              <Text className="text-amber-800 font-bold text-[10px] uppercase tracking-tighter">Ready for Payout</Text>
              <Text className="text-amber-900 text-xl font-black mt-1">${earnings.unpaid.toFixed(2)}</Text>
            </View>
            <View className="flex-1 bg-green-50 p-4 rounded-3xl border border-green-100">
              <Text className="text-green-800 font-bold text-[10px] uppercase tracking-tighter">Paid YTD (Taxable)</Text>
              <Text className="text-green-900 text-xl font-black mt-1">${earnings.paidYTD.toFixed(2)}</Text>
            </View>
          </View>

          <View className="mt-4 p-4 rounded-3xl bg-blue-50 border border-blue-100 flex-row items-center justify-between">
            <View>
              <Text className="text-blue-800 font-bold text-[10px] uppercase tracking-tighter">Projected Future Income</Text>
              <Text className="text-blue-900 text-lg font-black mt-0.5">${earnings.upcoming.toFixed(2)}</Text>
            </View>
            <View className="bg-blue-600/10 px-3 py-1 rounded-full">
              <Text className="text-blue-700 font-black text-[10px]">NEXT SHIFT: SOON</Text>
            </View>
          </View>

          {/* Active Shift Card */}
          {activeShift ? (
            <View className="mt-8 p-6 rounded-3xl shadow-xl" style={{ backgroundColor: colors.primary }}>
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-white/80 font-bold uppercase tracking-widest text-xs">Active Shift</Text>
                  <Text className="text-white text-2xl font-black mt-1">{activeShift.event_name}</Text>
                  <Text className="text-white/90 font-medium mt-1">{activeShift.role}</Text>
                </View>
                <View className="h-12 w-12 rounded-full bg-white/20 items-center justify-center">
                  <View className="h-4 w-4 rounded-full bg-red-400 animate-pulse shadow-sm shadow-red-900" />
                </View>
              </View>
              
              <View className="mt-6 pt-6 border-t border-white/20">
                <Text className="text-white/70 text-sm">Clocked in at:</Text>
                <Text className="text-white text-lg font-bold">{new Date(activeShift.check_in_time!).toLocaleTimeString()}</Text>
              </View>

              <TouchableOpacity 
                onPress={() => handleClockOut(activeShift.id)}
                className="mt-6 bg-white py-4 rounded-2xl items-center justify-center shadow-lg"
              >
                <Text className="font-black text-lg" style={{ color: colors.primary }}>CLOCK OUT</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mt-8 p-8 rounded-3xl border-2 border-dashed items-center justify-center" style={{ borderColor: colors.border }}>
              <IconSymbol name="clock.fill" size={48} color={colors.muted} />
              <Text className="mt-4 font-bold text-center" style={{ color: colors.muted }}>
                You are not currently clocked in.
              </Text>
            </View>
          )}

          {/* 2. Upcoming Assignments */}
          {upcomingShifts.length > 0 && (
            <View className="mt-10">
              <Text className="text-lg font-bold mb-4" style={{ color: colors.foreground }}>Upcoming Shifts</Text>
              {upcomingShifts.map(shift => (
                <View key={shift.id} className="mb-4 p-5 rounded-2xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-black text-lg" style={{ color: colors.foreground }}>{shift.event_name}</Text>
                      <Text className="text-sm mt-1" style={{ color: colors.muted }}>Role: {shift.role}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => handleClockIn(shift.id)}
                      className="bg-green-600 px-4 py-2 rounded-xl"
                    >
                      <Text className="text-white font-bold text-xs">CLOCK IN</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 3. Shift History */}
          {pastShifts.length > 0 && (
            <View className="mt-10 mb-10">
              <Text className="text-lg font-bold mb-4" style={{ color: colors.foreground }}>Recent History</Text>
              {pastShifts.map(shift => (
                <View key={shift.id} className="mb-3 p-4 rounded-xl border border-transparent bg-gray-50 flex-row justify-between items-center">
                  <View>
                    <Text className="font-bold text-sm" style={{ color: colors.foreground }}>{shift.event_name}</Text>
                    <Text className="text-xs text-gray-500">{new Date(shift.check_in_time!).toLocaleDateString()}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-black text-sm text-gray-900">{shift.hours_worked} hrs</Text>
                    <Text className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">PAID: ${shift.pay_amount}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
