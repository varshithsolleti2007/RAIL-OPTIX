import DepartmentDashboard from "./DepartmentDashboard";

export default function SnTDashboard() {
  return (
    <DepartmentDashboard
      departmentName="S&T"
      workTypes={["Signal Maintenance", "Interlocking Work", "Telecom Maintenance"]}
    />
  );
}
