import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const SendIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
)

export const StopIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="7" y="7" width="10" height="10" rx="2" />
  </Icon>
)

export const SparkIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5" />
  </Icon>
)

export const DocIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </Icon>
)

export const CopyIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </Icon>
)

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
)

export const PrintIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
    <rect x="7" y="14" width="10" height="7" rx="1" />
  </Icon>
)

export const RefreshIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
  </Icon>
)

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
)

export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Icon>
)

export const ShieldIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
)

export const ScaleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4v16M8 20h8M5 8h14M5 8l-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z" />
  </Icon>
)

export const LeafIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z" />
    <path d="M5 19l7-7" />
  </Icon>
)

export const AlertIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4M12 17.5v.01" />
  </Icon>
)
