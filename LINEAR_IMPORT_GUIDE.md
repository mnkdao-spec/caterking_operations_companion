# Linear Issues Import Guide
## How to Create 82 Issues for CaterKing Technical Roadmap

**Document Version**: 1.0  
**Created**: February 3, 2026  
**Total Issues**: 82  
**Sprints**: 4  
**Effort**: 212.6 hours

---

## Overview

This guide explains how to import the 82 technical roadmap issues into Linear for team coordination and sprint planning. The issues are organized into 4 sprints with clear dependencies, effort estimates, and team assignments.

### What You'll Get

- **82 issues** across 4 sprints
- **Clear dependencies** between tasks
- **Effort estimates** in hours (converted to story points)
- **Team assignments** (Dev1, Dev2)
- **Priority levels** (URGENT, HIGH)
- **Related files** for each task

---

## Prerequisites

1. **Linear Account**: Access to Linear project management
2. **Team**: Olde King Catering (OLD) team in Linear
3. **API Key**: `lin_api_AmL4ouK5KmUslsp93FOliet45OWkf1nAUpumdEYi`
4. **Team UUID**: `24e23174-7f6d-48b6-a739-212ebd95cc52`

---

## Option 1: Manual Import (Recommended for First Time)

### Step 1: Create Sprint Cycles in Linear

1. Go to Linear project: https://linear.app/olde-king-catering
2. Click **"Cycles"** in left sidebar
3. Create 4 new cycles:

| Cycle | Name | Start Date | End Date | Goal |
|-------|------|-----------|----------|------|
| 1 | Sprint 1: Critical Blockers & Fixes | Feb 10, 2026 | Feb 24, 2026 | Fix production blockers and data integrity issues |
| 2 | Sprint 2: Authentication & Security | Feb 24, 2026 | Mar 10, 2026 | Unify authentication systems and implement security |
| 3 | Sprint 3: Code Quality & Maintainability | Mar 10, 2026 | Mar 24, 2026 | Reduce technical debt and improve code organization |
| 4 | Sprint 4: Offline Sync & Scalability | Mar 24, 2026 | Apr 7, 2026 | Unify offline systems and prepare for scale |

### Step 2: Create Issues from JSON

1. Open `LINEAR_ISSUES.json` in this directory
2. For each issue in the JSON:
   - Click **"Create Issue"** in Linear
   - Fill in fields:
     - **Title**: From `"title"` field
     - **Description**: From `"description"` field
     - **Priority**: Map from `"priority"` field (URGENT → Urgent, HIGH → High)
     - **Estimate**: From `"effort_hours"` field (multiply by 8 for story points, e.g., 2 hours = 16 points)
     - **Cycle**: Select corresponding sprint cycle
     - **Assignee**: From `"owner"` field (Dev1 or Dev2)
     - **Labels**: Add `"roadmap"` label for easy filtering
   - Click **"Create"**

### Step 3: Link Dependencies

After creating all issues:

1. For each issue with `"depends_on"` field:
   - Open the issue
   - Click **"Links"** section
   - Click **"Add link"**
   - Select **"Blocks"** relationship
   - Search for and select the blocking issue
   - Save

---

## Option 2: Bulk Import via CSV (Advanced)

### Step 1: Convert JSON to CSV

Use this Python script to convert `LINEAR_ISSUES.json` to CSV format:

```python
import json
import csv

with open('LINEAR_ISSUES.json', 'r') as f:
    data = json.load(f)

with open('linear_issues.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    
    # Header
    writer.writerow([
        'Title',
        'Description',
        'Priority',
        'Estimate',
        'Cycle',
        'Assignee',
        'Labels',
        'Status'
    ])
    
    # Issues
    for issue in data['issues']:
        writer.writerow([
            issue['title'],
            issue['description'],
            issue['priority'],
            int(issue['effort_hours'] * 8),  # Convert to story points
            f"Sprint {issue['sprint']}",
            issue['owner'],
            'roadmap',
            'Backlog'
        ])

print("CSV created: linear_issues.csv")
```

### Step 2: Import CSV to Linear

1. Go to Linear project settings
2. Click **"Import"**
3. Select **"CSV"**
4. Upload `linear_issues.csv`
5. Map columns to Linear fields
6. Click **"Import"**

---

## Option 3: API Import (Fastest)

### Step 1: Use Linear GraphQL API

Create a Python script to import all issues via API:

