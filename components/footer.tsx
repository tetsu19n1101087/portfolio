import Link from "next/link"

export function Footer() {
  return (
    <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center justify-center sm:justify-between px-4 md:px-6 border-t">
      <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 tetsu19n1101087 All rights reserved.</p>
      <nav className="flex gap-4 sm:gap-6">
        <Link className="text-xs hover:underline underline-offset-4" href="/about">
          About
        </Link>
        <Link className="text-xs hover:underline underline-offset-4" href="/works">
          Works
        </Link>
        <Link className="text-xs hover:underline underline-offset-4" href="/contact">
          Contact
        </Link>
      </nav>
    </footer>
  )
}
