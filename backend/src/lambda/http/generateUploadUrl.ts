import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import * as uuid from 'uuid'
import { AttachmentUtils } from '../../helpers/attachmentUtils'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'

const logger = createLogger('AttachmentUtils')

const attachmentUtils = new AttachmentUtils()

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)

    logger.info('userId', { userId })
    const isValidTodoId = await attachmentUtils.checkIftodoExists(
      todoId,
      userId
    )

    if (!isValidTodoId) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Todo does not exist'
        })
      }
    }

    //generate unique ID for the image
    const imageId = uuid.v4()

    //create image record in the database
    await attachmentUtils.createImage(todoId, imageId, event, userId)

    //generate presigned url for the image
    const url = await attachmentUtils.getUploadUrl(imageId)

    return {
      statusCode: 201,
      body: JSON.stringify({
        uploadUrl: url
      })
    }
  }
)

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true,
    origin: '*'
  })
)
