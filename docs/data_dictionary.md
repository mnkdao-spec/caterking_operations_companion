# Data Dictionary
## CaterKing Operations Companion

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Maintained By:** Development Team  
**Purpose:** Business-to-Technical Translation Reference

---

## Introduction

This data dictionary serves as the authoritative reference for all business terminology, data types, allowed values, and calculated fields in the CaterKing Operations Companion system. It bridges the gap between business language and technical implementation, ensuring consistent understanding across product, development, and operations teams.

**Audience:** Product managers, developers, QA engineers, business analysts, and operations staff.

**Usage:** Consult this dictionary when defining requirements, writing code, creating test cases, or analyzing data.

---

## Table of Contents

1. [Business Entities](#business-entities)
2. [Enum Values Reference](#enum-values-reference)
3. [Calculated Fields](#calculated-fields)
4. [Data Validation Rules](#data-validation-rules)
5. [Units of Measure](#units-of-measure)
6. [Status Workflows](#status-workflows)
7. [Business Rules](#business-rules)

---

## Business Entities

### Event

**Business Definition:** A catering engagement where CaterKing provides food and service at a specific venue for a client's occasion.

**Technical Implementation:** `events` table

**Key Attributes:**

| Business Term | Technical Field | Type | Description |
|---------------|----------------|------|-------------|
| Event Name | `event_name` | TEXT | Display name for the event (e.g., "Smith Wedding Reception") |
| Event Date | `event_date` | DATE | Date the event takes place |
| Event Time | `event_time` | TIME | Time the event starts |
| Guest Count | `guest_count` | INTEGER | Number of guests attending |
| Venue | `venue_name` | TEXT | Name of the venue |
| Venue Address | `venue_address` | TEXT | Full address of the venue |
| Event Type | `event_type` | TEXT | Category of event (wedding, corporate, private) |
| Status | `status` | TEXT | Current stage in event lifecycle |
| Budget | `budget` | DECIMAL(10,2) | Total event budget in dollars |
| Client | `client_id` | UUID | Reference to client record |

**Business Rules:**
- Events must have a name, date, and type
- Guest count must be positive
- Budget is optional but recommended for financial planning
- Status progresses from lead → confirmed → completed

---

### Client

**Business Definition:** An individual or organization that books catering services from CaterKing.

**Technical Implementation:** `clients` table

**Key Attributes:**

| Business Term | Technical Field | Type | Description |
|---------------|----------------|------|-------------|
| Client Name | `name` | VARCHAR(255) | Full name or company name |
| Email | `email` | VARCHAR(255) | Primary email contact |
| Phone | `phone` | VARCHAR(50) | Primary phone number |
| Company | `company` | VARCHAR(255) | Company name (if applicable) |
| Contact Person | `contact_person` | VARCHAR(255) | Primary contact at company |
| Client Type | `client_type` | VARCHAR(50) | individual, corporate, or government |
| Status | `status` | VARCHAR(50) | active, inactive, or archived |
| Satisfaction Rating | `satisfaction_rating` | INTEGER | 1-5 rating of client satisfaction |
| Lifetime Value | `lifetime_value` | DECIMAL(12,2) | Total revenue from all events |
| Total Events | `total_events` | INTEGER | Count of events booked |

**Business Rules:**
- Client name is required
- Email and phone are optional but at least one is recommended
- Lifetime value and total events are automatically calculated
- Satisfaction rating is average across all events

---

### Menu Item

**Business Definition:** A dish or beverage that can be included in an event menu.

**Technical Implementation:** `menu_items` table

**Key Attributes:**

| Business Term | Technical Field | Type | Description |
|---------------|----------------|------|-------------|
| Dish Name | `name` | TEXT | Name of the menu item |
| Category | `category` | TEXT | appetizer, entrée, side dish, dessert, beverage |
| Description | `description` | TEXT | Customer-facing description |
| Dietary Info | `dietary_info` | TEXT | Allergens and dietary restrictions |
| Prep Time | `prep_time_minutes` | INTEGER | Minutes required to prepare |
| Cost | `cost_per_serving` | DECIMAL(10,2) | Cost to prepare one serving |
| Price | `price_per_serving` | DECIMAL(10,2) | Price charged to customer |
| Minimum Order | `minimum_order_quantity` | INTEGER | Minimum number of servings |
| Available | `is_available` | BOOLEAN | Whether currently offered |
| Kitchen Station | `station` | TEXT | grill, saute, garde_manger, dessert |

**Business Rules:**
- Name and category are required
- Cost and price determine profit margin
- Prep time used for kitchen scheduling
- Station assignment required for KDS operations

---

### Staff Member

**Business Definition:** An employee who works catering events in various roles.

**Technical Implementation:** `staff` table

**Key Attributes:**

| Business Term | Technical Field | Type | Description |
|---------------|----------------|------|-------------|
| First Name | `first_name` | VARCHAR(100) | Employee first name |
| Last Name | `last_name` | VARCHAR(100) | Employee last name |
| Email | `email` | VARCHAR(255) | Work email address |
| Phone | `phone` | VARCHAR(50) | Contact phone number |
| Role | `role` | VARCHAR(100) | Primary job role |
| Department | `department` | VARCHAR(100) | kitchen, service, management, admin |
| Status | `status` | VARCHAR(50) | active, on_leave, inactive |
| Hire Date | `hire_date` | DATE | Date employee was hired |
| Hourly Rate | `hourly_rate` | DECIMAL(10,2) | Pay rate per hour |
| Certification Level | `certification_level` | VARCHAR(50) | junior, intermediate, senior, master |
| Specialties | `specialties` | TEXT[] | Array of skill areas |
| Total Hours | `total_hours_worked` | DECIMAL(10,2) | Cumulative hours across all events |
| Total Events | `total_events_worked` | INTEGER | Count of events worked |
| Performance Rating | `performance_rating` | DECIMAL(3,2) | 0-5 performance score |

**Business Rules:**
- First name, last name, and role are required
- Hourly rate determines pay for event assignments
- Performance rating based on manager evaluations
- Specialties used for optimal event staffing

---

### Ingredient

**Business Definition:** A raw material or component used in recipes to prepare menu items.

**Technical Implementation:** `ingredients` table

**Key Attributes:**

| Business Term | Technical Field | Type | Description |
|---------------|----------------|------|-------------|
| Ingredient Name | `name` | TEXT | Name of the ingredient |
| Unit | `unit` | TEXT | Unit of measure (oz, lb, ml, l, count, bunch) |
| Category | `category` | TEXT | protein, vegetable, grain, dairy, spice, etc. |
| Cost Per Unit | `cost_per_unit` | DECIMAL(10,2) | Cost per unit in dollars |
| Reorder Level | `reorder_level` | DECIMAL(12,2) | Threshold for low stock alert |
| Supplier | `supplier` | TEXT | Supplier name or contact |

**Business Rules:**
- Name, unit, category, and cost per unit are required
- Reorder level triggers automatic alerts
- Unit must be consistent across all uses
- Category used for inventory organization

---

### Course

**Business Definition:** A sequential stage of meal service at an event (e.g., Appetizers, Main Course, Dessert).

**Technical Implementation:** `courses` table

**Key Attributes:**

| Business Term | Technical Field | Type | Description |
|---------------|----------------|------|-------------|
| Course Number | `course_number` | INTEGER | Sequential order (1, 2, 3...) |
| Course Name | `name` | TEXT | Name of the course |
| Event | `event_id` | UUID | Parent event |

**Business Rules:**
- Course numbers must be unique within an event
- Typical sequence: 1=Appetizers, 2=Salad, 3=Main, 4=Dessert
- Courses are fired (sent to kitchen) in sequential order

---

### Table Group

**Business Definition:** A grouping of tables that receive courses at the same time for coordinated service.

**Technical Implementation:** `table_groups` table

**Key Attributes:**

| Business Term | Technical Field | Type | Description |
|---------------|----------------|------|-------------|
| Group Name | `name` | TEXT | Name of the table group |
| Guest Count | `guest_count` | INTEGER | Number of guests in this group |
| Table Numbers | `table_numbers` | TEXT[] | Array of table numbers |
| Event | `event_id` | UUID | Parent event |

**Business Rules:**
- Table numbers stored as flexible array
- Guest count per group used for portion planning
- Multiple groups allow staggered service timing

---

## Enum Values Reference

### Event Type

**Field:** `events.event_type`  
**Type:** TEXT  
**Default:** 'wedding'

| Value | Display Name | Description | Typical Characteristics |
|-------|--------------|-------------|------------------------|
| `wedding` | Wedding | Wedding receptions and ceremonies | Formal service, multi-course meals, high guest count |
| `corporate` | Corporate | Business events and meetings | Buffet or plated service, professional atmosphere |
| `private` | Private | Private parties and celebrations | Flexible format, varied guest counts |

**Usage:** Used for event categorization, reporting, and default menu suggestions.

---

### Event Status

**Field:** `events.status`  
**Type:** TEXT  
**Default:** 'lead'

| Value | Display Name | Description | Next States |
|-------|--------------|-------------|-------------|
| `lead` | Lead | Initial inquiry, not yet confirmed | confirmed, cancelled |
| `confirmed` | Confirmed | Contract signed, deposit received | completed, cancelled |
| `completed` | Completed | Event successfully executed | (terminal state) |
| `cancelled` | Cancelled | Event cancelled by client or CaterKing | (terminal state) |

**Workflow:** lead → confirmed → completed (or cancelled at any stage)

**Business Rules:**
- Only confirmed events appear in kitchen operations
- Completed events contribute to client lifetime value
- Cancelled events retained for historical analysis

---

### Client Type

**Field:** `clients.client_type`  
**Type:** VARCHAR(50)  
**Default:** 'individual'

| Value | Display Name | Description | Typical Behavior |
|-------|--------------|-------------|------------------|
| `individual` | Individual | Personal clients (weddings, birthdays) | One-time or occasional events |
| `corporate` | Corporate | Business clients | Recurring events, higher volume |
| `government` | Government | Government agencies | Formal procurement, compliance requirements |

**Usage:** Segmentation for marketing, pricing strategies, and reporting.

---

### Client Status

**Field:** `clients.status`  
**Type:** VARCHAR(50)  
**Default:** 'active'

| Value | Display Name | Description | Meaning |
|-------|--------------|-------------|---------|
| `active` | Active | Current or recent client | Eligible for marketing, visible in searches |
| `inactive` | Inactive | No recent activity | Not actively marketed, still searchable |
| `archived` | Archived | Historical record only | Hidden from normal operations, retained for history |

**Business Rules:**
- Active: booked event in last 12 months or upcoming event
- Inactive: no activity in 12+ months
- Archived: requested removal or business closure

---

### Menu Category

**Field:** `menu_items.category`  
**Type:** TEXT  
**Default:** 'appetizer'

| Value | Display Name | Description | Typical Service Order |
|-------|--------------|-------------|----------------------|
| `appetizer` | Appetizer | First course, small portions | Course 1 |
| `entrée` | Entrée | Main course, protein-focused | Course 3 |
| `side dish` | Side Dish | Accompaniments to entrée | Course 3 (with entrée) |
| `dessert` | Dessert | Sweet final course | Course 4 |
| `beverage` | Beverage | Drinks (alcoholic and non-alcoholic) | Throughout service |

**Usage:** Menu organization, course planning, kitchen workflow.

---

### Kitchen Station

**Field:** `menu_items.station`, `order_items.station`  
**Type:** TEXT  
**Default:** NULL (for menu items), required for order items

| Value | Display Name | Description | Typical Dishes |
|-------|--------------|-------------|----------------|
| `grill` | Grill | High-heat cooking station | Steaks, burgers, grilled vegetables |
| `saute` | Sauté | Pan cooking station | Chicken, fish, sauces |
| `garde_manger` | Garde Manger | Cold preparation station | Salads, appetizers, cold dishes |
| `dessert` | Dessert | Pastry and dessert station | Cakes, pastries, plated desserts |

**Usage:** KDS display filtering, kitchen workflow optimization, staff assignment.

---

### Staff Role

**Field:** `staff.role`  
**Type:** VARCHAR(100)  
**Required:** Yes

| Value | Display Name | Department | Typical Responsibilities |
|-------|--------------|------------|-------------------------|
| `Executive Chef` | Executive Chef | kitchen | Menu development, kitchen management |
| `Sous Chef` | Sous Chef | kitchen | Kitchen operations, quality control |
| `Line Cook` | Line Cook | kitchen | Station cooking, food preparation |
| `Prep Cook` | Prep Cook | kitchen | Ingredient preparation, stock work |
| `Event Manager` | Event Manager | management | Client coordination, event execution |
| `Head Server` | Head Server | service | Service coordination, staff management |
| `Server` | Server | service | Guest service, food delivery |
| `Bartender` | Bartender | service | Beverage service, bar management |

**Usage:** Staffing decisions, payroll, performance tracking.

---

### Staff Department

**Field:** `staff.department`  
**Type:** VARCHAR(100)  
**Default:** 'kitchen'

| Value | Display Name | Description |
|-------|--------------|-------------|
| `kitchen` | Kitchen | Food preparation and cooking |
| `service` | Service | Guest-facing service roles |
| `management` | Management | Event and business management |
| `admin` | Administration | Office and administrative support |

**Usage:** Organizational structure, reporting, scheduling.

---

### Staff Status

**Field:** `staff.status`  
**Type:** VARCHAR(50)  
**Default:** 'active'

| Value | Display Name | Description | Availability |
|-------|--------------|-------------|--------------|
| `active` | Active | Currently employed | Available for scheduling |
| `on_leave` | On Leave | Temporary absence | Not available |
| `inactive` | Inactive | No longer employed | Not available |

**Business Rules:**
- Only active staff appear in scheduling
- On leave staff retained in system for return
- Inactive staff retained for historical records

---

### Certification Level

**Field:** `staff.certification_level`  
**Type:** VARCHAR(50)  
**Default:** 'intermediate'

| Value | Display Name | Experience | Typical Hourly Rate Range |
|-------|--------------|------------|--------------------------|
| `junior` | Junior | 0-2 years | $15-20/hour |
| `intermediate` | Intermediate | 2-5 years | $20-30/hour |
| `senior` | Senior | 5-10 years | $30-45/hour |
| `master` | Master | 10+ years | $45-60/hour |

**Usage:** Pay rate determination, skill-based assignment, career progression.

---

### Order Item Status

**Field:** `order_items.status`  
**Type:** TEXT  
**Default:** 'queued'

| Value | Display Name | Description | Next States |
|-------|--------------|-------------|-------------|
| `queued` | Queued | Waiting to be started | cooking |
| `cooking` | Cooking | Currently being prepared | done |
| `done` | Done | Ready for service | (terminal state) |

**Workflow:** queued → cooking → done

**Business Rules:**
- Queued orders appear on KDS screen
- Cooking orders show elapsed time
- Done orders trigger inventory decrement

---

### Fired Course Status

**Field:** `fired_courses.status`  
**Type:** TEXT  
**Default:** 'fired'

| Value | Display Name | Description | Next States |
|-------|--------------|-------------|-------------|
| `fired` | Fired | Sent to kitchen | in_progress |
| `in_progress` | In Progress | Being prepared | ready |
| `ready` | Ready | All items complete | served |
| `served` | Served | Delivered to guests | (terminal state) |

**Workflow:** fired → in_progress → ready → served

**Business Rules:**
- Fired triggers creation of order items
- In progress when first order item starts cooking
- Ready when all order items done
- Served when delivered to table group

---

### Ingredient Category

**Field:** `ingredients.category`  
**Type:** TEXT  
**Required:** Yes

| Value | Display Name | Examples |
|-------|--------------|----------|
| `protein` | Protein | Beef, chicken, fish, tofu |
| `vegetable` | Vegetable | Lettuce, tomatoes, onions |
| `grain` | Grain | Rice, pasta, bread |
| `dairy` | Dairy | Milk, cheese, butter |
| `spice` | Spice | Salt, pepper, herbs |
| `oil` | Oil | Olive oil, vegetable oil |
| `condiment` | Condiment | Ketchup, mustard, sauces |
| `beverage` | Beverage | Coffee, tea, juice |

**Usage:** Inventory organization, cost analysis, supplier management.

---

### Inventory Transaction Type

**Field:** `inventory_transactions.transaction_type`  
**Type:** TEXT  
**Required:** Yes

| Value | Display Name | Description | quantity_change |
|-------|--------------|-------------|-----------------|
| `initial_stock` | Initial Stock | Setting opening inventory | Positive |
| `decrement` | Decrement | Automatic reduction from order completion | Negative |
| `adjustment` | Adjustment | Manual correction | Positive or Negative |
| `restock` | Restock | Adding new inventory | Positive |

**Usage:** Audit trail, inventory analysis, waste tracking.

---

## Calculated Fields

### Profit Margin (Menu Item)

**Business Definition:** Percentage profit on a menu item after ingredient costs.

**Formula:**
```
profit_margin = ((price_per_serving - cost_per_serving) / price_per_serving) * 100
```

**Example:**
- Price per serving: $25.00
- Cost per serving: $8.50
- Profit margin: ((25.00 - 8.50) / 25.00) * 100 = 66%

**Usage:** Pricing decisions, menu optimization, profitability analysis.

---

### Recipe Cost

**Business Definition:** Total cost of ingredients for one serving of a menu item.

**Formula:**
```
recipe_cost = SUM(ingredient.cost_per_unit * recipe_ingredient.quantity)
```

**Example:**
- Ingredient A: $2.00/oz * 4 oz = $8.00
- Ingredient B: $0.50/oz * 2 oz = $1.00
- Ingredient C: $1.00/count * 1 count = $1.00
- Recipe cost: $8.00 + $1.00 + $1.00 = $10.00

**Usage:** Menu pricing, cost control, inventory valuation.

---

### Client Lifetime Value

**Business Definition:** Total revenue generated from a client across all events.

**Formula:**
```
lifetime_value = SUM(client_events.revenue)
```

**Calculation:** Automatically updated when events are completed.

**Usage:** Client segmentation, marketing ROI, retention strategies.

---

### Cook Time

**Business Definition:** Time elapsed from when an order item was fired to when it was marked done.

**Formula:**
```
cook_time = bumped_at - fired_at  (in minutes)
```

**Example:**
- Fired at: 6:30 PM
- Bumped at: 6:45 PM
- Cook time: 15 minutes

**Usage:** Kitchen performance analysis, prep time validation, bottleneck identification.

---

### Service Time

**Business Definition:** Time elapsed from when a course was fired to when it was served.

**Formula:**
```
service_time = served_at - fired_at  (in minutes)
```

**Example:**
- Fired at: 6:30 PM
- Served at: 6:50 PM
- Service time: 20 minutes

**Usage:** Service quality metrics, timing optimization, guest satisfaction.

---

### Event Profitability

**Business Definition:** Total profit from an event after all costs.

**Formula:**
```
event_profit = budget - (ingredient_costs + labor_costs + overhead)
```

**Components:**
- Budget: Client-paid amount
- Ingredient costs: SUM(order_items.quantity * menu_item.cost_per_serving)
- Labor costs: SUM(staff_assignments.pay_amount)
- Overhead: Venue, equipment, transportation (external calculation)

**Usage:** Financial reporting, pricing strategy, event selection.

---

### Inventory Value

**Business Definition:** Total dollar value of current inventory.

**Formula:**
```
inventory_value = SUM(stock_levels.quantity * ingredients.cost_per_unit)
```

**Example:**
- Ingredient A: 50 oz * $2.00/oz = $100.00
- Ingredient B: 100 oz * $0.50/oz = $50.00
- Total inventory value: $150.00

**Usage:** Financial statements, insurance, loss prevention.

---

### Staff Utilization Rate

**Business Definition:** Percentage of available hours that staff actually worked.

**Formula:**
```
utilization_rate = (total_hours_worked / (weeks_employed * 40)) * 100
```

**Example:**
- Total hours worked: 320 hours
- Weeks employed: 10 weeks
- Available hours: 10 * 40 = 400 hours
- Utilization rate: (320 / 400) * 100 = 80%

**Usage:** Staffing optimization, performance evaluation, scheduling decisions.

---

## Data Validation Rules

### Email Addresses

**Format:** Standard RFC 5322 email format

**Validation:**
```regex
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

**Examples:**
- ✅ Valid: `john.smith@example.com`, `client+events@company.co.uk`
- ❌ Invalid: `invalid.email`, `@example.com`, `user@`

---

### Phone Numbers

**Format:** Flexible, supports US and international

**Validation:** Minimum 10 digits, allows formatting characters

**Examples:**
- ✅ Valid: `555-1234`, `(555) 123-4567`, `+1-555-123-4567`
- ❌ Invalid: `123` (too short), `abc-defg` (no digits)

---

### Monetary Values

**Range:** 0.00 to 9,999,999.99 (for DECIMAL(10,2))

**Validation:**
- Must be non-negative
- Maximum 2 decimal places
- No currency symbols in database (added in display layer)

**Examples:**
- ✅ Valid: `25.00`, `1250.50`, `0.99`
- ❌ Invalid: `-10.00`, `25.999`, `$25.00`

---

### Ratings (Client Satisfaction, Staff Performance)

**Range:** 1-5 (inclusive)

**Validation:**
```sql
CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5)
CHECK (performance_rating >= 0 AND performance_rating <= 5)
```

**Interpretation:**
- 1 = Poor
- 2 = Below Average
- 3 = Average
- 4 = Above Average
- 5 = Excellent

---

### Guest Count

**Range:** 1 to 10,000

**Validation:** Must be positive integer

**Business Rules:**
- Minimum 1 guest (no zero-guest events)
- Maximum 10,000 (practical limit for catering operations)
- Used for portion planning and staffing

---

### Prep Time

**Range:** 0 to 1,440 minutes (24 hours)

**Validation:** Must be non-negative integer

**Business Rules:**
- 0 minutes = no preparation (pre-made items)
- Typical range: 15-120 minutes
- Used for kitchen scheduling and timing

---

## Units of Measure

### Weight

| Unit | Abbreviation | Metric Equivalent |
|------|--------------|-------------------|
| Ounce | oz | 28.35 grams |
| Pound | lb | 453.59 grams |
| Gram | g | 1 gram |
| Kilogram | kg | 1000 grams |

**Usage:** Proteins, vegetables, dry goods

---

### Volume

| Unit | Abbreviation | Metric Equivalent |
|------|--------------|-------------------|
| Fluid Ounce | fl oz | 29.57 milliliters |
| Cup | cup | 236.59 milliliters |
| Pint | pt | 473.18 milliliters |
| Quart | qt | 946.35 milliliters |
| Gallon | gal | 3.785 liters |
| Milliliter | ml | 1 milliliter |
| Liter | l | 1000 milliliters |

**Usage:** Liquids, sauces, beverages

---

### Count

| Unit | Abbreviation | Description |
|------|--------------|-------------|
| Each | ea | Individual items |
| Dozen | doz | 12 items |
| Count | count | Generic count |

**Usage:** Eggs, rolls, individual portions

---

### Produce

| Unit | Abbreviation | Description |
|------|--------------|-------------|
| Bunch | bunch | Leafy vegetables, herbs |
| Head | head | Lettuce, cabbage |
| Clove | clove | Garlic |

**Usage:** Fresh produce with non-standard units

---

## Status Workflows

### Event Lifecycle

```
┌──────┐     ┌───────────┐     ┌───────────┐
│ Lead │────>│ Confirmed │────>│ Completed │
└──────┘     └───────────┘     └───────────┘
   │               │
   │               │
   v               v
┌───────────┐
│ Cancelled │
└───────────┘
```

**Transitions:**
- Lead → Confirmed: Contract signed, deposit received
- Confirmed → Completed: Event successfully executed
- Lead → Cancelled: Client declines or CaterKing cannot accommodate
- Confirmed → Cancelled: Cancellation after confirmation

---

### Order Item Lifecycle

```
┌────────┐     ┌─────────┐     ┌──────┐
│ Queued │────>│ Cooking │────>│ Done │
└────────┘     └─────────┘     └──────┘
```

**Transitions:**
- Queued → Cooking: Chef starts preparation
- Cooking → Done: Chef marks item complete (bumps ticket)

**Timing:**
- Queued: Visible on KDS screen
- Cooking: Timer shows elapsed time
- Done: Triggers inventory decrement

---

### Fired Course Lifecycle

```
┌───────┐     ┌─────────────┐     ┌───────┐     ┌────────┐
│ Fired │────>│ In Progress │────>│ Ready │────>│ Served │
└───────┘     └─────────────┘     └───────┘     └────────┘
```

**Transitions:**
- Fired → In Progress: First order item starts cooking
- In Progress → Ready: All order items marked done
- Ready → Served: Course delivered to table group

---

## Business Rules

### Event Planning

**Rule 1: Minimum Lead Time**
- Events must be booked at least 7 days in advance
- Exception: Rush orders with 50% surcharge

**Rule 2: Guest Count Changes**
- Final guest count due 72 hours before event
- Changes within 72 hours subject to availability

**Rule 3: Deposit Requirements**
- 25% deposit required to confirm event
- Balance due 24 hours before event

---

### Menu Pricing

**Rule 1: Minimum Profit Margin**
- All menu items must have at least 50% profit margin
- Exception: Loss leaders for client acquisition

**Rule 2: Seasonal Pricing**
- Ingredient costs updated monthly
- Menu prices adjusted quarterly

**Rule 3: Volume Discounts**
- 5% discount for 100+ guests
- 10% discount for 200+ guests
- 15% discount for 500+ guests

---

### Inventory Management

**Rule 1: Reorder Triggers**
- Automatic alert when stock falls below reorder level
- Alert sent to purchasing manager

**Rule 2: Stock Rotation**
- FIFO (First In, First Out) for perishables
- Expiration dates tracked in notes field

**Rule 3: Waste Tracking**
- All waste must be logged in inventory transactions
- Waste reason required (spoilage, over-prep, damage)

---

### Staff Scheduling

**Rule 1: Minimum Staffing Ratios**
- 1 chef per 50 guests
- 1 server per 20 guests
- 1 bartender per 75 guests

**Rule 2: Overtime Policy**
- Overtime paid at 1.5x hourly rate for hours over 40/week
- Double time for hours over 60/week

**Rule 3: Break Requirements**
- 15-minute break for every 4 hours worked
- 30-minute meal break for shifts over 6 hours

---

## Appendix: Sample Data

### Sample Event Types Distribution

| Event Type | Percentage | Average Guest Count | Average Budget |
|------------|-----------|---------------------|----------------|
| Wedding | 45% | 150 | $25,000 |
| Corporate | 35% | 75 | $8,000 |
| Private | 20% | 40 | $3,500 |

### Sample Menu Categories Distribution

| Category | Item Count | Average Price | Average Cost |
|----------|-----------|---------------|--------------|
| Appetizer | 25 | $8.00 | $2.50 |
| Entrée | 35 | $28.00 | $9.00 |
| Side Dish | 20 | $6.00 | $2.00 |
| Dessert | 15 | $10.00 | $3.00 |
| Beverage | 30 | $5.00 | $1.50 |

### Sample Staff Roles Distribution

| Role | Count | Average Rate | Average Rating |
|------|-------|--------------|----------------|
| Executive Chef | 1 | $45.00/hr | 4.9 |
| Sous Chef | 2 | $32.00/hr | 4.7 |
| Line Cook | 5 | $22.00/hr | 4.5 |
| Server | 8 | $18.00/hr | 4.4 |
| Bartender | 3 | $24.00/hr | 4.5 |

---

**Document Maintenance:**
- Update when new enum values are added
- Review quarterly for accuracy
- Add new calculated fields as business logic evolves
- Coordinate with database_schema.md and naming_conventions.md

---

**End of Data Dictionary**
