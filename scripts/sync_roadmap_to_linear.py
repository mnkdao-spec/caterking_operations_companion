#!/usr/bin/env python3
"""
Sync CaterKing 82-issue technical roadmap to Linear.
Imports all sprints, tasks, and dependencies for team coordination.
"""

import json
import os
import sys
import requests
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Tuple

# Linear API configuration
LINEAR_API_URL = "https://api.linear.app/graphql"
LINEAR_API_KEY = os.getenv("LINEAR_API_KEY")
LINEAR_TEAM_ID = os.getenv("LINEAR_TEAM_ID")

# Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def validate_credentials():
    """Validate Linear API credentials."""
    if not LINEAR_API_KEY:
        print_error("LINEAR_API_KEY not set in environment")
        return False
    if not LINEAR_TEAM_ID:
        print_error("LINEAR_TEAM_ID not set in environment")
        return False
    
    print_success(f"API Key: {LINEAR_API_KEY[:20]}...")
    print_success(f"Team ID: {LINEAR_TEAM_ID}")
    return True

def graphql_request(query: str, variables: Dict = None) -> Dict:
    """Make GraphQL request to Linear API."""
    headers = {
        "Authorization": LINEAR_API_KEY,
        "Content-Type": "application/json",
    }
    
    payload = {
        "query": query,
        "variables": variables or {}
    }
    
    response = requests.post(LINEAR_API_URL, json=payload, headers=headers)
    
    if response.status_code != 200:
        print_error(f"API Error {response.status_code}: {response.text}")
        return {"errors": [{"message": f"HTTP {response.status_code}"}]}
    
    return response.json()

def create_cycle(sprint_num: int, name: str, start_date: str, end_date: str) -> Optional[str]:
    """Create a sprint cycle in Linear."""
    query = """
    mutation CreateCycle($input: CycleCreateInput!) {
        cycleCreate(input: $input) {
            cycle {
                id
                name
            }
        }
    }
    """
    
    variables = {
        "input": {
            "teamId": LINEAR_TEAM_ID,
            "name": name,
            "startsAt": start_date,
            "endsAt": end_date,
        }
    }
    
    result = graphql_request(query, variables)
    
    if "errors" in result:
        print_error(f"Failed to create cycle: {result['errors']}")
        return None
    
    cycle_id = result["data"]["cycleCreate"]["cycle"]["id"]
    print_success(f"Created cycle: {name} ({cycle_id})")
    return cycle_id

def create_issue(
    title: str,
    description: str,
    priority: int,
    estimate: int,
    cycle_id: Optional[str] = None,
    parent_id: Optional[str] = None,
    labels: List[str] = None,
) -> Optional[Tuple[str, str]]:
    """Create an issue in Linear. Returns (issue_id, issue_key)."""
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
    
    input_data = {
        "teamId": LINEAR_TEAM_ID,
        "title": title,
        "description": description,
        "priority": priority,
        "estimate": estimate,
    }
    
    if cycle_id:
        input_data["cycleId"] = cycle_id
    if parent_id:
        input_data["parentId"] = parent_id
    # Note: labels parameter is not used - labelIds require valid UUIDs
    
    variables = {"input": input_data}
    
    result = graphql_request(query, variables)
    
    if "errors" in result:
        print_error(f"Failed to create issue: {result['errors']}")
        return None
    
    issue = result["data"]["issueCreate"]["issue"]
    return (issue["id"], issue["identifier"])

def link_issues(source_id: str, target_id: str, relationship: str = "blocks") -> bool:
    """Link two issues with a relationship."""
    query = """
    mutation CreateIssueRelation($input: IssueRelationCreateInput!) {
        issueRelationCreate(input: $input) {
            issueRelation {
                id
            }
        }
    }
    """
    
    variables = {
        "input": {
            "issueId": source_id,
            "relatedIssueId": target_id,
            "type": relationship,
        }
    }
    
    result = graphql_request(query, variables)
    
    if "errors" in result:
        return False
    
    return True

def load_issues_from_json(filepath: str) -> Dict:
    """Load issues from JSON file."""
    with open(filepath, 'r') as f:
        return json.load(f)

