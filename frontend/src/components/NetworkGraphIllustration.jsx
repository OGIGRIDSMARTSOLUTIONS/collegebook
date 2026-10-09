// A deliberately simple, deterministic illustration of connected nodes
// across clusters — the literal shape of the product (students, grouped
// by institution, connected across the graph). Not decoration for its
// own sake: this is the one image in the whole app that gets to be bold.
export function NetworkGraphIllustration({ className = '' }) {
  const clusterA = [
    [60, 90], [110, 60], [130, 120], [70, 150],
  ];
  const clusterB = [
    [320, 70], [370, 110], [340, 160],
  ];
  const clusterC = [
    [220, 260], [180, 300], [260, 310],
  ];
  const crossLinks = [
    [clusterA[1], clusterB[0]],
    [clusterA[2], clusterC[0]],
    [clusterB[2], clusterC[0]],
  ];
  const clusterLinks = (nodes) =>
    nodes.flatMap((a, i) => nodes.slice(i + 1).map((b) => [a, b]));

  const allLinks = [...clusterLinks(clusterA), ...clusterLinks(clusterB), ...clusterLinks(clusterC), ...crossLinks];
  const allNodes = [...clusterA, ...clusterB, ...clusterC];

  return (
    <svg
      viewBox="0 0 420 380"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {allLinks.map(([[x1, y1], [x2, y2]], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeOpacity={crossLinks.some(([a, b]) => (a[0] === x1 && a[1] === y1) || (b[0] === x1 && b[1] === y1))
            ? 0.35
            : 0.5}
          strokeWidth="1.5"
        />
      ))}
      {allNodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 4 === 0 ? 7 : 5} fill="currentColor" />
      ))}
    </svg>
  );
}
