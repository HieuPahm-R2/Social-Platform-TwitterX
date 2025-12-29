import { Request, Response, NextFunction } from 'express'
import { check, checkSchema, ParamSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { COMMON_MESSAGES, USER_VALID_MESSAGES } from '~/constants/messages'
import { REGEX_USERNAME } from '~/constants/regex'
import { ErrorStatus } from '~/models/errors'
import { TokenPayload } from '~/models/requests/user.requests'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'
/** Common variables */
const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_VALID_MESSAGES.PASSWORD_REQUIRED
  },
  isString: true,
  isLength: {
    errorMessage: USER_VALID_MESSAGES.PASSWORD_LENGTH,
    options: {
      min: 6,
      max: 100
    }
  },
  isStrongPassword: {
    errorMessage: USER_VALID_MESSAGES.PASSWORD_STRONG,
    options: {
      minLength: 6,
      minNumbers: 1,
      minSymbols: 0,
      minLowercase: 0,
      minUppercase: 0,
    }
  }
}

const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_VALID_MESSAGES.CONFIRM_PASSWORD_REQUIRED
  },
  isString: true,
  isLength: {
    errorMessage: USER_VALID_MESSAGES.CONFIRM_PASSWORD_LENGTH,
    options: {
      min: 6,
      max: 100
    }
  },
  custom: {
    options: (value, { req }) => {
      if (value != req.body.password) {
        throw new Error(USER_VALID_MESSAGES.PASSWORD_MATCHING)
      }
      return true
    }
  }
}

