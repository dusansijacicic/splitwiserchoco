function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-medium text-primary-dark"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={name}
    >
      {initials(name) || "?"}
    </div>
  );
}
