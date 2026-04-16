# Content Export --since Flag Design

## Overview

Add a `--since` flag to Katello's content export incremental endpoints that allows users to export all changes since a specific date by automatically finding the most recent export before that date and using it as the base for an incremental export.

## Problem Statement

Currently, incremental exports require knowing a specific `from_history_id` to use as a baseline. Users often want to export "all changes since last Tuesday" but have to manually find the appropriate export history ID. The `--since` flag provides a date-based interface for this common workflow.

## Solution Design

### API Changes

**New Parameter Added to Existing Endpoints:**
- `POST /content_export_incrementals/version`
- `POST /content_export_incrementals/library`  
- `POST /content_export_incrementals/repository`

**Parameter Definition:**
```ruby
param :since, String, :desc => N_("Export changes since this date. "\
  "Finds the most recent export before this date and uses it as base for incremental export. "\
  "Date format: ISO 8601 (e.g., '2024-01-15T10:30:00Z' or '2024-01-15'). "\
  "Cannot be used with from_history_id."), :required => false
```

### Core Implementation

**Modified `find_incremental_history` method in `ExportsController`:**

1. **If `since` parameter provided:**
   - Parse date using `.to_time` pattern (consistent with sync plans)
   - Query for most recent export before date for the same destination server
   - Use that export as `@history`
   - Error if no matching history found

2. **If `from_history_id` provided:** Use existing logic (unchanged)

3. **If neither provided:** Use latest export for destination server (unchanged)

**Query Logic:**
```ruby
if params[:since].present?
  since_time = params[:since].to_time
  @history = ContentViewVersionExportHistory
    .where(content_view_version: @view.content_view.versions)
    .where(destination_server: params[:destination_server])
    .where("created_at < ?", since_time)
    .order(created_at: :desc)
    .first
end
```

### Error Handling

**Parameter Validation:**
- **Conflicting Parameters:** Return 400 if both `since` and `from_history_id` provided
- **Invalid Date Format:** Return 400 with "Date format is incorrect" (matches sync plan pattern)

**Data Validation:**  
- **No History Before Date:** Return 404 with "No existing export history was found before [date] for destination server '[server]' to perform an incremental export. A full export must be performed"

### Implementation Scope

**Files to Modify:**
1. `app/controllers/katello/api/v2/exports_controller.rb` - Core logic
2. `app/controllers/katello/api/v2/content_export_incrementals_controller.rb` - Parameter definition
3. `test/controllers/api/v2/content_export_incrementals_controller_test.rb` - Test coverage

**Behavior Consistency:**
- Same logic applies to all three export types (version, library, repository)
- Destination server scoping maintained for consistency with existing incremental exports
- Date parsing follows established sync plan patterns

### Testing Strategy

**Unit Tests:**
- Valid since date with existing history → uses correct base export
- Invalid date format → returns 400 error
- No history before date → returns 404 error  
- Conflicting parameters (`since` + `from_history_id`) → returns 400 error
- Destination server filtering works correctly

**Integration Tests:**
- End-to-end export flow using since parameter across all three export types
- Verify incremental export produces expected content differences

### Success Criteria

1. **Functional:** Users can specify `--since 2024-01-15` and get an incremental export from the most recent export before that date
2. **Consistent:** Works identically across version/library/repository export types  
3. **Robust:** Clear error messages for invalid dates or missing history
4. **Compatible:** Existing `from_history_id` workflow unchanged

### Future Considerations

This design maintains the existing architecture and patterns, making it straightforward to extend with related features like `--until` dates or relative time expressions if needed.