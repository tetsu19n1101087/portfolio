import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">About</h1>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  ここにあなたの経歴や自己紹介を書きます。あなたのスキル、経験、情熱について説明してください。
                  読者があなたについてもっと知りたいと思うような魅力的な内容にしましょう。
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Skills</h2>
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
      </main>
      <Footer />
    </div>
  )
}
