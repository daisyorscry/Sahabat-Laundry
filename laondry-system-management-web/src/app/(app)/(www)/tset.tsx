import * as React from "react";
import { SVGProps } from "react";

const SvgComponent = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={380} height={320} fill="none" {...props}>
    <rect
      width={180}
      height={200}
      x={40}
      y={60}
      fill="#E6EBF2"
      stroke="rgba(15,23,42,0.6)"
      strokeWidth={2}
      rx={12}
    />
    <circle cx={130} cy={160} r={60} fill="#DDE6EF" stroke="rgba(15,23,42,0.4)" strokeWidth={3} />
    <circle cx={130} cy={160} r={40} fill="#fff" opacity={0.9} />
    <circle cx={130} cy={160} r={38} fill="url(#a)" />
    <rect width={20} height={12} x={55} y={75} fill="rgba(15,23,42,0.3)" rx={2} />
    <rect width={20} height={12} x={80} y={75} fill="rgba(15,23,42,0.3)" rx={2} />
    <rect width={32} height={16} x={170} y={72} fill="rgba(15,23,42,0.2)" rx={3} />
    <rect
      width={40}
      height={90}
      x={240}
      y={150}
      fill="#F3F6FA"
      stroke="rgba(15,23,42,0.4)"
      strokeWidth={2}
      rx={8}
    />
    <rect width={20} height={20} x={250} y={130} fill="var(--brand-500)" rx={4} />
    <rect width={28} height={40} x={246} y={170} fill="var(--brand-400)" opacity={0.8} rx={4} />
    <rect
      width={120}
      height={70}
      x={200}
      y={60}
      fill="#F3F6FA"
      stroke="rgba(15,23,42,0.4)"
      strokeWidth={2}
      rx={10}
    />
    <path fill="var(--brand-500)" d="M210 80h100v30H210z" opacity={0.15} />
    <path
      fill="var(--brand-400)"
      d="M220 70c20 0 30 20 50 20s30-20 50-20v20H220V70z"
      opacity={0.6}
    />
    <circle cx={300} cy={200} r={24} fill="#E5E7EB" stroke="rgba(15,23,42,0.6)" strokeWidth={2} />
    <rect width={30} height={60} x={285} y={220} fill="#E5E7EB" rx={6} />
    <defs>
      <radialGradient
        id="a"
        cx={0}
        cy={0}
        r={1}
        gradientTransform="matrix(0 40 -40 0 130 160)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="var(--brand-400)" stopOpacity={0.7} />
        <stop offset="100%" stopColor="#fff" stopOpacity={0} />
      </radialGradient>
    </defs>
  </svg>
);
export default SvgComponent;
