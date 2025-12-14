export const USER_VALID_MESSAGES = {
  VALIDATION_ERROR: 'Validate action says some errorss!',
  NAME_REQUIRED: 'Name can not be blank!',
  NAME_IS_STRING: 'Required String type for this field',
  NAME_LENGTH: 'Required at least 3 chars',
  EMAIL_EXIST: 'Email has already exist, please try another!',
  EMAIL_REQUIRED: 'Email can not be blank',
  EMAIL_VALID: 'Email maybe wrong type!',
  EMAIL_ALREADY_VERIFIED: 'Email has already verified before',
  EMAIL_VERIFY_OK: 'Verify Done',
  RESEND_VERIFY_EMAIL_DONE: 'Resend Done',

  PASSWORD_REQUIRED: 'Password can not be blank',
  PASSWORD_LENGTH: 'Required at least 6 chars',
  PASSWORD_STRONG: 'Too Weak...try other password',
  CONFIRM_PASSWORD_REQUIRED: 'Confirm password not be blank',
  CONFIRM_PASSWORD_LENGTH: 'Too Weak...try other password',
  PASSWORD_MATCHING: 'Password not matching...please check carefully !!',
  PASSWORD_RESET_FORGOT_OK: 'Reset password done',

  DATE_VALID_ISO8601: 'Invalid Date Type',
  USER_NOT_FOUND: 'user not found! Wrong email or password',
  USER_NOT_VERIFIED: 'user still not verified',
  USER_UPDATE_DONE: 'user info was updated successfully',
  ACCESS_TOKEN_REQUIRED: 'access token not be null! REQUIRED',
  REFRESH_TOKEN_REQUIRED: 'refresh token not be null! REQUIRED',
  REFRESH_TOKEN_INVALID: 'refresh token malformed, not valid',
  REFRESH_TOKEN_USED_OR_NOTEXIST: 'refresh token be used, or not exist',
  FORGOT_PASSWORD_TOKEN_REQUIRED: 'forgot password token is required',
  INVALI_FORGOT_PASSWORD_TOKEN: 'forgot password token invalid',
  VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS: 'verify forgot password done',
  RESET_PASSWORD_DONE: 'Reset password successfully',

  BIO_MUST_BE_STRING: 'bio must be string',
  BIO_TOO_SHORT: 'bio is too short, not valid'
} as const

export const COMMON_MESSAGES = {
  FIELD_MUST_BE_STRING: 'This field must be string',
  FIELD_TOO_SHORT: 'This field should not be short',
  IMAGE_URL_BE_STRING: 'url of image must be string',
  IMAGE_URL_WRONG_LENGTH: 'the length of url not be fit'
} as const