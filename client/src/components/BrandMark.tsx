interface Props { className?: string; }
export default function BrandMark({ className = '' }: Props) {
  return (
    <span className={`font-display text-accent select-none ${className}`} aria-label="Kanmani">ஃ</span>
  );
}
