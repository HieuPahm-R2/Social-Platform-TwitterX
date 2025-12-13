import { Router } from "express";
import { emailVerifyController, forgotPasswordController, loginController, logoutController, registerController, resendEmailVerifyController, resetPasswordController, verifyForgotPasswordController } from "~/controllers/users.controllers";
import { accessTokenValidator, emailVerifyTokenValidator, forgotPasswordValidator, loginValidator, refreshTokenValidator, registerValidator, resetPasswordValidator, verifyForgotPasswordTokenValidator } from "~/middlewares/users.middlewares";
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

export default userRouter