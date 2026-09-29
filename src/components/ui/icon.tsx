import type { LucideIcon } from "lucide-react";
import {
  Code2,
  Layers,
  Users,
  Database,
  Layout,
  Gauge,
  Compass,
  Terminal,
} from "lucide-react";

/**
 * Small icon registry. Importing from the `lucide-react` barrel is safe here
 * because Next already rewrites it to per-icon modules via
 * `optimizePackageImports`; this map just keeps the import surface tidy.
 */
const ICON_MAP = {
  code: Code2,
  layers: Layers,
  users: Users,
  database: Database,
  layout: Layout,
  gauge: Gauge,
  compass: Compass,
  terminal: Terminal,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICON_MAP;

export function Icon({
  name,
  ...props
}: { name: IconName } & React.ComponentProps<LucideIcon>) {
  const Cmp = ICON_MAP[name] ?? Code2;
  return <Cmp {...props} />;
}
