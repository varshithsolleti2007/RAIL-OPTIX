# Frontend PRD — Railway Block Planning System

## 1. Technology
- React + Vite
- React Router
- Axios
- Tailwind CSS
- Recharts
- Calendar/timeline library as required

## 2. Frontend Principles
- One application with role-aware navigation.
- Reusable components.
- Backend is the source of truth for authorization.
- No business-critical scheduling logic only in the browser.
- Loading, empty, success and error states for every data-driven view.

## 3. Route Structure

```text
/login

/admin/dashboard
/admin/users
/admin/departments
/admin/sections
/admin/audit

/control/dashboard
/control/requests
/control/conflicts
/control/schedule
/control/recommendations

/engineering/dashboard
/engineering/requests
/engineering/requests/new

/electrical/dashboard
/electrical/requests
/electrical/requests/new

/st/dashboard
/st/requests
/st/requests/new
```

## 4. Shared UI
- App shell
- Sidebar
- Top bar
- User/profile menu
- Notification center
- Status badge
- Priority badge
- Stat cards
- Data table
- Search/filter controls
- Request form
- Request detail drawer/page
- Conflict alert
- Schedule timeline
- Confirmation modal
- Toast/error feedback

## 5. Login
Fields:
- Email
- Password

Flow:
```text
Submit → POST /api/auth/login → receive token/user → store auth state → redirect by role
```

Invalid credentials must show a clear error without revealing security-sensitive details.

## 6. Department Dashboard
Each department dashboard must show:
- Total requests
- Pending
- Approved
- Rejected
- Upcoming blocks
- Recent requests
- Notifications
- Create request CTA

The content and work types change by department.

## 7. Control Dashboard
Show:
- Total pending requests
- Open conflicts
- Today's blocks
- Upcoming blocks
- Department workload
- Priority requests
- Conflict list
- Schedule timeline
- Recommendation panel

## 8. Request Form
Sections:
1. Work information
2. Railway section
3. Date/time
4. Priority
5. Resources
6. Constraints
7. Review and submit

Client validation:
- Required fields.
- End time after start time.
- Valid date.
- Valid section.
- No malformed resource data.

## 9. Conflict UI
Conflict card must display:
- Conflict severity
- Requests involved
- Section
- Overlap
- Cause
- Suggested alternatives where available
- Resolve action

## 10. Schedule UI
Provide:
- Day/week view
- Section-based timeline
- Department identification
- Status
- Start/end time
- Conflict highlighting
- Final/approved distinction

## 11. Recommendation UI
Display:
- Recommended time
- Conflict score
- Disruption score
- Confidence
- Explanation
- Accept / Modify / Reject

The UI must label recommendations as recommendations, not final decisions.

## 12. Responsive Behavior
Desktop is primary for control-room usage. Tablet support should be functional. Mobile should preserve core actions such as login, request status and notifications.

## 13. Frontend Acceptance Criteria
- Unauthorized routes are blocked.
- Correct dashboard appears for each role.
- All CRUD operations show feedback.
- Tables support filtering.
- Schedule is understandable without opening every request.
- No sensitive backend secrets exist in frontend code.
