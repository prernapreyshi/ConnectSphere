export default function Avatar({ src, name = "", size = "md", className = "" }) {
  const sizes = { xs: "w-6 h-6 text-xs", sm: "w-8 h-8 text-sm", md: "w-10 h-10 text-sm",
                  lg: "w-16 h-16 text-xl", xl: "w-24 h-24 text-3xl" };

  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white ${className}`} />;
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-brand-100 flex items-center justify-center font-semibold text-brand-700 ring-2 ring-white ${className}`}>
      {initials || "?"}
    </div>
  );
}
