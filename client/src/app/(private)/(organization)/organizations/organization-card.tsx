import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {buttonVariants} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import Link from "next/link";
import * as React from "react";
import {UserAvatarName} from "@/components/user-avatar-name";

type Props = {
  id: string,
  name: string,
  user: {
    id: string,
    name: string | null,
    image: string | null,
  } | null
}

export const OrganizationCard = ({id, name, user}: Props) => {
  return (
    <Card key={id} className="w-full">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <UserAvatarName user={user}/>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Link
          href={`organization/${id}`}
          className={cn(
            buttonVariants({variant: "default"})
          )}
        >
          Select
        </Link>
      </CardFooter>
    </Card>
  )
}