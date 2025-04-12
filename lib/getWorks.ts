import projectImage from "@/public/window.svg";

export default function getWorks() {
  const works = [
    {
      id: 1,
      title: "プロジェクト1",
      description: "プロジェクト1の説明",
      image: projectImage,
      tags: ["React", "Next.js", "Tailwind CSS"],
      demoLink: "#",
      codeLink: "#",
    },
    {
      id: 2,
      title: "プロジェクト2",
      description: "プロジェクト2の説明",
      image: "/placeholder.svg?height=300&width=500",
      tags: ["React", "Next.js", "Tailwind CSS"],
      demoLink: "#",
      codeLink: "#",
    },
    // 他のプロジェクトも同様に追加
  ];

  return works;
}