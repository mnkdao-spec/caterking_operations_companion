# CSV Import Guide - CaterKing Roadmap

This guide explains how to import the CaterKing 82-issue roadmap into various project management tools using the provided CSV files.

## Available CSV Formats

| File | Tool | Use Case |
|------|------|----------|
| `LINEAR_ISSUES.csv` | Linear (Generic) | Standard format with all fields |
| `LINEAR_ISSUES_JIRA.csv` | Jira | Jira-compatible format |
| `LINEAR_ISSUES_ASANA.csv` | Asana | Asana-compatible format |
| `LINEAR_ISSUES_MONDAY.csv` | Monday.com | Monday.com-compatible format |

## CSV File Structure

### Standard Format (LINEAR_ISSUES.csv)

**Columns:**
- `Sprint` — Sprint name (Sprint 1-4)
- `Issue ID` — Unique identifier (e.g., 1.A.1, 2.B.3)
- `Title` — Issue title/summary
- `Description` — Full description with context
- `Priority` — URGENT, HIGH, MEDIUM, LOW
- `Effort Hours` — Estimated hours to complete
- `Story Points` — Converted story points (effort_hours × 8)
- `Status` — Always "To Do" (update after import)
- `Related Files` — Semicolon-separated file paths
- `Dependencies` — Semicolon-separated issue IDs that must be completed first

**Example Row:**
```
Sprint 1: Critical Blockers & Fixes,1.A.2,Connect Expo Screen to useKDSInventory(),Replace mock courses with real data from context...,URGENT,2,16,To Do,app/kds/expo.tsx; lib/kds-context-with-inventory.tsx,1.A.1
```

### Jira Format (LINEAR_ISSUES_JIRA.csv)

**Columns:**
- `Summary` — Issue title
- `Description` — Full description
- `Issue Type` — Always "Task"
- `Priority` — URGENT, HIGH, MEDIUM, LOW
- `Story Points` — Story point estimate
- `Sprint` — Sprint assignment
- `Labels` — "roadmap" label
- `Assignee` — Empty (assign after import)

### Asana Format (LINEAR_ISSUES_ASANA.csv)

**Columns:**
- `Task Name` — Issue title
- `Description` — Full description
- `Assignee` — Empty (assign after import)
- `Due Date` — Empty (set after import)
- `Priority` — URGENT, HIGH, MEDIUM, LOW
- `Custom: Story Points` — Story point estimate
- `Custom: Sprint` — Sprint assignment
- `Custom: Dependencies` — Related issue IDs

### Monday.com Format (LINEAR_ISSUES_MONDAY.csv)

**Columns:**
- `Item Name` — Issue title
- `Description` — Full description
- `Status` — "To Do"
- `Priority` — URGENT, HIGH, MEDIUM, LOW
- `Story Points` — Story point estimate
- `Sprint` — Sprint assignment
- `Effort Hours` — Raw effort hours
- `Dependencies` — Related issue IDs

---

## Import Instructions by Tool

### Linear

**Note:** Your Linear workspace has reached the free issue limit. You'll need to upgrade to import these issues.

1. **Upgrade your workspace** — Visit https://linear.app/settings/billing
2. **After upgrade**, use the Manus connector to auto-import all 82 issues

### Jira

1. **Navigate to Project Settings** → **Import/Export** → **Import Issues**
2. **Select File** → Choose `LINEAR_ISSUES_JIRA.csv`
3. **Map Fields:**
   - Summary → Summary
   - Description → Description
   - Issue Type → Issue Type
   - Priority → Priority
   - Story Points → Story Points
   - Sprint → Sprint
   - Labels → Labels
4. **Review and Import** → Click "Import"
5. **Post-Import:**
   - Assign team members to tasks
   - Link dependencies in Jira (use Issue Links)
   - Create sprints if not auto-created

### Asana

1. **Create a Project** → Choose "List" view
2. **Click "+" → "Import from CSV"**
3. **Select File** → Choose `LINEAR_ISSUES_ASANA.csv`
4. **Map Columns:**
   - Task Name → Task Name
   - Description → Description
   - Priority → Priority
   - Custom: Story Points → Story Points (create custom field)
   - Custom: Sprint → Sprint (create custom field)
5. **Import and Organize:**
   - Create sections for each sprint
   - Assign tasks to team members
   - Set due dates based on sprint dates
   - Link dependencies using "Depends on" field

### Monday.com

1. **Create a Board** → Choose "Table" view
2. **Click "+" → "Import from CSV"**
3. **Select File** → Choose `LINEAR_ISSUES_MONDAY.csv`
4. **Map Columns:**
   - Item Name → Item Name
   - Description → Description
   - Status → Status
   - Priority → Priority
   - Story Points → Story Points (create custom column)
   - Sprint → Sprint (create custom column)
5. **Post-Import:**
   - Create groups by Sprint
   - Assign team members
   - Set due dates
   - Link dependencies using "Depends on" column

### Trello

1. **Create a Board** with lists for each sprint
2. **Use CSV Import Power-Up:**
   - Enable Power-Ups → Search "CSV"
   - Click "Import" → Select `LINEAR_ISSUES.csv`
3. **Map Columns:**
   - Title → Card Name
   - Description → Card Description
   - Sprint → List Name
   - Priority → Label
4. **Organize:**
   - Create cards in appropriate lists
   - Add labels for priority
   - Add checklists for dependencies

### Notion

1. **Create a Database** → Choose "Table" template
2. **Import CSV:**
   - Click "..." → "Import" → "CSV"
   - Select `LINEAR_ISSUES.csv`
