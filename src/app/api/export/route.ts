import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
} from "docx"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const format = searchParams.get("format") || "docx"

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 })
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        chapters: {
          where: { status: "COMPLETE" },
          orderBy: { chapterNumber: "asc" },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.chapters.length === 0) {
      return NextResponse.json({ error: "No completed chapters to export" }, { status: 400 })
    }

    if (format === "docx") {
      return await exportDocx(project)
    }

    return await exportHtml(project)
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

async function exportDocx(project: {
  topic: string
  academicLevel: string
  department: string
  institution: string
  country: string
  methodology: string
  citationStyle: string
  chapters: { chapterNumber: number; title: string; content: string }[]
}) {
  const children: Paragraph[] = []

  // Title page
  children.push(
    new Paragraph({ spacing: { before: 3000 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: project.topic, bold: true, size: 32 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [new TextRun({ text: `Academic Level: ${project.academicLevel}`, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Department: ${project.department}`, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `${project.institution}, ${project.country}`, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: `Citation Style: ${project.citationStyle}`, size: 24 })],
    })
  )

  // Chapters
  for (const chapter of project.chapters) {
    children.push(new Paragraph({ children: [new PageBreak()] }))
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600, after: 400 },
        children: [
          new TextRun({
            text: `Chapter ${chapter.chapterNumber}: ${chapter.title}`,
            bold: true,
            size: 28,
          }),
        ],
      })
    )

    const paragraphs = chapter.content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean)

    for (const para of paragraphs) {
      if (para.startsWith("# ")) {
        children.push(
          new Paragraph({
            spacing: { before: 300, after: 200 },
            children: [
              new TextRun({
                text: para.replace(/^# /, ""),
                bold: true,
                size: 26,
              }),
            ],
          })
        )
      } else if (para.startsWith("## ")) {
        children.push(
          new Paragraph({
            spacing: { before: 200, after: 150 },
            children: [
              new TextRun({
                text: para.replace(/^## /, ""),
                bold: true,
                size: 24,
              }),
            ],
          })
        )
      } else if (para.startsWith("- ") || para.startsWith("* ")) {
        children.push(
          new Paragraph({
            spacing: { before: 60, after: 60 },
            indent: { left: 720 },
            children: [new TextRun({ text: para.substring(2), size: 22 })],
          })
        )
      } else {
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [new TextRun({ text: para, size: 22 })],
          })
        )
      }
    }
  }

  const doc = new Document({
    title: project.topic,
    description: `Research project - ${project.academicLevel}`,
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman", size: 22 },
          paragraph: { spacing: { line: 360 } },
        },
      },
    },
    sections: [{ children }],
  })

  const buffer = await Packer.toBuffer(doc)

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${sanitize(project.topic)}.docx"`,
      "Content-Length": buffer.length.toString(),
    },
  })
}

async function exportHtml(project: {
  topic: string
  academicLevel: string
  department: string
  institution: string
  country: string
  methodology: string
  citationStyle: string
  chapters: { chapterNumber: number; title: string; content: string }[]
}) {
  const chaptersHtml = project.chapters
    .map(
      (ch) => `
    <div class="chapter">
      <h2>Chapter ${ch.chapterNumber}: ${ch.title}</h2>
      ${ch.content
        .split(/\n\n+/)
        .map((p) => `<p>${p.trim()}</p>`)
        .join("")}
    </div>
  `
    )
    .join('<div class="page-break"></div>')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${project.topic}</title>
  <style>
    @page { margin: 2.54cm; }
    body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 2; color: #000; max-width: 21cm; margin: 0 auto; padding: 2.54cm; }
    h1 { text-align: center; font-size: 16pt; margin-bottom: 0.5cm; }
    h2 { font-size: 14pt; margin-top: 1cm; margin-bottom: 0.5cm; }
    p { text-align: justify; margin-bottom: 0.5cm; }
    .page-break { page-break-after: always; }
    .title-page { text-align: center; padding-top: 5cm; }
    .title-page h1 { font-size: 18pt; margin-bottom: 1cm; }
    .title-page p { text-align: center; font-size: 12pt; }
  </style>
</head>
<body>
  <div class="title-page">
    <h1>${project.topic}</h1>
    <p>Academic Level: ${project.academicLevel}</p>
    <p>Department: ${project.department}</p>
    <p>${project.institution}, ${project.country}</p>
    <p>Citation Style: ${project.citationStyle}</p>
  </div>
  <div class="page-break"></div>
  ${chaptersHtml}
</body>
</html>`

  const buffer = Buffer.from(html, "utf-8")

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${sanitize(project.topic)}.html"`,
      "Content-Length": buffer.length.toString(),
    },
  })
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_").substring(0, 100)
}