const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      if (!value) {
        throw new ErrorStatus({
          message: USER_VALID_MESSAGES.FORGOT_PASSWORD_TOKEN_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        })
      }
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: process.env.JWT_SECRETKEY_FORGOT_PASSWORD_TOKEN as string
        })
        const { user_id } = decoded_forgot_password_token
        const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
        if (user === null) {
          throw new ErrorStatus({
            message: USER_VALID_MESSAGES.USER_NOT_FOUND,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        if (user.forgot_password_token !== value) {
          throw new ErrorStatus({
            message: USER_VALID_MESSAGES.INVALI_FORGOT_PASSWORD_TOKEN,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        req.decoded_forgot_password_token = decoded_forgot_password_token
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorStatus({
            message: USER_VALID_MESSAGES.REFRESH_TOKEN_INVALID,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        throw error
      }
    }
  }
}
const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_VALID_MESSAGES.NAME_REQUIRED
  },
  isString: {
    errorMessage: USER_VALID_MESSAGES.NAME_IS_STRING
  },
  isLength: {
    errorMessage: USER_VALID_MESSAGES.NAME_LENGTH,
    options: {
      min: 1,
      max: 100
    }
  },
  trim: true
}
const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USER_VALID_MESSAGES.DATE_VALID_ISO8601
  }
}
const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: COMMON_MESSAGES.IMAGE_URL_BE_STRING
  },
  trim: true,
  isLength: {
    errorMessage: COMMON_MESSAGES.IMAGE_URL_WRONG_LENGTH,
    options: {
      min: 50,
      max: 400
    }
  }
}
const userIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorStatus({
          message: USER_VALID_MESSAGES.INVALID_USER_ID,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      // kiểm tra thằng mà mình muốn follow có tồn tại acc không?
      const followed_user = await databaseService.users.findOne({
        _id: new ObjectId(value)
      })
      if (followed_user === null) {
        throw new ErrorStatus({
          message: USER_VALID_MESSAGES.USER_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
    }
  }
}
/**======================= Validate =========================== */

export const loginValidator = validate(checkSchema({
  email: {
    notEmpty: {
      errorMessage: USER_VALID_MESSAGES.EMAIL_REQUIRED
    },
    isEmail: {
      errorMessage: USER_VALID_MESSAGES.EMAIL_VALID
    },
    trim: true,
    custom: {
      options: async (value, { req }) => {
        const user = await databaseService.users.findOne({ email: value, password: hashPassword(req.body.password) })
        if (user === null) {
          throw new Error(USER_VALID_MESSAGES.USER_NOT_FOUND)
        }
        req.user = user
        return true
      }
    }
  },
  password: {
    notEmpty: {
      errorMessage: USER_VALID_MESSAGES.PASSWORD_REQUIRED
    },
    isString: true,
    isLength: {
      errorMessage: USER_VALID_MESSAGES.PASSWORD_LENGTH,
      options: {
        min: 6,
        max: 100
      }
    },
    isStrongPassword: {
      errorMessage: USER_VALID_MESSAGES.PASSWORD_STRONG,
      options: {
        minLength: 6,
        minNumbers: 1,
        minSymbols: 0,
        minLowercase: 0,
        minUppercase: 0,
      }
    }
  },
}, ['body']))

export const registerValidator = validate(checkSchema({
  name: nameSchema,
  email: {
    notEmpty: {
      errorMessage: USER_VALID_MESSAGES.EMAIL_REQUIRED
    },
    isEmail: {
      errorMessage: USER_VALID_MESSAGES.EMAIL_VALID
    },
    trim: true,
    custom: {
      options: async (value) => {
        const isExist = await userService.checkEmailExist(value)
        if (isExist) {
          throw new Error('Email has already existed')
        }
        return true
      }
    }
  },
  password: passwordSchema,
  confirm_password: confirmPasswordSchema,
  date_of_birth: dateOfBirthSchema
}, ['body']))

// access token
export const accessTokenValidator = validate(checkSchema({
  Authorization: {
    custom: {
      options: async (value: string, { req }) => {
        const access_token = (value || '').split(' ')[1]
        if (!access_token) {
          throw new ErrorStatus({
            message: USER_VALID_MESSAGES.ACCESS_TOKEN_REQUIRED,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        try {
          const decoded_authorization = await verifyToken({
            token: access_token,
            secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
          })
            ; (req as Request).decoded_authorization = decoded_authorization
        } catch (error) {
          throw new ErrorStatus({
            message: (error as JsonWebTokenError).message,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        return true
      }
    }
  }
}))

export const refreshTokenValidator = validate(
  checkSchema({
    refresh_token: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          if (!value) {
            throw new ErrorStatus({
              message: USER_VALID_MESSAGES.REFRESH_TOKEN_REQUIRED,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
          try {
            const [decoded_refresh_token, refresh_token] = await Promise.all([
              verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
              }),
              databaseService.refreshTokens.findOne({ token: value })
            ])
            if (refresh_token === null) {
              throw new ErrorStatus({
                message: USER_VALID_MESSAGES.REFRESH_TOKEN_USED_OR_NOTEXIST,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            (req as Request).decoded_refresh_token = decoded_refresh_token
          } catch (error) {
            if (error instanceof JsonWebTokenError) {
              throw new ErrorStatus({
                message: USER_VALID_MESSAGES.REFRESH_TOKEN_INVALID,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            throw error
          }
        }
      }
    }
  }, ['body'])
)

export const emailVerifyTokenValidator = validate(
  checkSchema({
    email_verify_token: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          if (!value) {
            throw new ErrorStatus({
              message: USER_VALID_MESSAGES.REFRESH_TOKEN_REQUIRED,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
          try {
            const decoded_refresh_token = await
              verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRETKEY_EMAIL_VERIFY_TOKEN as string
              })

              ; (req as Request).decoded_refresh_token = decoded_refresh_token
          } catch (error) {
            throw new ErrorStatus({
              message: capitalize((error as JsonWebTokenError).message),
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }

          return true
        }
      }
    }
  }, ['body'])
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USER_VALID_MESSAGES.EMAIL_REQUIRED
        },
        isEmail: {
          errorMessage: USER_VALID_MESSAGES.EMAIL_VALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({ email: value })
            if (user === null) {
              throw new Error(USER_VALID_MESSAGES.USER_NOT_FOUND)
            }
            req.user = user
            return true
          }
        }
      },
    }
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema({
    forgot_password_token: forgotPasswordTokenSchema
  }, ['body'])
)

export const resetPasswordValidator = validate(
  checkSchema({
    password: passwordSchema,
    confirm_password: confirmPasswordSchema,
    forgot_password_token: forgotPasswordTokenSchema
  }, ['body'])
)

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorStatus({
        message: USER_VALID_MESSAGES.USER_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    )
  }
  next()
}

export const updateMeValidator = validate(
  checkSchema({
    name: {
      ...nameSchema,
      optional: true,
      notEmpty: undefined
    },
    date_of_birth: {
      ...dateOfBirthSchema,
      optional: true
    },
    bio: {
      optional: true,
      isString: {
        errorMessage: USER_VALID_MESSAGES.BIO_MUST_BE_STRING
      },
      trim: true,
      isLength: {
        errorMessage: USER_VALID_MESSAGES.BIO_TOO_SHORT,
        options: {
          min: 2,
          max: 300
        }
      }
    },
    location: {
      optional: true,
      isString: {
        errorMessage: COMMON_MESSAGES.FIELD_MUST_BE_STRING
      },
      trim: true,
      isLength: {
        errorMessage: COMMON_MESSAGES.FIELD_TOO_SHORT,
        options: {
          min: 2,
          max: 100
        }
      }
    },
    website: {
      optional: true,
      isString: {
        errorMessage: COMMON_MESSAGES.FIELD_MUST_BE_STRING
      },
      trim: true,
      isLength: {
        errorMessage: COMMON_MESSAGES.FIELD_TOO_SHORT,
        options: {
          min: 2,
          max: 200
        }
      }
    },
    username: {
      optional: true,
      isString: {
        errorMessage: COMMON_MESSAGES.FIELD_MUST_BE_STRING
      },
      trim: true,
      custom: {
        options: async (value: string) => {
          if (!REGEX_USERNAME.test(value)) {
            throw Error(USER_VALID_MESSAGES.USERNAME_INVALID)
          }
          const user = await databaseService.users.findOne({ username: value })
          if (user) {
            throw Error(USER_VALID_MESSAGES.USERNAME_EXISTED)
          }
        }
      }
    },
    avatar: imageSchema,
    cover_photo: imageSchema

  }, ['body'])
)

export const followValidator = validate(
  checkSchema(
    {
      followed_user_id: userIdSchema
    },
    ['body']
  )
)

export const unfollowValidator = validate(
  checkSchema(
    {
      user_id: userIdSchema
    },
    ['params']
  )
)

export const changePasswordValidator = validate(
  checkSchema({
    old_password: {
      ...passwordSchema,
      custom: {
        options: async (value: string, { req }) => {
          const { user_id } = (req as Request).decoded_authorization as TokenPayload
          const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
          if (!user) {
            throw new ErrorStatus({
              message: USER_VALID_MESSAGES.USER_NOT_FOUND,
              status: HTTP_STATUS.NOT_FOUND
            })
          }
          const { password } = user
          const isMatching = hashPassword(value) === password
          if (!isMatching) {
            throw new ErrorStatus({
              message: USER_VALID_MESSAGES.OLD_PASSWORD_NOT_MATCH,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
        }
      }
    },
    new_password: passwordSchema,
    confirm_new_password: confirmPasswordSchema
  })
)

export const isUserLoggedInValidator = (middleware: (req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      return middleware(req, res, next)
    }
    next()
  }
}