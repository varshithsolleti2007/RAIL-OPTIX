import DepartmentDashboard from "./DepartmentDashboard";

export default function EngineeringDashboard() {
  return (
    <DepartmentDashboard
      departmentName="Engineering"
      workTypes={["Track Maintenance", "Track Inspection", "Civil Maintenance"]}
    />
  );
}
