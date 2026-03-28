type ButtonProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
};

export function Button({ label, onClick, disabled = false, variant = "primary" }: ButtonProps) {
  const base = "px-4 py-2 rounded font-medium transition-colors";
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}
