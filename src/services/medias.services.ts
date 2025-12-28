import { config } from "dotenv"
import { Request } from "express"
import fs from 'fs'
import path from "path"
import sharp from "sharp"
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from "~/constants/directFolder"
import { EncodingStatus, MediaType } from "~/constants/enums"
import { Media } from "~/models/domain"
import { getOriginFileName, handleUploadImage } from "~/utils/file"
import databaseService from "./database.services"
import { encodeHLSWithMultipleVideoStreams } from "~/utils/video-hls"

config()

// upload action with queue
class Queue {
  items: string[]
  encoding: boolean
  constructor() {
    this.items = []
    this.encoding = false
  }
  async queueEncode(item: string) {
    this.items.push(item)
    // E.g: item = /home/duy/Downloads/12312312/1231231221.mp4
    const idName = getOriginFileName(item.split("/").pop() as string)
    // first step: set processing status
    await databaseService.videoStatus.updateOne(
      {
        name: idName
      },
      {
        $set: {
          status: EncodingStatus.Processing
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
  }
  async processEncode() {
    if (this.encoding) return
    if (this.items.length > 0) {
      this.encoding = true
      const videoPath = this.items[0]
      const idName = getOriginFileName(videoPath.split('/').pop() as string)
      await databaseService.videoStatus.updateOne(
        {
          name: idName
        },
        {
          $set: {
            status: EncodingStatus.Processing
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath)
        this.items.shift()
        const files = getFile(path.resolve(UPLOAD_VIDEO_DIR, idName))
        await Promise.all(
          files.map((filepath) => {
            // filepath: /Users/duthanhduoc/Documents/DuocEdu/NodeJs-Super/Twitter/uploads/videos/6vcpA2ujL7EuaD5gvaPvl/v0/fileSequence0.ts
            const filename = 'videos-hls' + filepath.replace(path.resolve(UPLOAD_VIDEO_DIR), '')

          })
        )

        await databaseService.videoStatus.updateOne(
          {
            name: idName
          },
          {
            $set: {
              status: EncodingStatus.Success
            },
            $currentDate: {
              updated_at: true
            }
          }
        )
        console.log(`Encode video ${videoPath} success`)
      } catch (error) {
        await databaseService.videoStatus
          .updateOne(
            {
              name: idName
            },
            {
              $set: {
                status: EncodingStatus.Failed
              },
              $currentDate: {
                updated_at: true
              }
            }
          )
          .catch((err) => {
            console.error('Update video status error', err)
          })
        console.error(`Encode video ${videoPath} error`)
        console.error(error)
      }
      this.encoding = false
      this.processEncode()
    } else {
      console.log('Encode video queue is empty')
    }
  }
}
const queue = new Queue()
class MediasService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getOriginFileName(file.newFilename)
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`)
        await sharp(file.filepath).jpeg().toFile(newPath)
        fs.unlinkSync(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/image/${newFullFilename}`
            : `http://localhost:${process.env.PORT}/static/image/${newFullFilename}`,
          type: MediaType.Image
        }
      })
    )
    return result
  }

  async getVideoStatus(id: string) {
    const data = await databaseService.videoStatus.findOne({ name: id })
    return data
  }
}

const mediasService = new MediasService()
export default mediasService