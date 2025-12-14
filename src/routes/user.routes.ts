import { Router } from "express";
import { emailVerifyController, forgotPasswordController, getMeController, loginController, logoutController, registerController, resendEmailVerifyController, resetPasswordController, updateMeController, verifyForgotPasswordController } from "~/controllers/users.controllers";
import { accessTokenValidator, emailVerifyTokenValidator, forgotPasswordValidator, loginValidator, refreshTokenValidator, registerValidator, resetPasswordValidator, updateMeValidator, verifiedUserValidator, verifyForgotPasswordTokenValidator } from "~/middlewares/users.middlewares";
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
userRouter.patch("/me", accessTokenValidator, updateMeValidator, wrapRequestHandler(updateMeController))

export default userRouter