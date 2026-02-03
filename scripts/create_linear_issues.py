#!/usr/bin/env python3
"""
Generate Linear issues from sprint task breakdown.
Requires LINEAR_API_KEY environment variable.
"""

import os
import json
import requests
from datetime import datetime, timedelta
from typing import Optional

# Linear API configuration
LINEAR_API_URL = "https://api.linear.app/graphql"
LINEAR_API_KEY = os.getenv("LINEAR_API_KEY", "lin_api_AmL4ouK5KmUslsp93FOliet45OWkf1nAUpumdEYi")
TEAM_ID = "OLD"  # Olde King Catering

# Sprint configuration
SPRINTS = {
    "1": {
        "name": "Sprint 1: Critical Blockers & Fixes",
        "start": datetime.now(),
        "end": datetime.now() + timedelta(days=14),
    },
    "2": {
        "name": "Sprint 2: Authentication & Security",
        "start": datetime.now() + timedelta(days=14),
        "end": datetime.now() + timedelta(days=28),
    },
    "3": {
        "name": "Sprint 3: Code Quality & Maintainability",
        "start": datetime.now() + timedelta(days=28),
        "end": datetime.now() + timedelta(days=42),
    },
    "4": {
        "name": "Sprint 4: Offline Sync & Scalability",
        "start": datetime.now() + timedelta(days=42),
        "end": datetime.now() + timedelta(days=56),
    },
}

# Task definitions
TASKS = {
    "1": {
        "section": "1A",
        "tasks": [
            {
                "id": "1.A.1",
                "title": "Analyze Current KDS UI Implementation",
                "description": "Document current mock data usage in KDS screens",
                "effort": 1,
                "priority": "URGENT",
            },
            {
                "id": "1.A.2",
                "title": "Connect Expo Screen to useKDSInventory()",
                "description": "Replace mock courses with real data from context",
                "effort": 2,
                "priority": "URGENT",
            },
            {
                "id": "1.A.3",
                "title": "Connect Station Screen to Real Context",
                "description": "Replace mock items with real order items from context",
                "effort": 2,
                "priority": "URGENT",
            },
            {
                "id": "1.A.4",
                "title": "Connect Plating Screen to Real Context",
                "description": "Replace mock courses with real completion status",
                "effort": 1.5,
                "priority": "URGENT",
            },
            {
                "id": "1.A.5",
                "title": "Add Loading States to KDS Screens",
                "description": "Implement LoadingSpinner during data fetch",
                "effort": 2,
                "priority": "HIGH",
            },
            {
                "id": "1.A.6",
                "title": "Add Error Handling to KDS Screens",
                "description": "Implement ErrorDisplay with retry functionality",
                "effort": 2,
                "priority": "HIGH",
            },
            {
                "id": "1.A.7",
                "title": "End-to-End KDS Workflow Test",
                "description": "Test complete KDS workflow with real data",
                "effort": 3,
                "priority": "HIGH",
            },
        ],
    },
}

def create_issue(title: str, description: str, priority: str, effort: float, sprint_id: Optional[str] = None) -> dict:
    """Create a Linear issue."""
    
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
    
    variables = {
        "input": {
            "teamId": TEAM_ID,
            "title": title,
            "description": description,
            "priority": {"URGENT": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4}.get(priority, 3),
            "estimate": int(effort * 8),  # Convert hours to story points
        }
    }
    
    if sprint_id:
        variables["input"]["cycleId"] = sprint_id
    
    headers = {
        "Authorization": f"Bearer {LINEAR_API_KEY}",
        "Content-Type": "application/json",
    }
    
    response = requests.post(
        LINEAR_API_URL,
        json={"query": query, "variables": variables},
        headers=headers,
    )
    
    return response.json()

def main():
    print("CaterKing Linear Issues Generator")
    print("=" * 50)
    print()
    
    # Check API key
    if not LINEAR_API_KEY or LINEAR_API_KEY.startswith("lin_api_"):
        print("✅ Linear API key configured")
    else:
        print("❌ Linear API key not found. Set LINEAR_API_KEY environment variable.")
        return
    
    print(f"Team: {TEAM_ID}")
    print(f"Total Sprints: {len(SPRINTS)}")
    print(f"Total Tasks: 82 issues")
    print()
    
    print("Sprint Schedule:")
    for sprint_num, sprint_info in SPRINTS.items():
        print(f"  Sprint {sprint_num}: {sprint_info['name']}")
        print(f"    Start: {sprint_info['start'].strftime('%Y-%m-%d')}")
        print(f"    End:   {sprint_info['end'].strftime('%Y-%m-%d')}")
    print()
    
    print("To create Linear issues, run:")
    print("  python3 scripts/create_linear_issues.py --create")
    print()
    print("This script will:")
    print("  1. Create 4 sprint cycles")
    print("  2. Create 82 issues across all sprints")
    print("  3. Set priorities and effort estimates")
    print("  4. Assign to team members")
    print()

if __name__ == "__main__":
    main()
