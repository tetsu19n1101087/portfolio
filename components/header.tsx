import Link from "next/link"

export function Header() {
  return (
    <header className="px-4 lg:px-6 h-14 flex items-center">
      <Link className="flex items-center justify-center" href="/">
        <span className="font-bold">Home</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6">
        <Link className="text-sm font-medium hover:underline underline-offset-4" href="/about">
          About
        </Link>
        <Link className="text-sm font-medium hover:underline underline-offset-4" href="/works">
          Works
        </Link>
        {/* <Link className="text-sm font-medium hover:underline underline-offset-4" href="/contact">
          Contact
        </Link> */}
      </nav>
    </header>
  )
}
