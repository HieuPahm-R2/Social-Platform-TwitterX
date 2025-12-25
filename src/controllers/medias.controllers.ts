import { NextFunction, Request, Response } from 'express'
import { USER_VALID_MESSAGES } from '~/constants/messages'
import mediasService from '~/services/medias.services'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediasService.uploadImage(req)
  return res.json({
    message: USER_VALID_MESSAGES.UPLOAD_SUCCESS,
    result: url
  })
}