import { config } from "dotenv"
import { Request } from "express"
import fs from 'fs'
import path from "path"
import sharp from "sharp"
import { UPLOAD_IMAGE_DIR } from "~/constants/directFolder"
import { MediaType } from "~/constants/enums"
import { Media } from "~/models/domain"
import { getOriginFileName, handleUploadImage } from "~/utils/file"

config()

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
}

const mediasService = new MediasService()
export default mediasService