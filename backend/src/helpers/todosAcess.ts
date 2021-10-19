import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

export class Todo {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE
  ) {}

  async findAll(userId: string): Promise<TodoItem[]> {
    logger.info('Getting all todos', { userId })

    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: 'CreatedAtIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false
      })
      .promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async create(todo: TodoItem): Promise<TodoItem> {
    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todo
      })
      .promise()

    return todo
  }

  async update(
    todoId: string,
    userId: string,
    updatedTodo: TodoUpdate
  ): Promise<TodoUpdate> {
    logger.info('todoItem', todoId)

    const key = {
      userId,
      todoId
    }
    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: key,
        UpdateExpression: 'SET #n = :n, dueDate = :dueDate, done = :done',
        ExpressionAttributeValues: {
          ':n': updatedTodo.name,
          ':dueDate': updatedTodo.dueDate,
          ':done': updatedTodo.done
        },
        ExpressionAttributeNames: {
          '#n': 'name'
        },
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()

    return updatedTodo
  }

  async destroy(
    todoId: string,
    userId: string
  ): Promise<Record<string, boolean>> {
    const key = {
      userId,
      todoId
    }
    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: key
      })
      .promise()

    return {
      message: true
    }
  }
}
