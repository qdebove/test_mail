"use client";

type SpinnerProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE_MAP: Record<Required<SpinnerProps>["size"], string> = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-4",
};

export default function Spinner({ label, size = "md" }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-gray-600">
      <span
        className={`inline-block animate-spin rounded-full border-gray-200 border-t-gray-600 ${SIZE_MAP[size]}`}
        aria-hidden="true"
      />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

