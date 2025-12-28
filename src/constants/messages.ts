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
  USERNAME_INVALID: 'Username must be 4-15 characters long and contain only letters, numbers, underscores, not only numbers',
  ACCESS_TOKEN_REQUIRED: 'access token not be null! REQUIRED',
  REFRESH_TOKEN_REQUIRED: 'refresh token not be null! REQUIRED',
  REFRESH_TOKEN_INVALID: 'refresh token malformed, not valid',
  REFRESH_TOKEN_USED_OR_NOTEXIST: 'refresh token be used, or not exist',
  FORGOT_PASSWORD_TOKEN_REQUIRED: 'forgot password token is required',
  INVALI_FORGOT_PASSWORD_TOKEN: 'forgot password token invalid',
  VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS: 'verify forgot password done',
  RESET_PASSWORD_DONE: 'Reset password successfully',

  BIO_MUST_BE_STRING: 'bio must be string',
  BIO_TOO_SHORT: 'bio is too short, not valid',
  GET_PROFILE_SUCCESS: 'Get profile success',
  FOLLOW_SUCCESS: 'Follow success',
  INVALID_USER_ID: 'Invalid user id',
  FOLLOWED: 'Followed',
  ALREADY_UNFOLLOWED: 'Already unfollowed',
  UNFOLLOW_SUCCESS: 'Unfollow success',
  USERNAME_EXISTED: 'Username existed',
  OLD_PASSWORD_NOT_MATCH: 'Old password not match',
  CHANGE_PASSWORD_SUCCESS: 'Change password success',
  GMAIL_NOT_VERIFIED: 'Gmail not verified',
  UPLOAD_SUCCESS: 'Upload success',
  REFRESH_TOKEN_SUCCESS: 'Refresh token success',
  GET_VIDEO_STATUS_SUCCESS: 'Get video status success'
} as const

export const COMMON_MESSAGES = {
  FIELD_MUST_BE_STRING: 'This field must be string',
  FIELD_TOO_SHORT: 'This field should not be short',
  IMAGE_URL_BE_STRING: 'url of image must be string',
  IMAGE_URL_WRONG_LENGTH: 'the length of url not be fit'
} as const

export const TWEETS_MESSAGES = {
  INVALID_TYPE: 'Invalid type',
  INVALID_AUDIENCE: 'Invalid audience',
  PARENT_ID_MUST_BE_A_VALID_TWEET_ID: 'Parent id must be a valid tweet id',
  PARENT_ID_MUST_BE_NULL: 'Parent id must be null',
  CONTENT_MUST_BE_A_NON_EMPTY_STRING: 'Content must be a non-empty string',
  CONTENT_MUST_BE_EMPTY_STRING: 'Content must be empty string',
  HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING: 'Hashtags must be an array of string',
  MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID: 'Mentions must be an array of user id',
  MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT: 'Medias must be an array of media object',
  INVALID_TWEET_ID: 'Invalid tweet id',
  TWEET_NOT_FOUND: 'Tweet not found',
  TWEET_IS_NOT_PUBLIC: 'Tweet is not public'
} as const

export const BOOKMARK_MESSAGES = {
  BOOKMARK_SUCCESSFULLY: 'Bookmark successfully',
  UNBOOKMARK_SUCCESSFULLY: 'Unbookmark successfully'
}

export const LIKE_MESSAGES = {
  LIKE_SUCCESSFULLY: 'Like successfully',
  UNLIKE_SUCCESSFULLY: 'Unlike successfully'
}