import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('AttachmentUtils')

export class AttachmentUtils {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly imagesTable = process.env.IMAGES_TABLE,
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
    private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' })
  ) {}

  async createImage(
    todoId: string,
    imageId: string,
    event: any,
    userId: string
  ): Promise<any> {
    const timestamp = new Date().toISOString()
    const newImage = JSON.parse(event.body)
    const imageUrl = `https://${this.bucketName}.s3.amazonaws.com/${imageId}`
    logger.info('todoItem', { todoId, imageId, userId, event })
    const key = {
      userId,
      todoId
    }
    const newItem = {
      todoId,
      timestamp,
      imageId,
      ...newImage,
      imageUrl
    }
    logger.info('Saving new item: ', newItem)
    await this.docClient
      .put({
        TableName: this.imagesTable,
        Item: newItem
      })
      .promise()

    const updateUrlOnTodo = {
      TableName: this.todosTable,
      Key: key,
      UpdateExpression: 'set attachmentUrl = :a',
      ExpressionAttributeValues: {
        ':a': imageUrl
      },
      ReturnValues: 'UPDATED_NEW'
    }
    await this.docClient.update(updateUrlOnTodo).promise()

    return newItem
  }

  async checkIftodoExists(todoId: string, userId: string) {
    logger.info('userId', { userId, todoId })

    const result = await this.docClient
      .get({
        TableName: this.todosTable,
        Key: {
          todoId,
          userId
        }
      })
      .promise()

    logger.info('Get todo: ', result)
    return !!result.Item
  }

  async getUploadUrl(imageId: string) {
    return this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: imageId,
      Expires: this.urlExpiration
    })
  }
}