```python
#!/usr/bin/env python3
import json
import requests
from datetime import datetime

LINEAR_API_URL = "https://api.linear.app/graphql"
LINEAR_API_KEY = "lin_api_AmL4ouK5KmUslsp93FOliet45OWkf1nAUpumdEYi"
TEAM_ID = "OLD"

def create_issue(title, description, priority, effort_hours, cycle_id, assignee):
    """Create a Linear issue via API."""
    
    query = """
    mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
            issue {
                id
                identifier
                title
            }
        }
    }
    """
    
    priority_map = {"URGENT": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4}
    
    variables = {
        "input": {
            "teamId": TEAM_ID,
            "title": title,
            "description": description,
            "priority": priority_map.get(priority, 3),
            "estimate": int(effort_hours * 8),
        }
    }
    
    if cycle_id:
        variables["input"]["cycleId"] = cycle_id
    
    headers = {
        "Authorization": f"Bearer {LINEAR_API_KEY}",
        "Content-Type": "application/json",
    }
    
    response = requests.post(
        LINEAR_API_URL,
        json={"query": query, "variables": variables},
        headers=headers,
    )
    
    result = response.json()
    if "errors" in result:
        print(f"Error creating issue: {result['errors']}")
        return None
    
    return result["data"]["issueCreate"]["issue"]

def main():
    with open('LINEAR_ISSUES.json', 'r') as f:
        data = json.load(f)
    
    print(f"Importing {len(data['issues'])} issues...")
    
    created = 0
    for issue in data['issues']:
        result = create_issue(
            title=issue['title'],
            description=issue['description'],
            priority=issue['priority'],
            effort_hours=issue['effort_hours'],
            cycle_id=f"sprint-{issue['sprint']}",
            assignee=issue['owner']
        )
        
        if result:
            created += 1
            print(f"✓ Created {result['identifier']}: {result['title']}")
        else:
            print(f"✗ Failed to create: {issue['title']}")
    
    print(f"\nImported {created}/{len(data['issues'])} issues")

if __name__ == "__main__":
    main()
```

### Step 2: Run the Script

```bash
python3 import_linear_issues.py
```

---

## Issue Structure

### Each Issue Contains

```json
{
  "sprint": 1,
  "section": "1A",
  "id": "1.A.1",
  "title": "Task Title",
  "description": "Detailed description of what needs to be done",
  "effort_hours": 2,
  "priority": "URGENT",
  "owner": "Dev1",
  "depends_on": ["1.A.1"],
  "related_files": ["path/to/file.tsx"]
}
```

### Field Mappings to Linear

| JSON Field | Linear Field | Notes |
|-----------|-------------|-------|
| `title` | Title | Issue name |
| `description` | Description | Full task description |
| `effort_hours` | Estimate | Multiply by 8 for story points |
| `priority` | Priority | URGENT → Urgent, HIGH → High |
| `owner` | Assignee | Dev1 or Dev2 |
| `depends_on` | Links | Create "Blocks" relationship |
| `related_files` | Description (append) | Add to description for reference |

---

## Sprint Organization

### Sprint 1: Critical Blockers & Fixes
- **Duration**: 2 weeks (Feb 10-24)
- **Issues**: 16
- **Effort**: 37 hours
- **Team**: 1 developer (Dev1)
- **Focus**: Production blockers, data integrity, performance

**Key Issues**:
- 1.A.2: Connect Expo Screen to useKDSInventory()
- 1.B.2: Implement Reverse Operation Order
- 1.C.2: Implement Batch Query for Order Items

### Sprint 2: Authentication & Security
- **Duration**: 2 weeks (Feb 24-Mar 10)
- **Issues**: 16
- **Effort**: 40 hours
- **Team**: 1 developer (Dev1)
- **Focus**: Unified auth, token refresh, CSRF protection

**Key Issues**:
- 2.A.2: Update Backend OAuth Endpoint
- 2.B.2: Implement getValidToken() Function
- 2.C.1: Add CSRF Token Generation

### Sprint 3: Code Quality & Maintainability
- **Duration**: 2 weeks (Mar 10-24)
- **Issues**: 27
- **Effort**: 70 hours
- **Team**: 2 developers (Dev1 + Dev2)
- **Focus**: TypeScript types, code duplication, service modularization

**Key Issues**:
- 3.A.1: Create service-types.ts
- 3.B.1: Create use-crud-list Hook
- 3.C.1: Plan Service Modularization
- 3.D.1: Create service-result.ts Type

### Sprint 4: Offline Sync & Scalability
- **Duration**: 2 weeks (Mar 24-Apr 7)
- **Issues**: 23
- **Effort**: 60 hours
- **Team**: 2 developers (Dev1 + Dev2)
- **Focus**: Offline queues, conflict resolution, server-side filtering, validation

**Key Issues**:
- 4.A.3: Migrate KDS to OfflineSyncManager
- 4.B.2: Implement Conflict Detection
- 4.C.2: Update getEvents() with Filters
- 4.D.1: Create event-schema.ts

---

## Team Assignment

### Developer 1 (Dev1)
- **Sprints**: All 4
- **Total Hours**: 137 hours
- **Focus**: Backend, infrastructure, core systems
- **Responsibilities**:
  - KDS integration and optimization
  - Authentication and security
  - Service architecture
  - Error handling standardization
  - Offline sync systems
  - Conflict resolution logic
  - Testing and validation

