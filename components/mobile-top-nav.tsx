import Link from "next/link";

const items = [
  { href: "/", label: "Overview" },
  { href: "/try", label: "Try On" },
  { href: "/history", label: "History" },
];

export function MobileTopNav() {
  return (
    <nav className="mx-auto flex max-w-6xl items-center gap-2 text-sm">
      {items.map((item) => {
        return (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-2 py-1 text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
