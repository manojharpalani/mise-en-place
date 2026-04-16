import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  body: z.string().min(10),
  sellerId: z.string(),
  authorId: z.string(),
  imageUrl: z.string().url().optional().nullable(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = schema.parse(await req.json())

    const article = await prisma.article.create({
      data: {
        title: data.title,
        body: data.body,
        sellerId: data.sellerId,
        authorId: session.user.id,
        imageUrl: data.imageUrl,
        isPublished: true,
      },
      include: { author: { select: { name: true } } },
    })

    return NextResponse.json(article, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
  }
}
