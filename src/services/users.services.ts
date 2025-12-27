import User from "~/models/schemas/User.schema"
import databaseService from "./database.services"
import { RegisterReqBody, UpdateMeBody } from "~/models/requests/user.requests"
import { hashPassword } from "~/utils/crypto"
import { signToken, verifyToken } from "~/utils/jwt"
import { TokenType, UserVerifyStatus } from "~/constants/enums"
import RefreshToken from "~/models/schemas/RefreshToken.schema"
import { ObjectId } from "mongodb"
import { config } from "dotenv"
import { USER_VALID_MESSAGES } from "~/constants/messages"
import { ErrorStatus } from "~/models/errors"
import HTTP_STATUS from "~/constants/httpStatus"
import Follower from "~/models/schemas/Follower.schema"
import axios from "axios"

config()

class UserService {
  private signAccessToken({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccesToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: '15m'
      }
    })
  }

  private signRefreshToken({ user_id, verify, exp }: { user_id: string, verify: UserVerifyStatus, exp?: number }) {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify,
          exp
        },
        privateKey: process.env.JWT_SECRETKEY_REFRESH_TOKEN as string
      })
    }
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRETKEY_REFRESH_TOKEN as string,
      options: {
        expiresIn: '50d'
      }
    })
  }

  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: process.env.JWT_SECRETKEY_REFRESH_TOKEN as string
    })
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.JWT_SECRETKEY_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: '4d'
      }
    })
  }

  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    return Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify })
    ])
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: process.env.JWT_SECRETKEY_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: '7d'
      }
    })
  }

  async refreshToken({ user_id, verify, refresh_token, exp }: {
    user_id: string
    verify: UserVerifyStatus
    refresh_token: string
    exp: number
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessAndRefreshToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp }),
      databaseService.refreshTokens.deleteOne({ token: refresh_token })
    ])
    const decoded_refresh_token = await this.decodeRefreshToken(new_refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refresh_token,
        iat: decoded_refresh_token.iat,
        exp: decoded_refresh_token.exp
      })
    )
    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    }
  }

  /**
   * Hàm Đăng ký tài khoản
   * @param payload 
   * @returns 
   */
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(
      {
        user_id: user_id.toString(),
        verify: UserVerifyStatus.Unverified
      })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        username: `user${user_id.toString()}`,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token,
        iat, exp
      })
    )
    return { access_token, refresh_token }
  }
  /**
   * Hàm đăng nhập tài khoản
   * @param payload 
   * @returns 
   */
  async login({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify
    })
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token,
        iat, exp
      })
    )
    return { access_token, refresh_token }
  }
  /**
   * Google Login
   */
  private async getOauthToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as {
      access_token: string,
      id_token: string
    }
  }
  private async getUserGGInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data as {
      id: string
      email: string
      verified_email: string
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }
  async oauthLogin(code: string) {
    const { id_token, access_token } = await this.getOauthToken(code)
    const userInfo = await this.getUserGGInfo(access_token, id_token)
    if (!userInfo.verified_email) {
      throw new ErrorStatus({
        message: USER_VALID_MESSAGES.GMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    // Kiểm tra xem email này đã có trong db chưa?
    const user = await databaseService.users.findOne({ email: userInfo.email })
    // Nếu tồn tại thì cho login
    if (user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify
      })
      const { iat, exp } = await this.decodeRefreshToken(refresh_token)
      await databaseService.refreshTokens.insertOne(new RefreshToken(
        { user_id: user._id, token: refresh_token, iat, exp }
      ))
      return {
        access_token,
        refresh_token,
        newUser: 0,
        verify: user.verify
      }
    } else {
      // random string password
      const password = Math.random().toString(36).substring(2, 15)
      // không thì đăng ký
      const dataNew = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password,
        confirm_password: password
      })
      return {
        ...dataNew,
        newUser: 1,
        verify: UserVerifyStatus.Unverified
      }
    }
  }

  /**
   * Đăng xuất thì xóa refresh_token trong db đi
   * @param refresh_token 
   * @returns 
   */
  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: "Logout successfully"
    }
  }

  async checkEmailExist(email: string) {
    const check = await databaseService.users.findOne({ email })
    return Boolean(check)
  }
  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
      databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
    ])
    const [access_token, refresh_token] = token
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )
    return {
      access_token,
      refresh_token
    }
  }
  /**
   * Hàm gửi 
   * @param user_id 
   * @returns 
   */
  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })

    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USER_VALID_MESSAGES.RESEND_VERIFY_EMAIL_DONE
    }
  }
  /**
   * Hàm xử lý quên mật khẩu
   * @param user_id 
   * @returns 
   */
  async forgotPassword({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    const forgot_password = await this.signForgotPasswordToken({ user_id, verify })
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USER_VALID_MESSAGES.PASSWORD_RESET_FORGOT_OK
    }
  }

  async resetPassword(user_id: string, password: string) {
    databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: '',
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USER_VALID_MESSAGES.RESET_PASSWORD_DONE
    }
  }

  async getMe(user_id: string) {
    // projection dùng để loại bỏ các trường không muốn trả về
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) }, {
      projection: {
        password: 0,
        email_verify_token: 0,
        forgot_password_token: 0
      }
    })
    return user
  }

  async updateMe(user_id: string, payload: UpdateMeBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          // thằng payload này, ép nó có kiểu UpdateMeBody và ép thằng dateofbirth kia sang Date
          ...(_payload as UpdateMeBody & { date_of_birth?: Date })
        },
        $currentDate: {
          updated_at: true
        },
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user.value
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )
    if (user === null) {
      throw new ErrorStatus({
        message: USER_VALID_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
  }

  async follow(user_id: string, followed_user_id: string) {
    const followerExist = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (followerExist === null) {
      await databaseService.followers.insertOne(
        new Follower({
          user_id: new ObjectId(user_id),
          followed_user_id: new ObjectId(followed_user_id)
        })
      )
      return {
        message: USER_VALID_MESSAGES.FOLLOW_SUCCESS
      }
    }
    return {
      message: USER_VALID_MESSAGES.FOLLOWED
    }
  }
  async unfollow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    // Không tìm thấy document follower
    // chưa follow người này
    if (follower === null) {
      return {
        message: USER_VALID_MESSAGES.ALREADY_UNFOLLOWED
      }
    }
    // đã follow người này rồi, thì tiến hành xóa document này
    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    return {
      message: USER_VALID_MESSAGES.UNFOLLOW_SUCCESS
    }
  }
  async changePassword(user_id: string, new_password: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(new_password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USER_VALID_MESSAGES.CHANGE_PASSWORD_SUCCESS
    }
  }
}


const userService = new UserService()
export default userService