3. **Create Properties:**
   - Title (text)
   - Description (text)
   - Sprint (select)
   - Priority (select)
   - Story Points (number)
   - Status (select)
   - Dependencies (text/relation)
4. **Organize:**
   - Create views by Sprint
   - Filter by Priority
   - Link related items

### GitHub Projects

1. **Create a Project** → Choose "Table" layout
2. **Add Custom Fields:**
   - Story Points (number)
   - Sprint (select)
   - Dependencies (text)
3. **Manually create issues** or use GitHub API:
   ```bash
   # Using GitHub CLI
   gh issue create --title "Issue Title" --body "Description" --project "Project Name"
   ```

---

## Data Mapping Reference

### Priority Levels

| Value | Meaning | Urgency |
|-------|---------|---------|
| URGENT | Critical blocker | Immediate (Sprint 1) |
| HIGH | Important feature | Week 1-2 |
| MEDIUM | Enhancement | Week 2-3 |
| LOW | Nice to have | Week 3+ |

### Story Points Calculation

Story points are calculated as: **Effort Hours × 8**

| Effort Hours | Story Points | Complexity |
|--------------|--------------|-----------|
| 1 | 8 | Simple |
| 2 | 16 | Moderate |
| 3 | 24 | Complex |
| 4+ | 32+ | Very Complex |

### Sprint Schedule

| Sprint | Name | Duration | Start Date | End Date |
|--------|------|----------|-----------|----------|
| 1 | Critical Blockers & Fixes | 2 weeks | 2026-02-10 | 2026-02-24 |
| 2 | Authentication & Security | 2 weeks | 2026-02-24 | 2026-03-10 |
| 3 | Code Quality & Maintainability | 2 weeks | 2026-03-10 | 2026-03-24 |
| 4 | Offline Sync & Scalability | 2 weeks | 2026-03-24 | 2026-04-07 |

---

## Dependency Management

### Understanding Dependencies

Each issue may have dependencies (listed in the `Dependencies` column):
- **1.A.1** blocks **1.A.2** (1.A.2 depends on 1.A.1)
- Dependencies are semicolon-separated: `1.A.1; 1.A.2`

### Linking Dependencies in Your Tool

**Jira:**
- Use "Link Issue" → "blocks/is blocked by"

**Asana:**
- Use "Depends on" field to link tasks

**Monday.com:**
- Use "Depends on" column to link items

**Linear:**
- Use "Blocked by" relationship

**Notion:**
- Create a "Relations" property to link databases

---

## Import Troubleshooting

### Issue: CSV not recognized
- **Solution:** Ensure file is UTF-8 encoded
- **Solution:** Check that headers match tool requirements
- **Solution:** Verify no special characters in field names

### Issue: Columns not mapping correctly
- **Solution:** Rename columns to match tool's expected format
- **Solution:** Use tool's column mapping feature during import
- **Solution:** Import as generic CSV, then manually map fields

### Issue: Dependencies not linking
- **Solution:** Import all issues first, then link dependencies
- **Solution:** Use issue IDs from the tool (not our IDs)
- **Solution:** Create links manually after import if auto-linking fails

### Issue: Special characters in descriptions
- **Solution:** Ensure CSV is UTF-8 encoded
- **Solution:** Escape quotes in descriptions: `"` → `""`
- **Solution:** Use tool's markdown/rich text editor after import

---

## Post-Import Checklist

After importing into your PM tool:

- [ ] All 87 issues imported successfully
- [ ] Issues organized by sprint
- [ ] Priorities assigned correctly
- [ ] Story points visible and editable
- [ ] Team members assigned to tasks
- [ ] Dependencies linked between issues
- [ ] Sprint dates set correctly
- [ ] Initial status set to "To Do"
- [ ] Related files documented
- [ ] Descriptions readable and complete

---

## Quick Start by Tool

### For Jira Users
```
1. Go to Project Settings → Import/Export
2. Choose LINEAR_ISSUES_JIRA.csv
3. Map fields (mostly auto-detected)
4. Click Import
5. Assign team members and link dependencies
```

### For Asana Users
```
1. Create new project
2. Click "+" → "Import from CSV"
3. Choose LINEAR_ISSUES_ASANA.csv
4. Create custom fields for Story Points and Sprint
5. Organize into sections by sprint
```

### For Monday.com Users
```
1. Create new board
2. Click "+" → "Import from CSV"
3. Choose LINEAR_ISSUES_MONDAY.csv
4. Create custom columns for Story Points and Sprint
5. Group by Sprint
```

### For Linear Users
```
1. Upgrade your workspace at https://linear.app/settings/billing
2. Once upgraded, use Manus connector for auto-import
3. All 82 issues will be created automatically
```

---

## Support

For issues with:
- **CSV format:** Check column headers match your tool
- **Dependencies:** Ensure all related issues are imported first
- **Custom fields:** Create fields in your tool before importing
- **Data loss:** Keep backup of original CSV files

## Files Included

- `LINEAR_ISSUES.csv` — Generic format (21 KB, 87 rows)
- `LINEAR_ISSUES_JIRA.csv` — Jira format (18 KB, 87 rows)
- `LINEAR_ISSUES_ASANA.csv` — Asana format (17 KB, 87 rows)
- `LINEAR_ISSUES_MONDAY.csv` — Monday.com format (18 KB, 87 rows)
- `LINEAR_ISSUES.json` — Original JSON format
- `CSV_IMPORT_GUIDE.md` — This guide

---

**Last Updated:** 2026-02-03  
**Total Issues:** 87  
**Total Effort:** 212.6 hours  
**Sprints:** 4 (8 weeks)
