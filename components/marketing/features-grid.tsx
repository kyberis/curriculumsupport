import { features } from "@/lib/marketing-content";

export function FeaturesGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <div
          key={feature.title}
          className="rounded-lg border border-white/10 bg-[#161b22] p-6"
        >
          <feature.icon className="mb-3 h-6 w-6 text-amber-500" />
          <h3 className="mb-1.5 font-semibold text-neutral-100">
            {feature.title}
          </h3>
          <p className="text-sm leading-relaxed text-neutral-400">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}
