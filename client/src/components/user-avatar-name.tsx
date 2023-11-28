import { User } from "@prisma/client"
import { AvatarProps } from "@radix-ui/react-avatar"
import {UserAvatar} from "@/components/user-avatar";

import * as React from "react";

interface UserAvatarProps extends AvatarProps {
  user: Pick<User, "image" | "name"> | null
}

export function UserAvatarName({ user }: UserAvatarProps) {
  return (
    <div className="flex items-center gap-2">
      <UserAvatar
        user={{ name: user?.name || null, image: user?.image || null }}
        className="h-8 w-8"
      />
      {user?.name ?? '-'}
    </div>
  )
}
