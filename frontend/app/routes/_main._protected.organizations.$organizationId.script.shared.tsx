import { ActionFunctionArgs, json, redirect } from '@remix-run/node';
import { createSession, getPocketbase, getUser } from '~/utils/pb.server';
import { Collections } from '~/types/pocketbase';
import { ClientResponseError } from 'pocketbase';
import { sharedCreateFormSchema } from '~/validation/shared';

export async function action(args: ActionFunctionArgs) {
  const pb = getPocketbase(args.request);
  const user = getUser(pb);

  if (!user) {
    return createSession('/login', pb);
  }

  const organizationId = args.params?.organizationId;

  if (!organizationId) {
    throw new Error('404');
  }

  let formValues: { _action?: string } = {};

  if (args.request.headers.get('content-type') === 'application/json') {
    formValues = await args.request.json();
  } else {
    const formData = await args.request.formData();
    formValues = Object.fromEntries(formData.entries());
  }

  switch (formValues?._action) {
    case 'create': {
      const result = sharedCreateFormSchema.safeParse(formValues);
      if (!result.success) {
        const errorsFormatted = result.error.issues.reduce((acc, currentValue) => {
          return {
            ...acc,
            [currentValue.path.join('.')]: {
              type: currentValue.code,
              message: currentValue.message
            }
          };
        }, {});
        return json({ errors: errorsFormatted });
      }
      try {
        const created = await pb.collection(Collections.Shareds).create({
          'organization': organizationId,
          'name': result.data.name
        });
        return redirect(`/organizations/${organizationId}/script/shared/${created.id}`);
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            errors: {
              ...e.data.data,
              global: {
                message: e.data.message
              }
            }
          };
        }
      }
      break;
    }
  }
  return json({
    errors: {
      global: {
        message: 'Unknown error ...'
      }
    }
  });
}