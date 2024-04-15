import { ClientResponseError } from 'pocketbase';
import { ActionFunctionArgs, json, redirect } from '@remix-run/node';
import { Link, NavLink, Outlet, useLoaderData } from '@remix-run/react';
import { v4 as uuid } from 'uuid';

import { moduleUpdateFormSchema } from '~/validation/module';
import { createSession, getPocketbase, getUser } from '~/utils/pb.server';
import { cn } from '~/utils/cn';
import { Collections, ModuleParamsResponse, ModulesResponse } from '~/types/pocketbase';
import { buttonVariants } from '~/components/ui/button';
import { Icons } from '~/components/icons';

export async function action(args: ActionFunctionArgs) {
  const pb = getPocketbase(args.request);
  const user = getUser(pb);

  if (!user) {
    return createSession('/login', pb);
  }

  const organizationId = args.params?.organizationId;
  const moduleId = args.params?.moduleId;


  if (!organizationId || !moduleId) {
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
        await pb.collection(Collections.Modules).delete(moduleId);
        return null;
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return json({
            errors: {
              ...e.data.data,
              global: {
                message: e.data.message
              }
            }
          });
        }
      }
      break;
    }
    case 'update': {
      const result = moduleUpdateFormSchema.safeParse(formValues);
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
        await pb.collection(Collections.Modules).update(
          moduleId,
          {
            code: result.data.code,
            name: result.data.name,
            sub: result.data.sub
          }
        );
        return redirect(`/organizations/${organizationId}/modules`);
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return json({
            errors: {
              ...e.data.data,
              global: {
                message: e.data.message
              }
            }
          });
        }
      }
      break;
    }
    case 'refresh': {
      try {
        await pb.collection(Collections.Modules).update(
          moduleId,
          {
            token: `${uuid()}`
          }
        );
        return null;
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return json({
            errors: {
              ...e.data.data,
              global: {
                message: e.data.message
              }
            }
          });
        }
      }
      break;
    }
    case 'eject': {
      try {
        return await pb.send(`/api/organization/${organizationId}/modules/${moduleId}/eject`, {
          method: "DELETE"
        })
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return json({
            errors: {
              ...e.data.data,
              global: {
                message: e.data.message
              }
            }
          });
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

export async function loader(args: ActionFunctionArgs) {
  const organizationId = args.params?.organizationId;
  const moduleId = args.params?.moduleId;

  if (!organizationId || !moduleId) {
    throw new Error('404');
  }

  const pb = getPocketbase(args.request);
  const user = getUser(pb);

  if (!user) {
    return createSession('/login', pb);
  }

  const module = await pb
    .collection(Collections.Modules)
    .getOne<ModulesResponse<{ module_params_via_module: ModuleParamsResponse[] }>>(
      moduleId,
      {
        expand: 'module_params_via_module',
        filter: `organization.id = "${organizationId}"`
      }
    );

  const organization = await pb
    .collection(Collections.Organizations)
    .getOne(organizationId);

  return json({
    organization,
    module
  });
}

export default function OrganizationIdScriptLayout() {
  const { module } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          Module {module.code} {module.name}
        </h1>
        <Link
          to={`/organizations/${module.organization}/modules`}
          className={cn(
            'flex gap-2',
            buttonVariants({ variant: 'default' })
          )}
        >
          <Icons.back className="h-4 w-4" />
          Back
        </Link>
      </div>
      <div className="flex gap-2 flex-wrap">
        <NavLink
          end
          to={`/organizations/${module.organization}/modules/${module.id}`}
          className={({ isActive }) => cn(
            buttonVariants({ variant: isActive ? 'default' : 'ghost' })
          )}
        >
          Module
        </NavLink>
        {
          module.expand?.module_params_via_module.map((param) => (
            <NavLink
              key={param.id}
              to={`/organizations/${module.organization}/modules/${module.id}/params/${param.id}`}
              className={({ isActive }) => cn(
                buttonVariants({ variant: isActive ? 'default' : 'ghost' })
              )}
            >
              Param {param.key}
            </NavLink>
          ))
        }
        <NavLink
          to={`/organizations/${module.organization}/modules/${module.id}/params/new`}
          className={({ isActive }) => cn(
            buttonVariants({ variant: isActive ? 'default' : 'ghost' })
          )}
        >
          New param
        </NavLink>
      </div>
      <Outlet />
    </div>
  );
}


