import User from "~/models/schemas/User.schema"
import databaseService from "./database.services"
import { RegisterReqBody } from "~/models/requests/user.requests"
import { hashPassword } from "~/utils/crypto"
import { signToken } from "~/utils/jwt"
import { TokenType, UserVerifyStatus } from "~/constants/enums"
import RefreshToken from "~/models/schemas/RefreshToken.schema"
import { ObjectId } from "mongodb"
import { config } from "dotenv"
import { USER_VALID_MESSAGES } from "~/constants/messages"

config()

class UserService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccesToken
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: '15m'
      }
    })
  }

  private signRefreshToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      privateKey: process.env.JWT_SECRETKEY_REFRESH_TOKEN as string,
      options: {
        expiresIn: '50d'
      }
    })
  }

  private signForgotPasswordToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken
      },
      privateKey: process.env.JWT_SECRETKEY_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: '4d'
      }
    })
  }

  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])
  }
  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken
      },
      privateKey: process.env.JWT_SECRETKEY_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: '7d'
      }
    })
  }

  /**
   * Hàm Đăng ký tài khoản
   * @param payload 
   * @returns 
   */
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id.toString())
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return { access_token, refresh_token }
  }
  /**
   * Hàm đăng nhập tài khoản
   * @param payload 
   * @returns 
   */
  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return { access_token, refresh_token }
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
      this.signAccessAndRefreshToken(user_id),
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
    const email_verify_token = await this.signEmailVerifyToken(user_id)

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
  async forgotPassword(user_id: string) {
    const forgot_password = this.signForgotPasswordToken(user_id)
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
}


const userService = new UserService()
export default userService