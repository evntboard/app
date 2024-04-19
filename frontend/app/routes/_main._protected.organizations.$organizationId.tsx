import { NavLink, Outlet, useParams } from '@remix-run/react';
import { ClientResponseError } from 'pocketbase';
import { Icons } from '~/components/icons';
import { cn } from '~/utils/cn';
import { buttonVariants } from '~/components/ui/button';
import { ActionFunctionArgs, json, redirect } from '@remix-run/node';
import { createSession, getPocketbase, getUser } from '~/utils/pb.server';
import { Collections } from '~/types/pocketbase';

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
  const formData = await args.request.formData();

  if (args.request.headers.get('content-type') === 'application/json') {
    formValues = await args.request.json();
  } else {
    formValues = Object.fromEntries(formData.entries());
  }

  switch (formValues?._action) {
    case 'name': {
      try {
        await pb.collection(Collections.Organizations)
          .update(
            organizationId,
            {
              'name': formData.get('name')
            }
          );
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            error: e.data.message,
            errors: e.data.data
          };
        }
      }
      return null;
    }
    case 'avatar': {
      switch (args.request.method) {
        case 'DELETE': {
          try {
            await pb.collection(Collections.Organizations)
              .update(
                organizationId,
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
            return null;
          }
        }
        case 'POST': {
          try {
            if (formData.get('avatar')) {
              await pb.collection(Collections.Organizations)
                .update(
                  organizationId,
                  formData
                );
            } else {
              await pb.collection(Collections.Organizations)
                .update(
                  organizationId,
                  {
                    avatar: null
                  }
                );
            }
            return null;
          } catch (e) {
            if (e instanceof ClientResponseError) {
              return {
                error: e.data.message,
                errors: e.data.data
              };
            }
            return null;
          }
        }
      }
      break
    }
    case 'delete': {
      try {
        await pb.collection(Collections.Organizations).delete(organizationId);
        return redirect('/organizations')
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return json({
            errors: {
              ...e.data.data,
              global: {
                message: e.data.message,
              },
            },
          })
        }
      }
      return null;
    }
  }
  return null;
}

export default function OrganizationIdGeneralLayout() {
  const { organizationId } = useParams();

  return (
    <div className="flex flex-col lg:flex-row lg:space-x-12 lg:space-y-0 h-full w-full max-w-full">
      <aside className="lg:w-1/5 shrink-0">
        <nav
          className={cn(
            'flex flex-wrap space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1'
          )}
        >
          {[
            {
              icon: <Icons.settings className="h-4 w-4 mr-2" />,
              title: 'General',
              href: `/organizations/${organizationId}`,
              end: true
            },
            {
              icon: <Icons.members className="h-4 w-4 mr-2" />,
              title: 'Members',
              href: `/organizations/${organizationId}/members`
            },
            {
              icon: <Icons.script className="h-4 w-4 mr-2" />,
              title: 'Script',
              href: `/organizations/${organizationId}/script`
            },
            {
              icon: <Icons.realtime className="h-4 w-4 mr-2" />,
              title: 'Realtime',
              href: `/organizations/${organizationId}/events`
            },
            {
              icon: <Icons.event className="h-4 w-4 mr-2" />,
              title: 'Custom events',
              href: `/organizations/${organizationId}/custom-events`
            },
            {
              icon: <Icons.storage className="h-4 w-4 mr-2" />,
              title: 'Storage',
              href: `/organizations/${organizationId}/storages`
            },
            {
              icon: <Icons.module className="h-4 w-4 mr-2" />,
              title: 'Module',
              href: `/organizations/${organizationId}/modules`
            }
          ].map((item) => {
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive, isPending }) => {
                  return cn(
                    buttonVariants({ variant: 'ghost' }),
                    isActive
                      ? 'bg-muted hover:bg-muted'
                      : 'hover:bg-transparent hover:underline',
                    'justify-start'
                  );
                }}
                end={item.end}
              >
                {item.icon ?? null}
                {item.title}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <Outlet />
    </div>
  );
}


