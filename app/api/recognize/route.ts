import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()

    // "data:image/jpeg;base64,..." の前半を取り除く
    const base64Data = image.split(',')[1]
    const mediaType = image.split(';')[0].split(':')[1]

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'この画像は日本のバイクのナンバープレートです。プレートに書かれている一連指定番号（大きく書かれた数字、例：12-34）を読み取って、ハイフンなしの数字のみを出力してください。数字以外の説明は一切不要です。読み取れない場合は「不明」とだけ出力してください。',
            },
          ],
        },
      ],
    })

    const textBlock = message.content.find((block) => block.type === 'text')
    const result = textBlock && textBlock.type === 'text' ? textBlock.text.trim() : '不明'

    return NextResponse.json({ result })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '認識に失敗しました' }, { status: 500 })
  }
}