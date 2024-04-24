import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { ClientResponseError } from 'pocketbase';

import { FormUsername } from '~/components/user/form-username';
import { FormAvatar } from '~/components/user/form-avatar';
import { FormPassword } from '~/components/user/form-password';
import { createSession, getPocketbase, getUser } from '~/utils/pb.server';
import { userPasswordFormSchema, userUsernameFormSchema } from '~/validation/user';
import { Collections } from '~/types/pocketbase';

export async function loader({ request }: LoaderFunctionArgs) {
  const pb = getPocketbase(request);
  const authuser = getUser(pb);

  if (!authuser) {
    return createSession('/login', pb);
  }

  const user = await pb.collection(Collections.Users).getOne(pb.authStore.model?.id);

  return json({
    user,
  });
}

export async function action(args: ActionFunctionArgs) {
  const pb = getPocketbase(args.request);
  const formData = await args.request.formData();
  const formValues = Object.fromEntries(formData);

  switch (formValues?._action) {
    case 'avatar': {
      switch (args.request.method) {
        case 'DELETE': {
          try {
            await pb.collection(Collections.Users)
              .update(
                pb.authStore.model?.id,
                {
                  avatar: null
                }
              );
            return null;
          } catch (e) {
            if (e instanceof ClientResponseError) {
              return {
                error: e.data.message,
                errors: e.data.data
              };
            }
          }
          break;
        }
        case 'POST': {
          try {
            await pb.collection(Collections.Users)
              .update(
                pb.authStore.model?.id,
                formData
              );
            return null;
          } catch (e) {
            if (e instanceof ClientResponseError) {
              return {
                error: e.data.message,
                errors: e.data.data
              };
            }
          }
          break;
        }
      }
      break;
    }
    case 'password': {
      const result = userPasswordFormSchema.safeParse(formValues);
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
        await pb.collection(Collections.Users)
          .update(
            pb.authStore.model?.id,
            {
              password: formValues.password,
              passwordConfirm: formValues.passwordConfirm,
              oldPassword: formValues.oldPassword
            }
          );
        return null;
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            error: e.data.message,
            errors: e.data.data
          };
        }
      }
      break;
    }
    case 'username': {
      const result = userUsernameFormSchema.safeParse(formValues);
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
        await pb.collection(Collections.Users)
          .update(
            pb.authStore.model?.id,
            {
              'name': formValues.name
            }
          );
        return null;
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            error: e.data.message,
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

export default function ProfilePage() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="grow flex flex-col gap-2">
      <FormUsername user={user} />
      <FormAvatar user={user} />
      <FormPassword />
    </div>
  );

}