### Developer 2 (Dev2)
- **Sprints**: 3 and 4 only
- **Total Hours**: 43 hours
- **Focus**: Frontend, UI integration, forms
- **Responsibilities**:
  - Form component updates
  - Page refactoring
  - UI component integration
  - Conflict resolution UI
  - Server-side filtering UI
  - Form validation integration

---

## Parallel Work Opportunities

### Sprint 1
- **Sequential only** - All tasks have dependencies
- **Recommendation**: Single developer focus

### Sprint 2
- **Parallel possible**: 2A, 2B, 2C can run in parallel
- **Recommendation**: Keep sequential for focus

### Sprint 3
- **Parallel recommended**:
  - Dev1: 3A (Types) → 3C (Services) → 3D (Errors)
  - Dev2: 3B (Hooks) in parallel
- **Opportunity**: Dev1 can assist with 3.C.10 (imports) if 3B finishes early

### Sprint 4
- **Parallel recommended**:
  - Dev1: 4A (Queues) → 4B (Conflicts) → 4D (Validation)
  - Dev2: 4C (Filtering) in parallel
- **Opportunity**: Dev1 can assist with 4.C.6 (UI) if 4B finishes early

---

## Success Criteria

### Sprint 1 Complete When
- [ ] All KDS screens connected to real data
- [ ] Inventory rollback issue fixed
- [ ] N+1 queries eliminated
- [ ] All 16 issues closed
- [ ] E2E KDS test passing

### Sprint 2 Complete When
- [ ] Unified auth working on mobile and web
- [ ] Token refresh implemented
- [ ] CSRF protection active
- [ ] All 16 issues closed
- [ ] Security audit passed

### Sprint 3 Complete When
- [ ] TypeScript errors: 201 → 0
- [ ] Code duplication: ~1,200 lines → <100 lines
- [ ] All services properly typed
- [ ] All pages use use-crud-list hook
- [ ] All 27 issues closed

### Sprint 4 Complete When
- [ ] Offline queues unified
- [ ] Conflict resolution working
- [ ] Server-side filtering active
- [ ] Input validation comprehensive
- [ ] All 23 issues closed

---

## Monitoring & Tracking

### Weekly Standup Checklist
- [ ] All issues have status updates
- [ ] Blockers identified and escalated
- [ ] Dependencies on track
- [ ] Effort estimates accurate
- [ ] Team velocity tracked

### Sprint Review Checklist
- [ ] All issues closed or moved to next sprint
- [ ] Acceptance criteria met
- [ ] Code reviewed and merged
- [ ] Tests passing
- [ ] Documentation updated

### Velocity Tracking

Track velocity across sprints:

| Sprint | Planned | Completed | Velocity | Trend |
|--------|---------|-----------|----------|-------|
| 1 | 37h | - | - | - |
| 2 | 40h | - | - | - |
| 3 | 70h | - | - | - |
| 4 | 60h | - | - | - |

---

## Troubleshooting

### Issue: Dependencies Not Showing

**Solution**: After creating all issues, manually link dependencies:
1. Open issue in Linear
2. Click "Links" section
3. Click "Add link"
4. Select "Blocks" relationship
5. Search for blocking issue

### Issue: Assignee Not Available

**Solution**: Ensure team members are added to Linear team:
1. Go to Team Settings
2. Click "Members"
3. Add Dev1 and Dev2 email addresses
4. Assign issues to their accounts

### Issue: Cycle Not Found

**Solution**: Create cycles first before importing:
1. Go to Cycles in Linear
2. Create 4 cycles with dates from sprints
3. Reference cycle IDs when importing

### Issue: Priority Not Mapping Correctly

**Solution**: Use Linear's priority levels:
- URGENT → 1 (Urgent)
- HIGH → 2 (High)
- MEDIUM → 3 (Medium)
- LOW → 4 (Low)

---

## Next Steps After Import

1. **Review Issues**: Team reviews all 82 issues
2. **Clarify Dependencies**: Ensure all dependencies are correctly linked
3. **Assign Owners**: Confirm Dev1 and Dev2 assignments
4. **Sprint Planning**: Schedule sprint planning meetings
5. **Kickoff Sprint 1**: Start with critical blockers

---

## Resources

- **Linear Documentation**: https://linear.app/docs
- **GraphQL API Reference**: https://developers.linear.app/graphql-reference
- **Team Settings**: https://linear.app/olde-king-catering/settings/members
- **Cycles**: https://linear.app/olde-king-catering/cycles

---

## Support

For questions or issues with the import:

1. Check `TECHNICAL_ROADMAP.md` for detailed task descriptions
2. Review `SPRINT_TASK_BREAKDOWN.md` for task dependencies
3. Refer to `LINEAR_ISSUES.json` for complete issue data

---

**Last Updated**: February 3, 2026  
**Status**: Ready for Import  
**Contact**: AI Coordination Agent
