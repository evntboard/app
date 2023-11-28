"use client"

import * as React from "react"
import {useRouter} from "next/navigation"
import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import * as z from "zod"

import {cn} from "@/lib/utils"
import {userNameSchema} from "@/lib/validations/user"
import {buttonVariants} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {toast} from "@/components/ui/use-toast"
import {Icons} from "@/components/icons"

interface UserNameFormProps extends React.HTMLAttributes<HTMLFormElement> {
}

type FormData = z.infer<typeof userNameSchema>

export function OrganizationNewForm({className, ...props}: UserNameFormProps) {
  const router = useRouter()
  const {
    handleSubmit,
    register,
    formState: {errors},
  } = useForm<FormData>({
    resolver: zodResolver(userNameSchema),
    defaultValues: {
      name: "Default name",
    },
  })
  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  async function onSubmit(data: FormData) {
    setIsSaving(true)

    const response = await fetch(`/api/organization`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name,
      }),
    })

    setIsSaving(false)

    if (!response?.ok) {

      switch (response?.status) {
        case 402:
          return toast({
            title: "Something went wrong.",
            description: "Your organization was not created. Pro plan is required.",
            variant: "destructive",
          })
        default:
          return toast({
            title: "Something went wrong.",
            description: "Your organization was not created. Please try again.",
            variant: "destructive",
          })
      }
    }

    toast({
      description: "Your organization has been created.",
    })

    router.push("/organizations")
    router.refresh()
  }

  return (
    <form
      className={cn(className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <Card>
        <CardHeader>
          <CardTitle>Organization Name</CardTitle>
          <CardDescription>
            Please enter your organization name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="name">
              Name
            </Label>
            <Input
              id="name"
              className="w-[400px]"
              size={32}
              {...register("name")}
            />
            {errors?.name && (
              <p className="px-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <button
            type="submit"
            className={cn(buttonVariants(), className)}
            disabled={isSaving}
          >
            {isSaving && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>
            )}
            <span>Save</span>
          </button>
        </CardFooter>
      </Card>
    </form>
  )
}
