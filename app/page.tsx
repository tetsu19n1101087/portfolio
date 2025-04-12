import Image from "next/image"
import Link from "next/link"
import { Github, Mail, Linkedin, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="#">
          <span className="font-bold">Portfolio</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#about">
            About
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#projects">
            Projects
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#skills">
            Skills
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#contact">
            Contact
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4 text-center md:text-left">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">あなたの名前</h1>
                  <p className="text-gray-500 md:text-xl dark:text-gray-400">ウェブ開発者 & デザイナー</p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300">
                    <Link href="#contact">お問い合わせ</Link>
                  </Button>
                  <Button variant="outline">
                    <Link href="#projects">プロジェクトを見る</Link>
                  </Button>
                </div>
                <div className="flex gap-4">
                  <Link href="#" target="_blank" rel="noreferrer">
                    <Github className="h-5 w-5" />
                    <span className="sr-only">GitHub</span>
                  </Link>
                  <Link href="#" target="_blank" rel="noreferrer">
                    <Linkedin className="h-5 w-5" />
                    <span className="sr-only">LinkedIn</span>
                  </Link>
                  <Link href="mailto:email@example.com">
                    <Mail className="h-5 w-5" />
                    <span className="sr-only">Email</span>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center mb-8 md:mb-0">
                <Image
                  alt="Profile"
                  className="rounded-full object-cover border-4 border-gray-100 dark:border-gray-800"
                  height={400}
                  width={400}
                  src="/placeholder.svg?height=400&width=400"
                  priority
                />
              </div>
            </div>
          </div>
        </section>
        <section id="about" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">私について</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  ここにあなたの経歴や自己紹介を書きます。あなたのスキル、経験、情熱について説明してください。
                  読者があなたについてもっと知りたいと思うような魅力的な内容にしましょう。
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="projects" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">プロジェクト</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  これまでに手がけたプロジェクトをご紹介します。
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 sm:grid-cols-2 gap-6 py-12 lg:gap-8">
              {[1, 2, 3, 4].map((project) => (
                <Card key={project} className="overflow-hidden">
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={`/placeholder.svg?height=300&width=500`}
                      alt={`Project ${project}`}
                      className="object-cover"
                      fill
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-xl font-bold">プロジェクト {project}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      プロジェクトの説明をここに書きます。使用した技術や、解決した課題について説明してください。
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge>React</Badge>
                      <Badge>Next.js</Badge>
                      <Badge>Tailwind CSS</Badge>
                    </div>
                    <div className="flex gap-4 mt-4">
                      <Button size="sm" variant="outline" className="gap-1">
                        <ExternalLink className="h-4 w-4" />
                        デモを見る
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Github className="h-4 w-4" />
                        コード
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section id="skills" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">スキル</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  私が持っているスキルと技術をご紹介します。
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 py-12">
              {[
                "HTML & CSS",
                "JavaScript",
                "React",
                "Next.js",
                "TypeScript",
                "Tailwind CSS",
                "Node.js",
                "Git",
                "UI/UX Design",
                "Responsive Design",
                "API Integration",
                "Database Design",
              ].map((skill) => (
                <div
                  key={skill}
                  className="flex flex-col items-center space-y-2 p-4 bg-white dark:bg-gray-950 rounded-lg shadow-sm"
                >
                  <div className="rounded-full bg-gray-100 p-2 dark:bg-gray-800">
                    <div className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 text-center">
                    <h3 className="text-sm font-medium">{skill}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="contact" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">お問い合わせ</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  プロジェクトのご相談やお問い合わせはこちらからお願いします。
                </p>
              </div>
              <div className="w-full max-w-md mx-auto space-y-2">
                <form className="flex flex-col space-y-4">
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="お名前"
                    type="text"
                  />
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="メールアドレス"
                    type="email"
                  />
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="メッセージ"
                  />
                  <Button type="submit">送信</Button>
                </form>
              </div>
              <div className="flex gap-4 mt-4">
                <Link href="#" target="_blank" rel="noreferrer">
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </Link>
                <Link href="#" target="_blank" rel="noreferrer">
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </Link>
                <Link href="mailto:email@example.com">
                  <Mail className="h-5 w-5" />
                  <span className="sr-only">Email</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center justify-center sm:justify-between px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 あなたの名前. All rights reserved.</p>
        <nav className="flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#about">
            About
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#projects">
            Projects
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#contact">
            Contact
          </Link>
        </nav>
      </footer>
    </div>
  )
}
