import { Router } from "express";
import { changePasswordController, emailVerifyController, followController, forgotPasswordController, getMeController, getProfileController, loginController, logoutController, oauthController, registerController, resendEmailVerifyController, resetPasswordController, unfollowController, updateMeController, verifyForgotPasswordController } from "~/controllers/users.controllers";
import { filterMiddleware } from "~/middlewares/common.middlewares";
import { accessTokenValidator, changePasswordValidator, emailVerifyTokenValidator, followValidator, forgotPasswordValidator, loginValidator, refreshTokenValidator, registerValidator, resetPasswordValidator, unfollowValidator, updateMeValidator, verifiedUserValidator, verifyForgotPasswordTokenValidator } from "~/middlewares/users.middlewares";
import { UpdateMeBody } from "~/models/requests/user.requests";
import { wrapRequestHandler } from "~/utils/handlers";
const userRouter = Router()

userRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

/**
 * Description. OAuth with Google
 * Query: { code: string }
 */
userRouter.get('/oauth/google', wrapRequestHandler(oauthController))

userRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

userRouter.post("/logout", accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

userRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))

userRouter.post("/verify-email", emailVerifyTokenValidator, wrapRequestHandler(emailVerifyController))

userRouter.post("/resend-verify-email", accessTokenValidator, wrapRequestHandler(resendEmailVerifyController))

userRouter.post("/forgot-password", forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))

userRouter.post("/verify-forgot-password", verifyForgotPasswordTokenValidator, wrapRequestHandler(verifyForgotPasswordController))

userRouter.post("/reset-password", resetPasswordValidator, wrapRequestHandler(resetPasswordController))
// get profile user
userRouter.post("/me", accessTokenValidator, wrapRequestHandler(getMeController))
// run accessToken verify first to get decode
userRouter.patch("/me",
  accessTokenValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo']),
  wrapRequestHandler(updateMeController))
/**
 * Description: Get user profile
 */
userRouter.get('/:username', wrapRequestHandler(getProfileController))

/**
 * Description: Follow other user account
 * Header: { Authorization: Bearer <access_token> }
 * Body: { followed_user_id: string }
 */
userRouter.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequestHandler(followController)
)
/**
 * Description: unfollow someone
 * Header: { Authorization: Bearer <access_token> }
 */
userRouter.delete(
  '/follow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapRequestHandler(unfollowController)
)
/**
 * Description: Change password
 * Header: { Authorization: Bearer <access_token> }
 * Body: { old_password: string, password: string, confirm_password: string }
 */
userRouter.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)

export default userRouter