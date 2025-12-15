import { Router } from "express";
import { emailVerifyController, followController, forgotPasswordController, getMeController, getProfileController, loginController, logoutController, registerController, resendEmailVerifyController, resetPasswordController, updateMeController, verifyForgotPasswordController } from "~/controllers/users.controllers";
import { filterMiddleware } from "~/middlewares/common.middlewares";
import { accessTokenValidator, emailVerifyTokenValidator, followValidator, forgotPasswordValidator, loginValidator, refreshTokenValidator, registerValidator, resetPasswordValidator, updateMeValidator, verifiedUserValidator, verifyForgotPasswordTokenValidator } from "~/middlewares/users.middlewares";
import { UpdateMeBody } from "~/models/requests/user.requests";
import { wrapRequestHandler } from "~/utils/handlers";
const userRouter = Router()

userRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

userRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

userRouter.post("/logout", accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

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
 * Path: /:username
 * Method: GET
 */
userRouter.get('/:username', wrapRequestHandler(getProfileController))

/**
 * Description: Follow other user account
 * Path: /follow
 * Method: POST
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

export default userRouter