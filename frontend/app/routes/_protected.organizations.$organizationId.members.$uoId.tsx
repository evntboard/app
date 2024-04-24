import { ActionFunctionArgs, json } from '@remix-run/node';
import { ClientResponseError } from 'pocketbase';

import { createSession, getPocketbase, getUser } from '~/utils/pb.server';
import { Collections } from '~/types/pocketbase';
import { organizationAddMemberFormSchema, organizationUpdateMemberRoleFormSchema } from '~/validation/organization';

export async function action(args: ActionFunctionArgs) {
  const pb = getPocketbase(args.request);
  const user = getUser(pb);

  if (!user) {
    return createSession('/login', pb);
  }

  const organizationId = args.params?.organizationId;
  const uoId = args.params?.uoId;

  if (!organizationId || !uoId) {
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
    case 'delete': {
      try {
        await pb.collection(Collections.UserOrganization).delete(uoId);
        return null;
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            errors: e.data.data
          };
        }
      }
      break;
    }
    case 'update': {
      const result = organizationUpdateMemberRoleFormSchema.safeParse(formValues);
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
        await pb.collection(Collections.UserOrganization).update(
          uoId,
          {
            role: result.data.role
          }
        );
        return null;
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            errors: e.data.data
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