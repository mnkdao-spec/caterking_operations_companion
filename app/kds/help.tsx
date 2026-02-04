import { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const KDS_COLORS = {
  background: "#1A1A1A",
  surface: "#2D2D2D",
  surfaceLight: "#3D3D3D",
  text: "#FFFFFF",
  textMuted: "#888888",
  fire: "#FF6B35",
  bump: "#4CAF50",
  warning: "#FFB800",
  urgent: "#FF3B30",
  ready: "#34C759",
  border: "#444444",
};

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  content: string;
  details: string[];
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: "error-recovery",
    title: "Error Recovery Workflow",
    icon: "🔧",
    content: "Learn how to detect and recover from unprocessed orders",
    details: [
      "• The system automatically scans for unprocessed orders when you open a KDS screen",
      "• If unprocessed orders are found, a red warning banner appears at the bottom",
      "• Tap the banner to open the recovery panel",
      "• Review each failed order and understand why it failed",
      "• Tap RETRY on individual orders or RETRY ALL to process all at once",
      "• The system will attempt to decrement inventory and mark orders complete",
      "• If retry succeeds, the order is removed from the list",
      "• If retry fails, check inventory levels and resolve the issue manually",
    ],
  },
  {
    id: "transaction-rollback",
    title: "Transaction Rollback Behavior",
    icon: "↩️",
    content: "Understand how the system handles failed order completions",
    details: [
      "• When you mark an order as complete, the system creates a transaction",
      "• The transaction includes: marking order complete + decrementing inventory",
      "• If inventory decrement fails, the entire transaction is rolled back",
      "• This means the order status is NOT changed if inventory can't be decremented",
      "• You'll see an error modal explaining what went wrong",
      "• Common reasons for rollback: insufficient inventory, inventory system error",
      "• The order remains in the queue for you to retry",
      "• Check inventory levels in the main app before retrying",
    ],
  },
  {
    id: "best-practices",
    title: "Best Practices for Order Completion",
    icon: "✨",
    content: "Tips for efficient and reliable KDS operations",
    details: [
      "• Complete orders in FIFO order (first fired, first completed)",
      "• Check the timer - orders older than 5 minutes are highlighted in red",
      "• Use BUMP for quick acknowledgment, then complete when ready",
      "• Monitor station queues - if queue > 8, alert the kitchen manager",
      "• For batch operations (plating), use PLATE ALL READY when all components ready",
      "• If you see a RETRY banner, address it immediately - don't ignore it",
      "• Check inventory before service starts to avoid surprises",
      "• Communicate with other stations about order pacing",
      "• Use the EXPO screen to see overall event progress",
      "• Report persistent errors to your manager",
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting Guide",
    icon: "🔍",
    content: "Common issues and how to resolve them",
    details: [
      "ISSUE: Order won't mark as complete",
      "  → Check if inventory is available",
      "  → Try RETRY from the error recovery panel",
      "  → If still fails, manually adjust inventory in main app",
      "",
      "ISSUE: Unprocessed orders keep appearing",
      "  → Open error recovery panel and RETRY ALL",
      "  → Check system logs for inventory errors",
      "  → Restart KDS screen if issue persists",
      "",
      "ISSUE: Station queue not updating",
      "  → Refresh the screen by swiping down",
      "  → Check network connection",
      "  → Ensure all tablets are on same WiFi",
      "",
      "ISSUE: Timer showing wrong time",
      "  → Verify device time is correct",
      "  → Restart the app",
      "",
      "ISSUE: Can't see other tablets' updates",
      "  → Check WiFi connection",
      "  → Restart the app",
      "  → Contact IT support if issue persists",
    ],
  },
  {
    id: "keyboard-shortcuts",
    title: "Quick Tips",
    icon: "⚡",
    content: "Speed up your KDS workflow",
    details: [
      "• Tap and hold BUMP button for haptic feedback confirmation",
      "• Swipe down on order list to refresh data",
      "• Tap order card to see full modifications",
      "• Use EXPO screen to plan course timing",
      "• Check STATION STATUS panel for queue bottlenecks",
      "• Tap HELP button anytime to return to this screen",
      "• Report bugs or feature requests to your manager",
    ],
  },
];

export default function KDSHelpScreen() {
  const [selectedSection, setSelectedSection] = useState<HelpSection | null>(null);

  const handleSelectSection = (section: HelpSection) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedSection(section);
  };

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📚 KDS OPERATOR GUIDE</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to CaterKing KDS</Text>
          <Text style={styles.welcomeSubtitle}>
            This guide helps you understand error recovery, transaction handling, and best practices for efficient kitchen operations.
          </Text>
        </View>

        {/* Help Sections Grid */}
        <View style={styles.sectionsContainer}>
          {HELP_SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.id}
              onPress={() => handleSelectSection(section)}
              style={styles.sectionCard}
            >
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
              <Text style={styles.sectionArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Questions? Contact your manager or check the main app for more information.
          </Text>
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={selectedSection !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSection(null)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setSelectedSection(null)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseButtonText}>← BACK</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedSection?.icon} {selectedSection?.title}
            </Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          {/* Modal Content */}
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <Text style={styles.modalDescription}>{selectedSection?.content}</Text>

            <View style={styles.detailsContainer}>
              {selectedSection?.details.map((detail, index) => (
                <Text key={index} style={styles.detailText}>
                  {detail}
                </Text>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setSelectedSection(null)}
                style={styles.modalCloseActionButton}
              >
                <Text style={styles.modalCloseActionButtonText}>GOT IT</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KDS_COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: KDS_COLORS.surface,
    borderBottomWidth: 2,
    borderBottomColor: KDS_COLORS.ready,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: KDS_COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: KDS_COLORS.text,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 50,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  welcomeSection: {
    backgroundColor: KDS_COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: KDS_COLORS.ready,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: KDS_COLORS.text,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: KDS_COLORS.textMuted,
    lineHeight: 20,
  },
  sectionsContainer: {
    gap: 12,
  },
  sectionCard: {
    backgroundColor: KDS_COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: KDS_COLORS.border,
    position: "relative",
  },
  sectionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: KDS_COLORS.text,
    marginBottom: 4,
  },
  sectionContent: {
    fontSize: 13,
    color: KDS_COLORS.textMuted,
    lineHeight: 18,
  },
  sectionArrow: {
    position: "absolute",
    right: 16,
    top: 16,
    fontSize: 24,
    color: KDS_COLORS.ready,
  },
  footer: {
    backgroundColor: KDS_COLORS.surfaceLight,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: KDS_COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: KDS_COLORS.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: KDS_COLORS.surface,
    borderBottomWidth: 2,
    borderBottomColor: KDS_COLORS.ready,
  },
  modalCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCloseButtonText: {
    color: KDS_COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: KDS_COLORS.text,
    flex: 1,
    textAlign: "center",
  },
  modalHeaderSpacer: {
    width: 50,
  },
  modalScrollContent: {
    padding: 16,
    gap: 16,
  },
  modalDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: KDS_COLORS.text,
    marginBottom: 12,
  },
  detailsContainer: {
    backgroundColor: KDS_COLORS.surface,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: KDS_COLORS.textMuted,
    lineHeight: 20,
  },
  modalFooter: {
    paddingVertical: 24,
    alignItems: "center",
  },
  modalCloseActionButton: {
    backgroundColor: KDS_COLORS.ready,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalCloseActionButtonText: {
    color: KDS_COLORS.text,
    fontSize: 14,
    fontWeight: "bold",
  },
});
