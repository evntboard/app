import { ActionFunctionArgs, json, redirect } from '@remix-run/node';
import { createSession, getPocketbase, getUser } from '~/utils/pb.server';
import { Collections, TriggerConditionsResponse, TriggersResponse } from '~/types/pocketbase';
import { ClientResponseError } from 'pocketbase';
import { triggerCreateFormSchema } from '~/validation/trigger';

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
      const result = triggerCreateFormSchema.safeParse(formValues);
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
        const created = await pb.collection(Collections.Triggers)
          .create<(TriggersResponse & { trigger_conditions_via_trigger: TriggerConditionsResponse[] })>(
            {
              'organization': organizationId,
              'name': result.data.name
            }
          );
        return redirect(`/organizations/${organizationId}/script/trigger/${created.id}`);
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
        return json({
          errors: {
            global: {
              message: 'Unknown error ...'
            }
          }
        });
      }
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