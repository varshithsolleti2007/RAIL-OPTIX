import DepartmentDashboard from "./DepartmentDashboard";

export default function ElectricalDashboard() {
  return (
    <DepartmentDashboard
      departmentName="Electrical"
      workTypes={["OHE Maintenance", "Electrical Inspection", "Traction Work"]}
    />
  );
}
