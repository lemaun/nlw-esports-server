import express from 'express'
import cors from 'cors'

import { PrismaClient } from '@prisma/client'
import { convertHourToMinutes } from './utils/convert-hour-string-to-minutes'
import { convertMinutesToHour } from './utils/convert-minutes-to-hour-string'
const app = express()

// localhost:3333/rota
app.use(express.json())
app.use(cors(
  // {
  //   origin: 
  // }
  ))

const prisma = new PrismaClient({
  log: ['query']
})

app.get('/games', async (request, response) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        }
      }
    }
  })
  return response.json(games)
})

app.post('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id
  const body = request.body

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays.join(','),
      hourStart: convertHourToMinutes(body.hourStart),
      hourEnd: convertHourToMinutes(body.hourEnd),
      useVoiceChannel: body.useVoiceChannel,
    }
  })
  return response.status(201).json(ad)
})

app.get('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourStart: true,
      hourEnd: true,
    },
    where: {
      gameId,
    },
    orderBy: {
      createdAt: 'desc',
    }
  })

  return response.json(ads.map(ad => {
    return {
      ...ad,
      weekdays: ad.weekDays.split(','),
      hourStart: convertMinutesToHour(ad.hourStart),
      hourEnd: convertMinutesToHour(ad.hourEnd),
    }
  }))
})

app.get('/ads/:id/discord', async (request, response) => {
  const adId = request.params.id

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId,
    }
  })

  return response.json({discord: ad.discord})
})

app.listen(3333)