# CaterKing KDS - Kitchen Display System Design

## Overview
A tablet-optimized Kitchen Display System using the Hybrid Course-Fire model. Designed for landscape orientation with large touch targets for use in fast-paced kitchen environments.

---

## Screen List

### 1. Mode Selector
Entry point to choose between Staff Mode (phone) and Station Mode (tablet KDS).

### 2. Station Selector
Choose which station this tablet will display (Expo, Grill, Sauté, Garde Manger, Dessert, Plating).

### 3. Expo Command View
The control center for the event lead to fire courses and monitor all stations.

### 4. Station Queue View
Individual station display showing fired orders with large bump buttons.

### 5. Plating/Ready View
Shows when all components for a table's course are ready for plating.

---

## Primary Content and Functionality

### Mode Selector
- **Content**: Two large cards - "Staff Mode" and "Station Mode"
- **Functionality**: Tap to enter respective mode; remembers last selection

### Station Selector
- **Content**: Grid of station buttons with icons
- **Stations**: Expo (Command), Grill, Sauté, Garde Manger, Dessert, Plating
- **Functionality**: Tap to claim station; shows if station is already claimed

### Expo Command View
- **Content**: 
  - Active event info (name, guest count, course progress)
  - Table groups with course status
  - All-stations overview panel
- **Functionality**:
  - "FIRE" button to send course to stations
  - View station queue depths
  - See timing alerts (station falling behind)

### Station Queue View
- **Content**:
  - Station name header with timer
  - Queue of fired items (oldest at top)
  - Each item shows: dish name, quantity, table, special notes, elapsed time
- **Functionality**:
  - Giant "BUMP" button (entire card is tappable)
  - Color coding: Green (on time), Yellow (approaching), Red (overdue)
  - Swipe to see item details/modifications

### Plating/Ready View
- **Content**:
  - Table groups with all course components
  - Checkmarks for completed items
  - "ALL READY" indicator when complete
- **Functionality**:
  - Tap to mark course as plated/served
  - Visual celebration when course completes

---

## Key User Flows

### Flow 1: Fire a Course
1. Expo views table groups for current event
2. Taps "FIRE COURSE 1" for Table Group A
3. System routes items to appropriate stations
4. Stations see items appear in their queue

### Flow 2: Complete an Item (Station)
1. Station chef sees item at top of queue
2. Prepares the dish
3. Taps the giant BUMP button
4. Item disappears; next item moves up
5. Plating view updates to show item ready

### Flow 3: Plate and Serve
1. Plating station sees all items for Table 5 are ready
2. Plates the course
3. Taps "COURSE COMPLETE"
4. Servers are notified; Expo sees progress update

---

## Color Choices (KDS-Specific)

High contrast colors for kitchen visibility:

| Token | Value | Usage |
|-------|-------|-------|
| **kds-background** | `#1A1A1A` (Near black) | Dark background for screen glare reduction |
| **kds-surface** | `#2D2D2D` (Dark gray) | Card backgrounds |
| **kds-text** | `#FFFFFF` (White) | Primary text for maximum contrast |
| **kds-fire** | `#FF6B35` (Bright orange) | Fire button, urgent actions |
| **kds-bump** | `#4CAF50` (Green) | Bump/complete buttons |
| **kds-warning** | `#FFB800` (Amber) | Time warnings |
| **kds-urgent** | `#FF3B30` (Red) | Overdue items |
| **kds-ready** | `#34C759` (Bright green) | Ready/complete states |

---

## UI Specifications

### Touch Targets
- Minimum button size: 88px × 88px
- Bump buttons: Full card width, 120px height
- Fire buttons: 200px × 80px

### Typography
- Station header: 48px bold
- Item name: 32px semibold
- Quantity: 64px bold (large and prominent)
- Table number: 28px
- Timer: 24px monospace

### Layout (Landscape Tablet)
- Left panel (30%): Event info, table groups, or station list
- Main area (70%): Order queue or command controls

### Visual Feedback
- Bump: Scale down 0.95 + haptic + flash green
- Fire: Pulse animation + haptic + items animate to stations
- Overdue: Pulsing red border

---

## Timer Logic

| Time Elapsed | Color | Behavior |
|--------------|-------|----------|
| 0-5 min | Green | Normal display |
| 5-8 min | Yellow | Warning indicator |
| 8+ min | Red | Pulsing alert, notification to Expo |

---

## Data Model

### FiredOrder
```typescript
interface FiredOrder {
  id: string;
  eventId: string;
  tableGroup: string;
  course: number;
  items: OrderItem[];
  firedAt: Date;
  status: 'pending' | 'in_progress' | 'ready' | 'plated';
}

interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  station: StationType;
  modifications: string[];
  status: 'queued' | 'cooking' | 'done';
  bumpedAt?: Date;
}

type StationType = 'expo' | 'grill' | 'saute' | 'garde_manger' | 'dessert' | 'plating';
```

---

## Integration Points

1. **Operations Companion**: Alerts when stations fall behind
2. **Inventory Module**: Decrement stock on bump
3. **Event Management**: Pull event details, menu, guest count
4. **Desktop ERP**: Event setup, menu configuration, reporting
