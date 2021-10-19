import { Todo } from './todosAcess'
// import { AttachmentUtils } from './attachmentUtils'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'

const todo = new Todo()

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
  return await todo.findAll(userId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  const todoId = uuid.v4()

  return await todo.create({
    todoId,
    userId,
    done: false,
    createdAt: new Date().toISOString(),
    ...createTodoRequest
  })
}

export async function updateTodo(
  updateTodoRequest: UpdateTodoRequest,
  todoId: string,
  userId: string
): Promise<TodoUpdate> {
  return await todo.update(todoId, userId, updateTodoRequest)
}

export async function deleteTodo(
  todoId: string,
  userId: string
): Promise<Record<string, boolean>> {
  return await todo.destroy(todoId, userId)
}
