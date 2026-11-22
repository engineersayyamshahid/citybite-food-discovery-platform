/** Grey shimmering box shown while content is "loading" */
export function Skeleton({ w = '100%', h = 16, r = 10, style, className = '' }) {
  return <div className={`skeleton ${className}`} style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />;
}

/** Skeleton that looks like one dish row */
export function DishRowSkeleton() {
  return (
    <div className="dish-row">
      <Skeleton w={84} h={84} r={16} />
      <div className="grow stack-sm">
        <Skeleton w="60%" h={16} />
        <Skeleton w="40%" h={12} />
        <Skeleton w="75%" h={12} />
      </div>
    </div>
  );
}

export function RestaurantRowSkeleton() {
  return (
    <div className="rest-row card">
      <Skeleton w={48} h={48} r={12} />
      <div className="grow stack-sm"><Skeleton w="50%" h={14} /><Skeleton w="30%" h={11} /></div>
    </div>
  );
}

export function HeroSkeleton() {
  return <Skeleton h={230} r={24} />;
}

export function ListSkeleton({ count = 4, row = DishRowSkeleton }) {
  const Row = row;
  return <div className="stack">{Array.from({ length: count }).map((_, i) => <Row key={i} />)}</div>;
}
