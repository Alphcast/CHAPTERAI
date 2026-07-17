import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const projectId = formData.get("projectId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: "No project ID provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(process.cwd(), "public", "uploads", projectId)
    await mkdir(uploadDir, { recursive: true })

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const fileUrl = `/uploads/${projectId}/${filename}`

    const upload = await prisma.upload.create({
      data: {
        projectId,
        filename: file.name,
        fileUrl,
        fileType: file.type,
        fileSize: file.size,
      },
    })

    return NextResponse.json(upload, { status: 201 })
  } catch (error) {
    console.error("Upload failed:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
