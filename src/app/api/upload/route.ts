import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase/server"

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

    const supabase = createSupabaseServerClient()

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const storagePath = `${projectId}/${filename}`

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from("uploads")
      .getPublicUrl(storagePath)

    const fileUrl = urlData.publicUrl

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