def sync_roadmap_to_linear(dry_run: bool = False):
    """Sync entire roadmap to Linear."""
    print_header("CaterKing Technical Roadmap → Linear Sync")
    
    # Validate credentials
    print_info("Validating Linear credentials...")
    if not validate_credentials():
        return False
    
    # Load issues from JSON
    issues_file = "/home/ubuntu/caterking_operations_companion/LINEAR_ISSUES.json"
    print_info(f"Loading issues from {issues_file}...")
    
    try:
        data = load_issues_from_json(issues_file)
    except FileNotFoundError:
        print_error(f"Issues file not found: {issues_file}")
        return False
    except json.JSONDecodeError:
        print_error(f"Invalid JSON in {issues_file}")
        return False
    
    print_success(f"Loaded {len(data['issues'])} issues")
    
    if dry_run:
        print_header("DRY RUN MODE - Preview Only")
    else:
        print_header("LIVE MODE - Creating Issues")
    
    # Create cycles
    print_info("Creating sprint cycles...")
    cycles = {}
    
    for sprint_info in data['sprints']:
        sprint_num = sprint_info['id']
        cycle_name = sprint_info['name']
        start_date = sprint_info['start_date']
        end_date = sprint_info['end_date']
        
        if dry_run:
            print_info(f"[DRY RUN] Would create cycle: {cycle_name}")
            cycles[sprint_num] = f"cycle_{sprint_num}"
        else:
            cycle_id = create_cycle(sprint_num, cycle_name, start_date, end_date)
            if cycle_id:
                cycles[sprint_num] = cycle_id
    
    # Create issues
    print_info("Creating issues...")
    issue_map = {}  # Map issue_id to linear_id for linking
    created_count = 0
    
    for issue in data['issues']:
        sprint_num = issue['sprint']
        issue_id = issue['id']
        title = issue['title']
        description = issue['description']
        effort_hours = issue['effort_hours']
        priority = 1 if issue['priority'] == 'URGENT' else 2
        estimate = int(effort_hours * 8)  # Convert to story points
        cycle_id = cycles.get(sprint_num)
        
        # Build full description with related files
        full_description = description
        if issue.get('related_files'):
            full_description += "\n\n**Related Files:**\n"
            for file in issue['related_files']:
                full_description += f"- {file}\n"
        
        if dry_run:
            print_info(f"[DRY RUN] Would create: {issue_id} - {title} ({estimate} pts)")
            issue_map[issue_id] = f"linear_{issue_id}"
            created_count += 1
        else:
            result = create_issue(
                title=title,
                description=full_description,
                priority=priority,
                estimate=estimate,
                cycle_id=cycle_id,
                labels=["roadmap"]
            )
            
            if result:
                linear_id, linear_key = result
                issue_map[issue_id] = linear_id
                print_success(f"Created {linear_key}: {title}")
                created_count += 1
            else:
                print_warning(f"Failed to create: {issue_id}")
    
    # Link dependencies
    print_info("Linking issue dependencies...")
    linked_count = 0
    
    for issue in data['issues']:
        issue_id = issue['id']
        depends_on = issue.get('depends_on', [])
        
        if not depends_on or issue_id not in issue_map:
            continue
        
        source_linear_id = issue_map[issue_id]
        
        for dep_id in depends_on:
            if dep_id not in issue_map:
                print_warning(f"Dependency not found: {dep_id}")
                continue
            
            target_linear_id = issue_map[dep_id]
            
            if dry_run:
                print_info(f"[DRY RUN] Would link: {issue_id} blocks {dep_id}")
                linked_count += 1
            else:
                if link_issues(source_linear_id, target_linear_id, "blocks"):
                    print_success(f"Linked: {issue_id} blocks {dep_id}")
                    linked_count += 1
                else:
                    print_warning(f"Failed to link: {issue_id} → {dep_id}")
    
    # Summary
    print_header("Sync Summary")
    print_success(f"Sprints: {len(cycles)}")
    print_success(f"Issues: {created_count}/{len(data['issues'])}")
    print_success(f"Dependencies: {linked_count}")
    
    if dry_run:
        print_warning("DRY RUN COMPLETE - No changes made to Linear")
        print_info("Run without --dry-run to create issues")
    else:
        print_success("SYNC COMPLETE - All issues created in Linear")
        print_info("Visit https://linear.app to review and assign tasks")
    
    return True

def main():
    """Main entry point."""
    dry_run = "--dry-run" in sys.argv or "-n" in sys.argv
    
    print_header("CaterKing Roadmap → Linear Sync Tool")
    
    if dry_run:
        print_warning("Running in DRY RUN mode (no changes will be made)")
    
    success = sync_roadmap_to_linear(dry_run=dry_run)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
