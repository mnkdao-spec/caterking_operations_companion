import { useState, useCallback, useEffect } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  TextInput,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { storage } from "@/lib/storage";
import { LoadingSpinner, SkeletonList } from "@/components/ui/loading-spinner";

interface Task {
  id: string;
  title: string;
  assignee: string;
  dueTime: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
}

interface EventChecklist {
  id: string;
  eventName: string;
  eventTime: string;
  tasks: Task[];
}

const MOCK_CHECKLISTS: EventChecklist[] = [
  {
    id: "1",
    eventName: "Corporate Lunch - TechCorp",
    eventTime: "12:00 PM",
    tasks: [
      {
        id: "1-1",
        title: "Prep appetizer platters",
        assignee: "Maria",
        dueTime: "10:30 AM",
        completed: true,
        priority: "high",
      },
      {
        id: "1-2",
        title: "Set up serving stations",
        assignee: "James",
        dueTime: "11:00 AM",
        completed: true,
        priority: "high",
      },
      {
        id: "1-3",
        title: "Prepare main courses",
        assignee: "Chef Tom",
        dueTime: "11:30 AM",
        completed: false,
        priority: "high",
      },
      {
        id: "1-4",
        title: "Arrange dessert display",
        assignee: "Sarah",
        dueTime: "11:45 AM",
        completed: false,
        priority: "medium",
      },
      {
        id: "1-5",
        title: "Final quality check",
        assignee: "Manager",
        dueTime: "11:55 AM",
        completed: false,
        priority: "high",
      },
    ],
  },
  {
    id: "2",
    eventName: "Wedding Reception - Johnson",
    eventTime: "6:00 PM",
    tasks: [
      {
        id: "2-1",
        title: "Confirm guest count with planner",
        assignee: "Lisa",
        dueTime: "2:00 PM",
        completed: false,
        priority: "high",
      },
      {
        id: "2-2",
        title: "Load delivery truck",
        assignee: "Team A",
        dueTime: "3:00 PM",
        completed: false,
        priority: "high",
      },
      {
        id: "2-3",
        title: "Set up at venue",
        assignee: "Team A",
        dueTime: "4:30 PM",
        completed: false,
        priority: "high",
      },
      {
        id: "2-4",
        title: "Coordinate with DJ for timing",
        assignee: "Lisa",
        dueTime: "5:00 PM",
        completed: false,
        priority: "medium",
      },
    ],
  },
  {
    id: "3",
    eventName: "Birthday Party - Smith",
    eventTime: "3:00 PM",
    tasks: [
      {
        id: "3-1",
        title: "Bake custom cake",
        assignee: "Pastry Chef",
        dueTime: "1:00 PM",
        completed: false,
        priority: "high",
      },
      {
        id: "3-2",
        title: "Prepare kids menu items",
        assignee: "Line Cook",
        dueTime: "2:00 PM",
        completed: false,
        priority: "medium",
      },
    ],
  },
];

