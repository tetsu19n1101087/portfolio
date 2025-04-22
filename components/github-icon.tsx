import Image from "next/image"

interface GitHubIconProps {
  className?: string
  size?: number
}

export function GitHubIcon({ className, size = 24 }: GitHubIconProps) {
  return <Image src="/github-mark.svg" alt="GitHub" width={size} height={size} className={className} />
}
