import { ActionFunctionArgs, json, redirect } from '@remix-run/node'
import { ClientResponseError } from 'pocketbase'
import { createSession, getPocketbase, getUser } from '~/utils/pb.server'
import {
  folderDeleteFormSchema,
  folderDisableFormSchema,
  folderDuplicateFormSchema,
  folderEnableFormSchema, folderMoveFormSchema,
} from '~/validation/folder'

export async function action(args: ActionFunctionArgs) {
  const pb = getPocketbase(args.request)
  const user = getUser(pb)

  if (!user) {
    return createSession('/login', pb)
  }

  const organizationId = args.params?.organizationId

  if (!organizationId) {
    throw new Error('404')
  }

  let formValues: { _action?: string } = {}

  if (args.request.headers.get('content-type') === 'application/json') {
    formValues = await args.request.json()
  } else {
    const formData = await args.request.formData()
    formValues = Object.fromEntries(formData.entries())
  }

  switch (formValues?._action) {
    case 'delete': {
      const result = folderDeleteFormSchema.safeParse(formValues)
      if (!result.success) {
        const errorsFormatted = result.error.issues.reduce((acc, currentValue) => {
          return {
            ...acc,
            [currentValue.path.join('.')]: {
              type: currentValue.code,
              message: currentValue.message,
            },
          }
        }, {})
        return json({ errors: errorsFormatted })
      }
      try {
        await pb.send(`/api/organization/${organizationId}/tree`, {
          method: 'DELETE',
          query: {
            path: result.data.path,
          },
        })
        return redirect(`/organizations/${organizationId}/script`)
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            error: e.data.message,
            errors: e.data.data,
          }
        }
      }
      return null
    }
    case 'enable': {
      const result = folderEnableFormSchema.safeParse(formValues)
      if (!result.success) {
        const errorsFormatted = result.error.issues.reduce((acc, currentValue) => {
          return {
            ...acc,
            [currentValue.path.join('.')]: {
              type: currentValue.code,
              message: currentValue.message,
            },
          }
        }, {})
        return json({ errors: errorsFormatted })
      }
      try {
        await pb.send(`/api/organization/${organizationId}/tree/enable`, {
          method: 'GET',
          query: {
            path: result.data.path,
          },
        })
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            error: e.data.message,
            errors: e.data.data,
          }
        }
      }
      return null
    }
    case 'disable': {
      const result = folderDisableFormSchema.safeParse(formValues)
      if (!result.success) {
        const errorsFormatted = result.error.issues.reduce((acc, currentValue) => {
          return {
            ...acc,
            [currentValue.path.join('.')]: {
              type: currentValue.code,
              message: currentValue.message,
            },
          }
        }, {})
        return json({ errors: errorsFormatted })
      }
      try {
        await pb.send(`/api/organization/${organizationId}/tree/disable`, {
          method: 'GET',
          query: {
            path: result.data.path,
          },
        })
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            error: e.data.message,
            errors: e.data.data,
          }
        }
      }
      return null
    }
    case 'duplicate': {
      const result = folderDuplicateFormSchema.safeParse(formValues)
      if (!result.success) {
        const errorsFormatted = result.error.issues.reduce((acc, currentValue) => {
          return {
            ...acc,
            [currentValue.path.join('.')]: {
              type: currentValue.code,
              message: currentValue.message,
            },
          }
        }, {})
        return json({ errors: errorsFormatted })
      }
      try {
        await pb.send(`/api/organization/${organizationId}/tree/duplicate`, {
          method: 'GET',
          query: {
            path: result.data.path,
            'target-path': result.data.targetPath,
          },
        })
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            error: e.data.message,
            errors: e.data.data,
          }
        }
      }
      return null
    }
    case 'move': {
      const result = folderMoveFormSchema.safeParse(formValues)
      if (!result.success) {
        const errorsFormatted = result.error.issues.reduce((acc, currentValue) => {
          return {
            ...acc,
            [currentValue.path.join('.')]: {
              type: currentValue.code,
              message: currentValue.message,
            },
          }
        }, {})
        return json({ errors: errorsFormatted })
      }
      try {
        await pb.send(`/api/organization/${organizationId}/tree/move`, {
          method: 'GET',
          query: {
            path: result.data.path,
            'target-path': result.data.targetPath,
          },
        })
        return null
      } catch (e) {
        console.log(e)
        if (e instanceof ClientResponseError) {
          return {
            errors: {
              ...e.data.data,
              global: {
                message: e.data.message,
              },
            },
          }
        }
        return json({
          errors: {
            global: {
              message: 'Unknown error ...',
            },
          },
        })
      }
    }
  }
  return json({
    errors: {
      global: {
        message: 'Unknown error ...',
      },
    },
  })
}