export default function TasksScreen() {
  const colors = useColors();
  const [checklists, setChecklists] = useState<EventChecklist[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load tasks from storage on mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Save tasks to storage whenever they change
  useEffect(() => {
    if (!loading && checklists.length > 0) {
      storage.save("TASKS", checklists);
    }
  }, [checklists, loading]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const storedTasks = await storage.load<EventChecklist[]>("TASKS");
      if (storedTasks && storedTasks.length > 0) {
        setChecklists(storedTasks);
      } else {
        setChecklists(MOCK_CHECKLISTS);
        await storage.save("TASKS", MOCK_CHECKLISTS);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      setChecklists(MOCK_CHECKLISTS);
    } finally {
      setLoading(false);
    }
  };
  const [expandedEvent, setExpandedEvent] = useState<string | null>("1");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadTasks();
      await storage.updateLastSync();
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const toggleTask = (eventId: string, taskId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setChecklists((prev) =>
      prev.map((checklist) => {
        if (checklist.id === eventId) {
          return {
            ...checklist,
            tasks: checklist.tasks.map((task) =>
              task.id === taskId ? { ...task, completed: !task.completed } : task
            ),
          };
        }
        return checklist;
      })
    );
  };

  const getProgress = (tasks: Task[]) => {
    const completed = tasks.filter((t) => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return colors.error;
      case "medium":
        return colors.warning;
      case "low":
        return colors.success;
      default:
        return colors.muted;
    }
  };

  const renderTaskItem = (task: Task, eventId: string) => {
    return (
      <TouchableOpacity
        key={task.id}
        onPress={() => toggleTask(eventId, task.id)}
        activeOpacity={0.7}
        style={[
          styles.taskItem,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        {/* Checkbox */}
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: task.completed ? colors.success : "transparent",
              borderColor: task.completed ? colors.success : colors.border,
            },
          ]}
        >
          {task.completed && (
            <IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />
          )}
        </View>

        {/* Task content */}
        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskTitle,
              {
                color: colors.foreground,
                textDecorationLine: task.completed ? "line-through" : "none",
                opacity: task.completed ? 0.6 : 1,
              },
            ]}
          >
            {task.title}
          </Text>
          <View style={styles.taskMeta}>
            <Text style={[styles.taskAssignee, { color: colors.muted }]}>
              {task.assignee}
            </Text>
            <View style={styles.taskDue}>
              <IconSymbol name="clock.fill" size={12} color={colors.muted} />
              <Text style={[styles.taskDueText, { color: colors.muted }]}>
                {task.dueTime}
              </Text>
            </View>
          </View>
        </View>

        {/* Priority indicator */}
        <View
          style={[
            styles.priorityDot,
            { backgroundColor: getPriorityColor(task.priority) },
          ]}
        />
      </TouchableOpacity>
    );
  };

  const renderChecklist = ({ item }: { item: EventChecklist }) => {
    const isExpanded = expandedEvent === item.id;
    const progress = getProgress(item.tasks);
    const completedCount = item.tasks.filter((t) => t.completed).length;

    return (
      <View
        style={[
          styles.checklistCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* Header */}
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setExpandedEvent(isExpanded ? null : item.id);
          }}
          style={styles.checklistHeader}
        >
          <View style={styles.checklistInfo}>
            <Text style={[styles.eventName, { color: colors.foreground }]}>
              {item.eventName}
            </Text>
            <Text style={[styles.eventTime, { color: colors.muted }]}>
              {item.eventTime}
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: colors.primary }]}>
              {completedCount}/{item.tasks.length}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: progress === 100 ? colors.success : colors.primary,
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>
          </View>
          <IconSymbol
            name="chevron.right"
            size={20}
            color={colors.muted}
            style={{
              transform: [{ rotate: isExpanded ? "90deg" : "0deg" }],
            }}
          />
        </TouchableOpacity>

        {/* Tasks */}
        {isExpanded && (
          <View style={styles.tasksList}>
            {item.tasks.map((task) => renderTaskItem(task, item.id))}
          </View>
        )}
      </View>
    );
  };

  const totalTasks = checklists.reduce((sum, c) => sum + c.tasks.length, 0);
  const completedTasks = checklists.reduce(
    (sum, c) => sum + c.tasks.filter((t) => t.completed).length,
    0
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Event Checklists
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
          {completedTasks} of {totalTasks} tasks completed today
        </Text>
      </View>

      {/* Overall progress */}
      <View style={styles.overallProgress}>
        <View style={[styles.overallProgressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.overallProgressFill,
              {
                backgroundColor: colors.primary,
                width: `${Math.round((completedTasks / totalTasks) * 100)}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.overallProgressText, { color: colors.foreground }]}>
          {Math.round((completedTasks / totalTasks) * 100)}% Complete
        </Text>
      </View>

      {/* Checklists */}
      {loading ? (
        <SkeletonList count={2} className="p-4" />
      ) : (
        <FlatList
          data={checklists}
          renderItem={renderChecklist}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  overallProgress: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  overallProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  overallProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  overallProgressText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  checklistCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  checklistHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  checklistInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: "600",
  },
  eventTime: {
    fontSize: 14,
    marginTop: 2,
  },
  progressContainer: {
    alignItems: "flex-end",
    gap: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  tasksList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 12,
  },
  taskAssignee: {
    fontSize: 13,
  },
  taskDue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskDueText: {
    fontSize: 13,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
