import { inputClass } from "./TextField";

export default function SelectField({ label, className = "", children, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs font-medium text-slate">{label}</span>}
      <select className={`${inputClass} ${className}`} {...props}>
        {children}
      </select>
    </label>
  );
}
